// 本文件提供纯值协议运行配置合并，供不需要 Things protobuf 的服务使用。
package configmerge

import (
	"bytes"
	"encoding/json"
	"errors"
	"strings"
)

// MergeConfigJSON 将对象 JSON 覆写到调用方类型，保留缺失字段并应用显式零值、空值。
func MergeConfigJSON[T any](base T, overrideJSON string) (T, error) {
	if strings.TrimSpace(overrideJSON) == "" {
		return base, nil
	}
	var empty T
	if !json.Valid([]byte(overrideJSON)) || strings.TrimSpace(overrideJSON)[0] != '{' {
		return empty, errors.New("protocol configuration must be a JSON object")
	}
	// JSON 往返复制保证嵌套指针和映射的局部覆写不会修改调用方原配置。
	encoded, err := json.Marshal(base)
	if err != nil {
		return empty, err
	}
	var merged T
	if err := json.Unmarshal(encoded, &merged); err != nil {
		return empty, err
	}
	decoder := json.NewDecoder(bytes.NewBufferString(overrideJSON))
	decoder.UseNumber()
	if err := decoder.Decode(&merged); err != nil {
		return empty, err
	}
	return merged, nil
}
