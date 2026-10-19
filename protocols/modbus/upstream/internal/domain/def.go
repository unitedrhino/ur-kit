// 本文件定义 Modbus 设备会话、寄存器类型与点位编码配置。
package domain

import (
	"context"
	"fmt"
	"strings"

	"gitee.com/unitedrhino/things/share/domain/schema"
	"github.com/spf13/cast"
	sdkmodbus "github.com/unitedrhino/ur-kit/protocols/modbus"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"sync"
)

// DevInfo 保存设备采集生命周期、配置点位与可替换的公开 SDK 会话。
type DevInfo struct {
	Duration int64 //采集周期,单位毫秒 默认为10秒
	Di       *dm.DeviceInfo
	Cli      *sdkmodbus.Client // 当前会话绑定的设备读写客户端
	Session  *sdkmodbus.Session // 当前持久连接；由 SetSession 负责释放
	CliMutex sync.RWMutex // 保护采集与下行控制对会话指针的并发访问
	Point    map[string]*Point
	Cfg      map[string]string
	Close    context.Context
	ErrCount int64
	C        func()
}

type RegisterType string

const (
	Coil            RegisterType = "COIL"             // 线圈
	DiscreteInput   RegisterType = "DISCRETE_INPUT"   // 离散输入
	InputRegister   RegisterType = "INPUT_REGISTER"   // 输入寄存器
	HoldingRegister RegisterType = "HOLDING_REGISTER" // 保持寄存器
)

type ValueType = string

const (
	ValueTypeString  = "string"
	ValueTypeUint16  = "uint16"
	ValueTypeUint32  = "uint32"
	ValueTypeUint64  = "uint64"
	ValueTypeInt16   = "int16"
	ValueTypeInt32   = "int32"
	ValueTypeInt64   = "int64"
	ValueTypeFloat32 = "float32"
	ValueTypeFloat64 = "float64"
)

/*
参考:
{
"address": 0,
"registerType": "COIL"
}

{
"address": 9,
"registerType": "HOLDING_REGISTER",
"valueType": "uint16"
}

*/

type Point struct {
	Schema schema.Property `json:"-"`
	// Identifier 物模型属性标识符。点位配置存于产品协议配置(dm_product_info.protocol_conf
	// 的 points key,JSON 数组)时用于关联物模型属性;旧的物模型 extendConfig 方式无需填写
	Identifier   string       `json:"identifier"`
	Address      uint16       `json:"address"`
	RegisterType RegisterType `json:"registerType"`
	//该配置无需设置
	Quantity uint16 `json:"-"`
	// BitLen 表示在位操作中，要操作的连续位的长度。
	// 例如 BitLen 为 2 表示要操作 2 个连续的位。
	// 结合 Bit 字段，可以精确地定位和操作寄存器中的特定位范围。
	Bit uint8 `json:"bit"`
	// BitLen 表示在位操作中，要操作的连续位的长度。
	// 例如 BitLen 为 2 表示要操作 2 个连续的位。
	// 结合 Bit 字段，可以精确地定位和操作寄存器中的特定位范围。
	BitLen uint8  `json:"bitLen"`
	StrLen uint16 `json:"strLen"`
	// ValueType 表示点位数据的原始类型。
	// 它指定了该点位存储的数据类型，如整数、浮点数、字符串等。
	// 在进行数据读写时，需要根据该类型进行相应的编码和解码操作。
	ValueType ValueType `json:"valueType"` //字段类型
	// ByteSwap 表示是否需要进行字节交换。
	// 在不同的系统或设备中，字节序可能不同（大端序或小端序）。
	// 当 ByteSwap 为 true 时，会对数据的字节顺序进行交换，以确保数据的正确传输和解析。
	ByteSwap bool `json:"byteSwap"`
	// WordSwap 表示是否需要进行字交换。
	// 与字节交换类似，字交换通常用于处理多字节数据（如 32 位或 64 位数据）的字节序问题。
	// 当 WordSwap 为 true 时，会对数据的字顺序进行交换。
	WordSwap bool `json:"wordSwap"`
	// MultiWrite 表示写操作是否强制要求使用多寄存器写接口。
	// 某些设备虽然点位只占据一个寄存器地址，但要求采用多寄存器写接口来进行写入操作。
	// 当 MultiWrite 为 true 时，会使用多寄存器写接口进行写操作。
	MultiWrite bool `json:"multiWrite"`
}

// InitQuantity 根据寄存器类型与数据类型计算点位需要读写的寄存器数量(Quantity)。
// 线圈/离散输入固定读 1 个;寄存器类型按 ValueType 位宽折算(16 位 1 个、32 位 2 个、
// 64 位 4 个);字符串类型优先取 StrLen,未配置时回退物模型定义的 Max 长度。
// 入参 Schema 需提前赋值(字符串回退依赖 Schema.Define.Max)。
func (p *Point) InitQuantity() error {
	switch p.RegisterType {
	case Coil, DiscreteInput: // 线圈及离散输入仅支持读一个
		p.Quantity = 1
	case InputRegister, HoldingRegister:
		switch strings.ToUpper(string(p.ValueType)) {
		case strings.ToUpper(ValueTypeUint16), strings.ToUpper(ValueTypeInt16):
			p.Quantity = 1
		case strings.ToUpper(ValueTypeUint32), strings.ToUpper(ValueTypeInt32), strings.ToUpper(ValueTypeFloat32):
			p.Quantity = 2
		case strings.ToUpper(ValueTypeUint64), strings.ToUpper(ValueTypeInt64), strings.ToUpper(ValueTypeFloat64):
			p.Quantity = 4
		case strings.ToUpper(ValueTypeString):
			p.Quantity = p.StrLen
			if p.Quantity == 0 {
				p.Quantity = cast.ToUint16(p.Schema.Define.Max)
			}
		default:
			return fmt.Errorf("unsupported raw type %s", p.ValueType)
		}
	default:
		return fmt.Errorf("unsuported register type: %s", p.RegisterType)
	}
	return nil
}
