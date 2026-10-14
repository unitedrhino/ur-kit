// 本文件验证公开数组位置解析与原 Things SDK 的前导零兼容行为。
package schema

import "testing"

// TestGetArrayLegacyPosition 验证旧数据中的零前缀和符号位置仍可解析。
func TestGetArrayLegacyPosition(t *testing.T) {
	tests := []struct {
		identifier string
		name       string
		index      int
		ok         bool
	}{
		{"relay", "relay", 0, false},
		{"relay.0", "relay", 0, true},
		{"relay.", "relay", 0, true},
		{"relay.000", "relay", 0, true},
		{"relay.0002", "relay", 2, true},
		{"relay.00+2", "relay", 2, true},
		{"relay.00-2", "relay", -2, true},
		{"relay. 2", "relay", 0, false},
	}
	for _, tt := range tests {
		name, index, ok := GetArray(tt.identifier)
		if name != tt.name || index != tt.index || ok != tt.ok {
			t.Errorf("GetArray(%q) = (%q, %d, %v), want (%q, %d, %v)", tt.identifier, name, index, ok, tt.name, tt.index, tt.ok)
		}
	}
}
