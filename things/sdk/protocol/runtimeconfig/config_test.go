// 本文件验证运行配置合并保留默认值、支持显式零值并避免修改原始配置。
package runtimeconfig

import "testing"

// TestMergeConfigJSON 验证嵌套配置、空值覆写和大整数语义。
func TestMergeConfigJSON(t *testing.T) {
	type mqtt struct {
		Host    string `json:"host"`
		Port    int64  `json:"port"`
		Enabled bool   `json:"enabled"`
	}
	type config struct {
		MQTT  *mqtt             `json:"mqtt"`
		Extra map[string]string `json:"extra"`
	}
	base := config{MQTT: &mqtt{Host: "broker", Port: 9007199254740993, Enabled: true}, Extra: map[string]string{"keep": "yes"}}
	merged, err := MergeConfigJSON(base, `{"mqtt":{"port":0,"enabled":false},"extra":{"new":"value"}}`)
	if err != nil {
		t.Fatal(err)
	}
	if merged.MQTT.Host != "broker" || merged.MQTT.Port != 0 || merged.MQTT.Enabled || merged.Extra["keep"] != "yes" || merged.Extra["new"] != "value" {
		t.Fatalf("运行配置合并错误: %+v", merged)
	}
	if base.MQTT.Port != 9007199254740993 || !base.MQTT.Enabled || len(base.Extra) != 1 {
		t.Fatal("基础配置被覆写")
	}
	if _, err := MergeConfigJSON(base, `[]`); err == nil {
		t.Fatal("非对象配置仍被接纳")
	}
}
