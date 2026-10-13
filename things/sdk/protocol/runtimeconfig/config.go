// 本文件提供不依赖 SaaS 私有配置类型的协议运行配置合并。
package runtimeconfig

import (
	"bytes"
	"encoding/json"
	"errors"
	"strings"
)

// MergeConfigJSON 将 JSON 覆写合并到调用方类型；缺失字段保留原值，显式零值生效。
func MergeConfigJSON[T any](base T, overrideJSON string) (T, error) {
	if strings.TrimSpace(overrideJSON) == "" {
		return base, nil
	}
	var empty T
	if !json.Valid([]byte(overrideJSON)) || strings.TrimSpace(overrideJSON)[0] != '{' {
		return empty, errors.New("protocol configuration must be a JSON object")
	}
	// JSON 往返复制避免指针和 map 字段被覆写时修改调用方持有的基础配置。
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
