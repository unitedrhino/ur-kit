// 本文件核对公开数组位置筛选与原查询规则的一致性。
package schema

import (
	"reflect"
	"testing"
)

// TestParseArrayPositionFilter 覆盖单位置、范围、字段、通配、非法列表及前导零。
func TestParseArrayPositionFilter(t *testing.T) {
	for _, test := range []struct {
		identifier string
		want       ArrayPositionFilter
	}{
		{"temperature", ArrayPositionFilter{}},
		{"temperature.2", ArrayPositionFilter{Values: []int64{2}}},
		{"temperature.02.value", ArrayPositionFilter{Values: []int64{2}}},
		{"temperature.[1,3-4]", ArrayPositionFilter{Values: []int64{1, 3, 4}, IsRange: true}},
		{"temperature.[2]", ArrayPositionFilter{Values: []int64{2}, IsRange: true}},
		{"temperature.*", ArrayPositionFilter{}},
		{"temperature.status", ArrayPositionFilter{}},
		{"temperature.[3-1]", ArrayPositionFilter{}},
		{"temperature.00", ArrayPositionFilter{Values: []int64{0}}},
	} {
		if got := ParseArrayPositionFilter(test.identifier); !reflect.DeepEqual(got, test.want) {
			t.Errorf("%q: got=%+v, want=%+v", test.identifier, got, test.want)
		}
	}
}
