// 本文件提供物模型数组数据标识符的纯值解析，不依赖服务数据库。
package schema

import (
	"fmt"
	"strconv"
	"strings"
)

// GenArray 生成指定数组位置的数据标识符。
func GenArray(identifier string, index int) string { return fmt.Sprintf("%s.%d", identifier, index) }

// GetArray 解析单个数组位置；通配和范围查询由服务存储适配层处理。
func GetArray(identifier string) (name string, index int, ok bool) {
	parts := strings.Split(identifier, ".")
	if len(parts) < 2 {
		return identifier, 0, false
	}
	// 兼容 Things 的数组位置转换：先去掉前导零，再解析带符号的位置。
	position := strings.TrimLeft(parts[1], "0")
	if position == "" {
		return parts[0], 0, true
	}
	index, err := strconv.Atoi(position)
	if err != nil {
		return parts[0], 0, false
	}
	return parts[0], index, true
}
