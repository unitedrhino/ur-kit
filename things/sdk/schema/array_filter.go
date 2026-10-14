// 本文件提供数组数据标识的位置筛选语义，由各数据库适配器自行生成查询条件。
package schema

import (
	"strconv"
	"strings"
)

// ArrayPositionFilter 保存单位置或范围列表；Values 为空表示不附加位置条件。
type ArrayPositionFilter struct {
	Values  []int64
	IsRange bool
}

// ParseArrayPositionFilter 按原物模型查询规则提取数组位置，不依赖 GORM 或 SQL 构造器。
// 第二段为通配符、字段名或非法范围时，返回空筛选以保持原查询兼容行为。
func ParseArrayPositionFilter(identifier string) ArrayPositionFilter {
	parts := strings.Split(identifier, ".")
	if len(parts) < 2 {
		return ArrayPositionFilter{}
	}
	position := strings.TrimLeft(parts[1], "0")
	if position == "" {
		return ArrayPositionFilter{Values: []int64{0}}
	}
	if value, err := strconv.Atoi(position); err == nil {
		return ArrayPositionFilter{Values: []int64{int64(value)}}
	}
	if parts[1] == "*" {
		return ArrayPositionFilter{}
	}
	values, err := parseNumberRange(parts[1])
	if err != nil {
		return ArrayPositionFilter{}
	}
	return ArrayPositionFilter{Values: values, IsRange: true}
}
