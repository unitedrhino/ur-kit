// 本文件验证公开权限缓存的企业、项目隔离和失效后重新加载行为。
package platform

import (
	"context"
	"testing"
	"time"
)

// TestProjectPermissionCacheIsolationAndInvalidation 验证相同用户 ID 不跨企业共享权限。
func TestProjectPermissionCacheIsolationAndInvalidation(t *testing.T) {
	ctx := context.Background()
	loads := map[UserAuthKey]int{}
	projectID := int64(11)
	cache, err := NewProjectPermissionCache(time.Minute, func(_ context.Context, key UserAuthKey) ([]ProjectPermission, error) {
		loads[key]++
		return []ProjectPermission{{ProjectID: projectID, AuthType: 2}}, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	first := UserAuthKey{TenantCode: "first", UserID: 7}
	second := UserAuthKey{TenantCode: "second", UserID: 7}
	got, err := cache.Get(ctx, first)
	if err != nil || len(got) != 1 || got[0].ProjectID != 11 {
		t.Fatalf("first permission = %v, %v", got, err)
	}
	got[0].ProjectID = 99
	projectID = 12
	cache.Invalidate(first)
	got, err = cache.Get(ctx, first)
	if err != nil || len(got) != 1 || got[0].ProjectID != 12 || loads[first] != 2 {
		t.Fatalf("invalidated permission = %v, loads = %d, err = %v", got, loads[first], err)
	}
	got, err = cache.Get(ctx, second)
	if err != nil || len(got) != 1 || loads[second] != 1 {
		t.Fatalf("second tenant permission = %v, loads = %d, err = %v", got, loads[second], err)
	}
}

// TestAreaPermissionCacheProjectIsolation 验证相同企业用户的区域权限按项目分开。
func TestAreaPermissionCacheProjectIsolation(t *testing.T) {
	ctx := context.Background()
	loads := map[AreaAuthKey]int{}
	cache, err := NewAreaPermissionCache(time.Minute, func(_ context.Context, key AreaAuthKey) ([]AreaPermission, error) {
		loads[key]++
		return []AreaPermission{{AreaID: key.ProjectID * 10, AuthType: 1}}, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	first := AreaAuthKey{UserAuthKey: UserAuthKey{TenantCode: "tenant", UserID: 7}, ProjectID: 1}
	second := AreaAuthKey{UserAuthKey: first.UserAuthKey, ProjectID: 2}
	for _, key := range []AreaAuthKey{first, second, first} {
		got, err := cache.Get(ctx, key)
		if err != nil || len(got) != 1 || got[0].AreaID != key.ProjectID*10 {
			t.Fatalf("area permission for project %d = %v, %v", key.ProjectID, got, err)
		}
	}
	if loads[first] != 1 || loads[second] != 1 {
		t.Fatalf("unexpected loads: %v", loads)
	}
}
