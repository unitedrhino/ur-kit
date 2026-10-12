// 本文件为 modbus 点位映射加载逻辑的单元测试。
//
// 覆盖范围：
//  1. ParsePointsJSON:产品协议配置 points JSON 的解析、identifier 关联物模型、
//     Quantity 计算、非法点位跳过、非法 JSON 报错;
//  2. AddPoint(旧 extendConfig 兼容方式):点位解析与 Quantity 计算;
//  3. Point.InitQuantity:各寄存器类型/数据类型位宽折算与字符串长度回退。
package event

import (
	"testing"

	"gitee.com/unitedrhino/protocol/modbus/internal/domain"
	"gitee.com/unitedrhino/things/share/domain/schema"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// genSchemaProperty 构造带指定 identifier 的物模型属性用于测试。
func genSchemaProperty(identifier string) schema.Property {
	return schema.Property{
		CommonParam: schema.CommonParam{
			Identifier: identifier,
			Tag:        schema.TagOptional,
			Name:       identifier,
		},
		Define: schema.Define{Type: schema.DataTypeInt},
	}
}

// TestParsePointsJSON 验证产品协议配置 points JSON 的解析与物模型关联。
func TestParsePointsJSON(t *testing.T) {
	properties := []schema.Property{genSchemaProperty("temperature"), genSchemaProperty("switch")}

	t.Run("正常解析并按identifier关联", func(t *testing.T) {
		points, err := ParsePointsJSON(properties, `[
			{"identifier":"temperature","address":0,"registerType":"HOLDING_REGISTER","valueType":"float32"},
			{"identifier":"switch","address":9,"registerType":"COIL"}
		]`)
		require.NoError(t, err)
		require.Len(t, points, 2)
		// float32 占 2 个寄存器
		assert.EqualValues(t, 2, points["temperature"].Quantity)
		assert.EqualValues(t, 0, points["temperature"].Address)
		assert.Equal(t, "temperature", points["temperature"].Schema.Identifier)
		// 线圈固定读 1 个
		assert.EqualValues(t, 1, points["switch"].Quantity)
	})

	t.Run("identifier不在物模型中跳过该点位", func(t *testing.T) {
		points, err := ParsePointsJSON(properties, `[
			{"identifier":"not-exist","address":0,"registerType":"COIL"},
			{"identifier":"switch","address":9,"registerType":"COIL"}
		]`)
		require.NoError(t, err)
		require.Len(t, points, 1)
		assert.Contains(t, points, "switch")
	})

	t.Run("点位参数非法跳过该点位", func(t *testing.T) {
		points, err := ParsePointsJSON(properties, `[
			{"identifier":"temperature","address":0,"registerType":"BAD_TYPE"},
			{"identifier":"switch","address":9,"registerType":"COIL"}
		]`)
		require.NoError(t, err)
		require.Len(t, points, 1)
	})

	t.Run("非法JSON整体报错", func(t *testing.T) {
		_, err := ParsePointsJSON(properties, `{bad json`)
		require.Error(t, err)
	})
}

// TestAddPointCompat 验证旧方式(物模型 extendConfig)点位解析保持兼容。
func TestAddPointCompat(t *testing.T) {
	prop := genSchemaProperty("temperature")
	prop.ExtendConfig = `{"address":0,"registerType":"HOLDING_REGISTER","valueType":"uint16"}`
	p, err := AddPoint(prop)
	require.NoError(t, err)
	assert.EqualValues(t, 1, p.Quantity)
	assert.Equal(t, "temperature", p.Schema.Identifier)
}

// TestPointInitQuantity 验证寄存器数量按数据类型位宽折算及字符串长度回退。
func TestPointInitQuantity(t *testing.T) {
	cases := []struct {
		name     string
		point    domain.Point
		schema   schema.Property
		wantQty  uint16
		wantErr  bool
	}{
		{name: "线圈", point: domain.Point{RegisterType: domain.Coil}, wantQty: 1},
		{name: "离散输入", point: domain.Point{RegisterType: domain.DiscreteInput}, wantQty: 1},
		{name: "uint16", point: domain.Point{RegisterType: domain.HoldingRegister, ValueType: domain.ValueTypeUint16}, wantQty: 1},
		{name: "int32", point: domain.Point{RegisterType: domain.InputRegister, ValueType: domain.ValueTypeInt32}, wantQty: 2},
		{name: "float64", point: domain.Point{RegisterType: domain.HoldingRegister, ValueType: domain.ValueTypeFloat64}, wantQty: 4},
		{
			name:    "字符串取StrLen",
			point:   domain.Point{RegisterType: domain.HoldingRegister, ValueType: domain.ValueTypeString, StrLen: 8},
			wantQty: 8,
		},
		{
			name:   "字符串无StrLen回退物模型Max",
			point:  domain.Point{RegisterType: domain.HoldingRegister, ValueType: domain.ValueTypeString},
			schema: schema.Property{Define: schema.Define{Max: "16"}},
			wantQty: 16,
		},
		{name: "不支持的寄存器类型", point: domain.Point{RegisterType: "BAD"}, wantErr: true},
		{name: "不支持的数据类型", point: domain.Point{RegisterType: domain.HoldingRegister, ValueType: "bad"}, wantErr: true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			p := c.point
			p.Schema = c.schema
			err := p.InitQuantity()
			if c.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.EqualValues(t, c.wantQty, p.Quantity)
		})
	}
}
