// Package schema 验证物模型标识解析与规范化规则。
package schema

import "testing"

func TestNormalizeArrayDataID(t *testing.T) {
	tests := []struct {
		name       string
		identifier string
		want       string
	}{
		{name: "移除数组位置前导零", identifier: "relay.02", want: "relay.2"},
		{name: "保留规范数组位置", identifier: "relay.2", want: "relay.2"},
		{name: "兼容数组结构体字段", identifier: "channels.002.enabled", want: "channels.2.enabled"},
		{name: "保留结构体字段", identifier: "location.longitude", want: "location.longitude"},
		{name: "保留数组通配符", identifier: "relay.*", want: "relay.*"},
		{name: "保留数组范围", identifier: "relay.1,2", want: "relay.1,2"},
		{name: "保留普通属性", identifier: "temperature", want: "temperature"},
		{name: "保留非法负数位置", identifier: "relay.-1", want: "relay.-1"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := NormalizeArrayDataID(tt.identifier); got != tt.want {
				t.Fatalf("NormalizeArrayDataID(%q) = %q, want %q", tt.identifier, got, tt.want)
			}
		})
	}
}
