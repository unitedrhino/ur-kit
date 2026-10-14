// 本文件验证纯值协议合并入口不丢失大整数或修改原始嵌套配置。
package configmerge

import "testing"

// TestMergeConfigJSON 验证显式空值、局部覆写及基础配置隔离。
func TestMergeConfigJSON(t *testing.T) {
	type broker struct {
		ClientID string `json:"clientID"`
		Port     int64  `json:"port"`
	}
	type config struct {
		Broker *broker `json:"broker"`
	}
	base := config{Broker: &broker{ClientID: "local", Port: 9_007_199_254_740_993}}
	merged, err := MergeConfigJSON(base, `{"broker":{"clientID":""}}`)
	if err != nil || merged.Broker == nil || merged.Broker.ClientID != "" || merged.Broker.Port != base.Broker.Port {
		t.Fatalf("配置局部覆写失败: %+v %v", merged, err)
	}
	if base.Broker.ClientID != "local" {
		t.Fatal("合并修改了原配置")
	}
	cleared, err := MergeConfigJSON(base, `{"broker":null}`)
	if err != nil || cleared.Broker != nil {
		t.Fatalf("显式空值覆写失败: %+v %v", cleared, err)
	}
}
