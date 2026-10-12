// 本文件提供企业隔离的用户项目与区域权限缓存；权限来源由调用方注入。
package platform

import (
	"context"
	"errors"
	"time"

	"github.com/unitedrhino/ur-kit/cache/common"
)

// UserAuthKey 标识一个企业内的用户，避免不同企业的同名用户共用权限缓存。
type UserAuthKey struct {
	TenantCode string
	UserID     int64
}

// ProjectPermission 是用户对一个项目的权限，AuthType 与平台原始数值语义一致。
type ProjectPermission struct {
	ProjectID int64 `json:"projectID"`
	AuthType  int64 `json:"authType"`
}

// AreaPermission 是用户对项目内区域的权限，IsAuthChildren 与平台原始数值语义一致。
type AreaPermission struct {
	AreaID         int64  `json:"areaID"`
	AreaIDPath     string `json:"areaIDPath"`
	AuthType       int64  `json:"authType"`
	IsAuthChildren int64  `json:"isAuthChildren"`
}

// ProjectPermissionLoader 从可信来源读取用户项目权限。
type ProjectPermissionLoader func(context.Context, UserAuthKey) ([]ProjectPermission, error)

// ProjectPermissionCache 缓存按企业与用户隔离的项目权限列表。
type ProjectPermissionCache struct {
	cache *common.Cache[UserAuthKey, []ProjectPermission]
}

// NewProjectPermissionCache 使用正数 TTL 和可信加载器建立项目权限缓存。
func NewProjectPermissionCache(ttl time.Duration, loader ProjectPermissionLoader) (*ProjectPermissionCache, error) {
	if loader == nil {
		return nil, errors.New("project permission loader is required")
	}
	cache, err := common.NewCache(ttl, func(ctx context.Context, key UserAuthKey) ([]ProjectPermission, bool, error) {
		permissions, err := loader(ctx, key)
		return append([]ProjectPermission(nil), permissions...), true, err
	})
	if err != nil {
		return nil, err
	}
	return &ProjectPermissionCache{cache: cache}, nil
}

// Get 返回权限列表的副本，避免调用方修改缓存中的授权数据。
func (cache *ProjectPermissionCache) Get(ctx context.Context, key UserAuthKey) ([]ProjectPermission, error) {
	if key.TenantCode == "" || key.UserID <= 0 {
		return nil, errors.New("tenant code and user ID are required")
	}
	permissions, _, err := cache.cache.Get(ctx, key)
	return append([]ProjectPermission(nil), permissions...), err
}

// Invalidate 在权限变更后删除指定企业用户的缓存，并阻止在途旧数据回填。
func (cache *ProjectPermissionCache) Invalidate(key UserAuthKey) { cache.cache.Invalidate(key) }

// AreaAuthKey 标识一个企业用户在指定项目中的区域权限。
type AreaAuthKey struct {
	UserAuthKey
	ProjectID int64
}

// AreaPermissionLoader 从可信来源读取用户在项目中的区域权限。
type AreaPermissionLoader func(context.Context, AreaAuthKey) ([]AreaPermission, error)

// AreaPermissionCache 缓存按企业、用户、项目隔离的区域权限列表。
type AreaPermissionCache struct {
	cache *common.Cache[AreaAuthKey, []AreaPermission]
}

// NewAreaPermissionCache 使用正数 TTL 和可信加载器建立区域权限缓存。
func NewAreaPermissionCache(ttl time.Duration, loader AreaPermissionLoader) (*AreaPermissionCache, error) {
	if loader == nil {
		return nil, errors.New("area permission loader is required")
	}
	cache, err := common.NewCache(ttl, func(ctx context.Context, key AreaAuthKey) ([]AreaPermission, bool, error) {
		permissions, err := loader(ctx, key)
		return append([]AreaPermission(nil), permissions...), true, err
	})
	if err != nil {
		return nil, err
	}
	return &AreaPermissionCache{cache: cache}, nil
}

// Get 返回区域权限列表的副本，避免调用方修改缓存中的授权数据。
func (cache *AreaPermissionCache) Get(ctx context.Context, key AreaAuthKey) ([]AreaPermission, error) {
	if key.TenantCode == "" || key.UserID <= 0 || key.ProjectID <= 0 {
		return nil, errors.New("tenant code, user ID and project ID are required")
	}
	permissions, _, err := cache.cache.Get(ctx, key)
	return append([]AreaPermission(nil), permissions...), err
}

// Invalidate 在区域权限变更后删除指定范围的缓存，并阻止在途旧数据回填。
func (cache *AreaPermissionCache) Invalidate(key AreaAuthKey) { cache.cache.Invalidate(key) }
