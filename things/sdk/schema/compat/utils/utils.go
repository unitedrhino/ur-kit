// 本文件封装原物模型依赖的纯值转换，避免公开包导入 SaaS 内部工具。
package utils

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"math"
	"math/big"
	"strconv"
	"strings"

	"github.com/spf13/cast"
)

// Copy 按公开 JSON 字段复制源值到指定类型。
func Copy[T any](value any) *T {
	encoded, err := json.Marshal(value)
	if err != nil {
		return nil
	}
	var copied T
	if json.Unmarshal(encoded, &copied) != nil {
		return nil
	}
	return &copied
}

// MarshalNoErr 将可序列化值编码为 JSON 字符串。
func MarshalNoErr(value any) string { encoded, _ := json.Marshal(value); return string(encoded) }

// GetRandomKey 从非空映射中等概率选取键，空映射返回零值。
func GetRandomKey[K comparable, V any](items map[K]V) K {
	keys := make([]K, 0, len(items))
	for key := range items {
		keys = append(keys, key)
	}
	var zero K
	if len(keys) == 0 {
		return zero
	}
	index, err := rand.Int(rand.Reader, big.NewInt(int64(len(keys))))
	if err != nil {
		return zero
	}
	return keys[index.Int64()]
}

// RandString 生成指定长度的字母数字字符串。
func RandString(length int) string {
	if length <= 0 {
		return ""
	}
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	var result strings.Builder
	for index := 0; index < length; index++ {
		value, err := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		if err != nil {
			break
		}
		result.WriteByte(letters[value.Int64()])
	}
	return result.String()
}

// ToInt64 将平台可接受的数字值转为 64 位整数。
func ToInt64(value any) int64 { return cast.ToInt64(value) }

// ToBool 将平台可接受的布尔值转为 Go 布尔值。
func ToBool(value any) bool { return cast.ToBool(value) }

// ToString 将标量值转为字符串。
func ToString(value any) string { return cast.ToString(value) }

// ToStringMap 将对象值转为字符串键的映射。
func ToStringMap(value any) map[string]any {
	if original, ok := value.(map[string]string); ok {
		result := make(map[string]any, len(original))
		for key, item := range original {
			result[key] = item
		}
		return result
	}
	return cast.ToStringMap(value)
}

// Min 返回整数切片的最小值，空切片返回零。
func Min(values []int64) int64 {
	if len(values) == 0 {
		return 0
	}
	lowest := values[0]
	for _, value := range values[1:] {
		if value < lowest {
			lowest = value
		}
	}
	return lowest
}

// StepFloat 按原平台规则仅将数值舍入到步长的小数位数。
func StepFloat(value float64, step float64) float64 {
	if step == 0 || math.IsNaN(step) || math.IsInf(step, 0) {
		return value
	}
	text := strconv.FormatFloat(step, 'f', -1, 64)
	decimals := 0
	if dot := strings.IndexByte(text, '.'); dot >= 0 {
		decimals = len(text) - dot - 1
	}
	factor := math.Pow10(decimals)
	return math.Round(value*factor) / factor
}

// Unmarshal 用保留数值原文的 JSON 解码器读取模型值。
func Unmarshal(data []byte, target any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.UseNumber()
	return decoder.Decode(target)
}

// SliceIn 检查可比较值是否出现在候选集合中。
func SliceIn[T comparable](value T, candidates ...T) bool {
	for _, candidate := range candidates {
		if value == candidate {
			return true
		}
	}
	return false
}
