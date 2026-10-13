// 文件说明：验证 AI 能力视图严格按联动开关收口，保留完整模型及设备覆盖语义。
package schema

import (
	"encoding/json"
	"fmt"
	"reflect"
	"testing"
)

// TestForAISceneLinkageFlagMatrix 验证属性、事件、行为对负值、零值、关闭与未知值使用相同规则。
func TestForAISceneLinkageFlagMatrix(t *testing.T) {
	for _, flag := range []int64{-1, 0, 1, 2, 99} {
		t.Run(fmt.Sprintf("flag_%d", flag), func(t *testing.T) {
			raw := fmt.Sprintf(`{"properties":[{"identifier":"p","isCanSceneLinkage":%d}],"events":[{"identifier":"e","isCanSceneLinkage":%d}],"actions":[{"identifier":"a","dir":"down","isCanSceneLinkage":%d}]}`, flag, flag, flag)
			model, err := NewSchemaTsl([]byte(raw))
			if err != nil {
				t.Fatal(err)
			}
			original := model.String()
			view := model.ForAI()
			want := 0 // 只有明确值 1 开放，其他数值均不能被当作布尔真值。
			if flag == 1 {
				want = 1
			}
			if len(view.Properties) != want || len(view.Events) != want || len(view.Actions) != want ||
				len(view.Property) != want || len(view.Event) != want || len(view.Action) != want {
				t.Fatalf("flag=%d 过滤规则不一致: %s", flag, view.String())
			}
			if model.String() != original {
				t.Fatal("过滤修改了原始完整物模型")
			}
		})
	}
}

// TestForAISceneLinkageDirectionMatrix 验证只有下行和旧版空方向可执行，未知方向不能被默认放行。
func TestForAISceneLinkageDirectionMatrix(t *testing.T) {
	for _, dir := range []string{"", "down", "up", "unknown"} {
		t.Run("dir_"+dir, func(t *testing.T) {
			model, err := NewSchemaTsl([]byte(fmt.Sprintf(`{"actions":[{"identifier":"a","isCanSceneLinkage":1,"dir":%q}]}`, dir)))
			if err != nil {
				t.Fatal(err)
			}
			view := model.ForAI()
			want := dir == "" || dir == "down"
			if (view.Action["a"] != nil) != want {
				t.Fatalf("dir=%q 开放结果错误: %s", dir, view.String())
			}
		})
	}
}

// TestForAISceneLinkage 覆盖开启、关闭、零值、非法值、上行行为和索引/列表一致性。
func TestForAISceneLinkage(t *testing.T) {
	m, err := NewSchemaTsl([]byte(`{"properties":[
		{"identifier":"visible","isCanSceneLinkage":1},
		{"identifier":"hidden","isCanSceneLinkage":2},
		{"identifier":"unset"},
		{"identifier":"unknown","isCanSceneLinkage":99}
	],"actions":[
		{"identifier":"allowed","isCanSceneLinkage":1,"dir":"down"},
		{"identifier":"legacy","isCanSceneLinkage":1},
		{"identifier":"up","isCanSceneLinkage":1,"dir":"up"},
		{"identifier":"hiddenAction","isCanSceneLinkage":2}
	],"events":[
		{"identifier":"allowedEvent","isCanSceneLinkage":1},
		{"identifier":"hiddenEvent","isCanSceneLinkage":2}
	]}`))
	if err != nil {
		t.Fatal(err)
	}
	before := m.String()
	view := m.ForAI()
	if len(view.Properties) != 1 || len(view.Property) != 1 || view.Property["visible"] == nil || len(view.Events) != 1 || len(view.Actions) != 2 {
		t.Fatalf("过滤结果错误: %s", view.String())
	}
	for _, id := range []string{"hidden", "unset", "unknown"} {
		if view.Property[id] != nil {
			t.Fatalf("隐藏项仍有索引: %s", id)
		}
	}
	if view.Action["up"] != nil || view.Action["hiddenAction"] != nil || view.Event["hiddenEvent"] != nil {
		t.Fatal("行为/事件索引未收口")
	}
	view.Properties[0].Name = "视图修改"
	if m.String() != before {
		t.Fatal("过滤污染了完整模型，影响普通 App")
	}
	var nilModel *Model
	if got := nilModel.ForAI(); len(got.Property)+len(got.Action)+len(got.Event) != 0 {
		t.Fatal("空模型未安全返回")
	}
}

// TestForAIKeepsDeviceOverride 验证先聚合再过滤，设备关闭同名能力不会被产品开启项重新开放。
func TestForAIKeepsDeviceOverride(t *testing.T) {
	device, _ := NewSchemaTsl([]byte(`{"properties":[{"identifier":"volume","isCanSceneLinkage":2}],"actions":[{"identifier":"takePhoto","isCanSceneLinkage":2}]}`))
	product, _ := NewSchemaTsl([]byte(`{"properties":[{"identifier":"volume","isCanSceneLinkage":1},{"identifier":"battery","isCanSceneLinkage":1}],"actions":[{"identifier":"takePhoto","isCanSceneLinkage":1}]}`))
	combined := device.Copy().Aggregation(product)
	view := combined.ForAI()
	if len(view.Properties) != 1 || view.Property["battery"] == nil || view.Property["volume"] != nil || len(view.Actions) != 0 {
		t.Fatalf("设备关闭项被产品重新开放: %s", view.String())
	}
	if len(combined.Properties) != 2 || len(combined.Actions) != 1 {
		t.Fatal("普通设备完整能力被删除")
	}
}

// TestSceneLinkageJSONCompatible 验证原属性 JSON 字段位置不变，事件/行为复用同一元数据字段。
func TestSceneLinkageJSONCompatible(t *testing.T) {
	for _, raw := range []string{`{"properties":[{"identifier":"p","isCanSceneLinkage":2}]}`, `{"actions":[{"identifier":"a","isCanSceneLinkage":1}]}`, `{"events":[{"identifier":"e","isCanSceneLinkage":1}]}`} {
		m, err := NewSchemaTsl([]byte(raw))
		if err != nil {
			t.Fatal(err)
		}
		var round Model
		if err := json.Unmarshal([]byte(m.String()), &round); err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(m.Properties, round.Properties) || !reflect.DeepEqual(m.Actions, round.Actions) || !reflect.DeepEqual(m.Events, round.Events) {
			// NewSchemaTsl 为 action/event 增加非序列化索引，通过重建索引再比较。
			round.init()
			if !reflect.DeepEqual(m, &round) {
				t.Fatal("联动字段未稳定往返")
			}
		}
	}
}
