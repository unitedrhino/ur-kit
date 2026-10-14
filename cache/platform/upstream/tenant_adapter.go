// 本文件适配平台既有 go-zero Redis 存储与 ur-kit 企业资料目录的 Hash 接口。
package caches

import (
	"context"
	"errors"

	sharecaches "gitee.com/unitedrhino/share/caches"
	"github.com/unitedrhino/ur-kit/cache/platform"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// tenantHashStore 将 go-zero Hash 操作交给公开企业目录。
type tenantHashStore struct{ store kv.Store }

// HashSet 写入单条企业资料，键由公开企业目录固定为 tenant。
func (adapter tenantHashStore) HashSet(ctx context.Context, key, field, value string) error {
	return adapter.store.HsetCtx(ctx, key, field, value)
}

// HashSetMany 写入经公开目录完整校验的一组企业资料。
func (adapter tenantHashStore) HashSetMany(ctx context.Context, key string, values map[string]string) error {
	return adapter.store.HmsetCtx(ctx, key, values)
}

// HashGet 读取企业资料；不存在时返回 found=false。
func (adapter tenantHashStore) HashGet(ctx context.Context, key, field string) (string, bool, error) {
	value, err := adapter.store.HgetCtx(ctx, key, field)
	if errors.Is(err, redis.Nil) {
		return "", false, nil
	}
	if err != nil || value != "" {
		return value, err == nil, err
	}
	// 空字段若真实存在，应交给企业目录报损坏数据，不能当作未命中。
	found, err := adapter.store.HexistsCtx(ctx, key, field)
	return value, found, err
}

// HashDelete 删除企业资料，忽略 Redis 返回的删除数量。
func (adapter tenantHashStore) HashDelete(ctx context.Context, key, field string) error {
	_, err := adapter.store.HdelCtx(ctx, key, field)
	return err
}

// HashKeys 返回已缓存的全部企业编码。
func (adapter tenantHashStore) HashKeys(ctx context.Context, key string) ([]string, error) {
	return adapter.store.HkeysCtx(ctx, key)
}

// newTenantDirectory 使用给定平台存储构造公开企业目录，供服务入口和隔离测试复用。
func newTenantDirectory(store kv.Store) (*platform.TenantDirectory, error) {
	if store == nil {
		return nil, errors.New("caches store 未初始化")
	}
	return platform.NewTenantDirectory(tenantHashStore{store: store})
}

// tenantDirectory 使用当前服务已初始化的共享 Redis 存储。
func tenantDirectory() (*platform.TenantDirectory, error) {
	return newTenantDirectory(sharecaches.GetStore())
}
