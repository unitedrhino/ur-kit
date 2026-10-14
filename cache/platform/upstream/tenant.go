// 本文件将 Core 企业资料缓存接到 ur-kit 公共 Hash 机制，保留现有入口与 tenant 键格式。
package caches

import (
	"context"
	"encoding/json"
	"errors"

	"gitee.com/unitedrhino/core/share/domain/tenant"
)

// InitTenant 一次写入全部企业资料，任一条身份不符时整批拒绝。
func InitTenant(ctx context.Context, tenants ...*tenant.Info) error {
	if len(tenants) == 0 {
		return nil
	}
	directory, err := tenantDirectory()
	if err != nil {
		return err
	}
	values := make(map[string]json.RawMessage, len(tenants))
	for _, info := range tenants {
		if info == nil {
			return errors.New("企业资料不能为空")
		}
		encoded, err := json.Marshal(info)
		if err != nil {
			return err
		}
		values[info.Code] = encoded
	}
	return directory.SetMany(ctx, values)
}

// SetTenant 保存完整企业资料，公开目录核对资料内编码与 Hash 字段一致。
func SetTenant(ctx context.Context, info *tenant.Info) error {
	if info == nil {
		return errors.New("企业资料不能为空")
	}
	directory, err := tenantDirectory()
	if err != nil {
		return err
	}
	encoded, err := json.Marshal(info)
	if err != nil {
		return err
	}
	return directory.Set(ctx, info.Code, encoded)
}

// DelTenant 从原 tenant Hash 中删除企业资料。
func DelTenant(ctx context.Context, code string) error {
	directory, err := tenantDirectory()
	if err != nil {
		return err
	}
	return directory.Delete(ctx, code)
}

// GetTenant 读取完整企业资料，不存在或内容损坏时返回错误。
func GetTenant(ctx context.Context, code string) (*tenant.Info, error) {
	directory, err := tenantDirectory()
	if err != nil {
		return nil, err
	}
	encoded, found, err := directory.Get(ctx, code)
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, errors.New("企业资料不存在")
	}
	var info tenant.Info
	if err := json.Unmarshal(encoded, &info); err != nil {
		return nil, err
	}
	return &info, nil
}

// GetTenantCodes 返回当前 Redis Hash 中的全部企业编码。
func GetTenantCodes(ctx context.Context) ([]string, error) {
	directory, err := tenantDirectory()
	if err != nil {
		return nil, err
	}
	return directory.Codes(ctx)
}

// DoToTenantMap 保留原批量序列化入口，供历史调用方构造 tenant Hash 值。
func DoToTenantMap(tenants ...*tenant.Info) map[string]string {
	result := make(map[string]string, len(tenants))
	for _, info := range tenants {
		encoded, _ := json.Marshal(info)
		result[info.Code] = string(encoded)
	}
	return result
}
