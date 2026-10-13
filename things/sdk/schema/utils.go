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
	index, err := strconv.Atoi(parts[1])
	if err != nil {
		return parts[0], 0, false
	}
	return parts[0], index, true
}
