// 本文件提供依赖注入的企业信息缓存；企业来源由调用方验证和加载。
package platform

import (
	"context"
	"time"

	"github.com/unitedrhino/ur-kit/cache/common"
)

// Tenant 是公开且稳定的企业身份字段；业务扩展字段由调用方保存。
type Tenant struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// TenantLoader 根据企业编码读取可信企业信息。
type TenantLoader func(context.Context, string) (Tenant, bool, error)

// TenantCache 包装通用缓存，避免业务层直接操作缓存键。
type TenantCache struct {
	cache *common.Cache[string, Tenant]
}

// NewTenantCache 按 TTL 和可信加载器创建企业缓存。
func NewTenantCache(ttl time.Duration, loader TenantLoader) (*TenantCache, error) {
	cache, err := common.NewCache(ttl, common.Loader[string, Tenant](loader))
	if err != nil {
		return nil, err
	}
	return &TenantCache{cache: cache}, nil
}

// Get 按编码读取企业信息，返回是否存在。
func (cache *TenantCache) Get(ctx context.Context, code string) (Tenant, bool, error) {
	return cache.cache.Get(ctx, code)
}

// Invalidate 在企业信息变更后使指定编码失效。
func (cache *TenantCache) Invalidate(code string) { cache.cache.Invalidate(code) }
