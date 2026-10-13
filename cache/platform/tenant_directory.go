// 本文件提供与平台既有 tenant Redis Hash 兼容的企业资料缓存。
package platform

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
)

// TenantHashStore 提供企业资料 Hash 的最小读写接口，由接入方注入。
type TenantHashStore interface {
	HashSet(context.Context, string, string, string) error
	HashSetMany(context.Context, string, map[string]string) error
	HashGet(context.Context, string, string) (string, bool, error)
	HashDelete(context.Context, string, string) error
	HashKeys(context.Context, string) ([]string, error)
}

// TenantDirectory 读写原平台 tenant Hash，保留完整业务 JSON 字段。
type TenantDirectory struct{ store TenantHashStore }

// NewTenantDirectory 创建企业资料缓存，要求调用方提供存储实现。
func NewTenantDirectory(store TenantHashStore) (*TenantDirectory, error) {
	if store == nil {
		return nil, errors.New("tenant hash store is required")
	}
	return &TenantDirectory{store: store}, nil
}

// Set 按企业编码写入完整 JSON，校验 JSON 内的 code 与 Hash 字段一致。
func (directory *TenantDirectory) Set(ctx context.Context, code string, value json.RawMessage) error {
	if err := validateTenantJSON(code, value); err != nil {
		return err
	}
	return directory.store.HashSet(ctx, "tenant", code, string(value))
}

// SetMany 在全部数据通过校验后一次写入多个企业资料。
func (directory *TenantDirectory) SetMany(ctx context.Context, values map[string]json.RawMessage) error {
	if len(values) == 0 {
		return nil
	}
	encoded := make(map[string]string, len(values))
	for code, value := range values {
		if err := validateTenantJSON(code, value); err != nil {
			return err
		}
		encoded[code] = string(value)
	}
	return directory.store.HashSetMany(ctx, "tenant", encoded)
}

// Get 读取企业完整 JSON；不存在时返回 found=false。
func (directory *TenantDirectory) Get(ctx context.Context, code string) (value json.RawMessage, found bool, err error) {
	if code == "" {
		return nil, false, errors.New("tenant code is required")
	}
	raw, found, err := directory.store.HashGet(ctx, "tenant", code)
	if err != nil || !found {
		return nil, found, err
	}
	value = json.RawMessage(raw)
	if err := validateTenantJSON(code, value); err != nil {
		return nil, false, fmt.Errorf("stored tenant %s: %w", code, err)
	}
	return append(json.RawMessage(nil), value...), true, nil
}

// Delete 删除企业资料缓存中的指定编码。
func (directory *TenantDirectory) Delete(ctx context.Context, code string) error {
	if code == "" {
		return errors.New("tenant code is required")
	}
	return directory.store.HashDelete(ctx, "tenant", code)
}

// Codes 返回目前已缓存的全部企业编码。
func (directory *TenantDirectory) Codes(ctx context.Context) ([]string, error) {
	return directory.store.HashKeys(ctx, "tenant")
}

// validateTenantJSON 防止缓存字段与资料内身份不一致，并保留其他字段原始字节。
func validateTenantJSON(code string, value json.RawMessage) error {
	if code == "" || !json.Valid(value) {
		return errors.New("tenant code and valid JSON are required")
	}
	var identity struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(value, &identity); err != nil || identity.Code != code {
		return fmt.Errorf("tenant JSON code does not match %q", code)
	}
	return nil
}
