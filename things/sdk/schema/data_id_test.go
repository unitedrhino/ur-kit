// 本文件验证公开数组数据标识与物模型名称映射的兼容语义。
package schema

import (
	"reflect"
	"testing"
)

// TestParseDataIDAndName 验证单位置、范围、通配和结构体字段的解析与名称。
func TestParseDataIDAndName(t *testing.T) {
	for _, test := range []struct {
		input  string
		id     string
		nums   []int64
		column string
	}{
		{input: "relay.02", id: "relay", nums: []int64{2}},
		{input: "relay.[1,3-4].enabled", id: "relay", nums: []int64{1, 3, 4}, column: "enabled"},
		{input: "relay.*", id: "relay"},
		{input: "location.longitude", id: "location", column: "longitude"},
	} {
		got, err := ParseDataID(test.input)
		if err != nil || got.ID != test.id || got.Column != test.column || !reflect.DeepEqual(got.Nums, test.nums) {
			t.Fatalf("%q 解析错误: %+v %v", test.input, got, err)
		}
	}
	if _, err := ParseDataID("relay.bad.enabled"); err == nil {
		t.Fatal("三段式非法范围未拒绝")
	}
	if _, err := ParseDataID("relay.[3-1].enabled"); err == nil {
		t.Fatal("逆序范围未拒绝")
	}
	model, err := NewSchemaTsl([]byte(`{"properties":[{"identifier":"relay","name":"继电器","define":{"type":"array","arrayInfo":{"type":"struct","specs":[{"identifier":"enabled","name":"开关","dataType":{"type":"bool"}}]}}}]}`))
	if err != nil {
		t.Fatal(err)
	}
	if got := GetDataName(model, "relay.02.enabled"); got != "继电器.02.开关" {
		t.Fatalf("名称映射错误: %s", got)
	}
}
