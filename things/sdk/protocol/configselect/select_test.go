// 本文件验证主协议与子协议配置的选择及映射引用语义。
package configselect

import "testing"

// TestSelect 验证配置字段按产品的子协议归属选取，且不复制调用方映射。
func TestSelect(t *testing.T) {
	main := map[string]string{"source": "main"}
	sub := map[string]string{"source": "sub"}
	modbus := "modbus"
	if got := Select("modbus", &modbus, main, sub); got["source"] != "sub" {
		t.Fatalf("子协议配置错误: %v", got)
	} else {
		got["selected"] = "yes"
		if sub["selected"] != "yes" {
			t.Fatal("子协议配置未沿用原映射")
		}
	}
	if got := Select("mqtt", &modbus, main, sub); got["source"] != "main" {
		t.Fatalf("主协议配置错误: %v", got)
	} else {
		got["selected"] = "yes"
		if main["selected"] != "yes" {
			t.Fatal("主协议配置未沿用原映射")
		}
	}
	if got := Select("", nil, main, sub); got["source"] != "main" {
		t.Fatalf("未配置子协议应选择主协议: %v", got)
	}
	empty := ""
	if got := Select("", &empty, main, sub); got["source"] != "sub" {
		t.Fatalf("显式空子协议代码应保留旧选择语义: %v", got)
	}
}
