// 本文件用隔离 Redis 验证 Core 企业缓存适配 ur-kit 后的键格式、身份与完整值。
package caches

import (
	"context"
	"strings"
	"testing"

	"gitee.com/unitedrhino/core/share/domain/tenant"
	sharecaches "gitee.com/unitedrhino/share/caches"
	"github.com/alicebob/miniredis/v2"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// TestTenantDirectoryGoZeroAdapter 验证批量校验、旧 Hash 键与大整数资料往返。
func TestTenantDirectoryGoZeroAdapter(t *testing.T) {
	server := miniredis.RunT(t)
	store := kv.NewStore(cache.ClusterConf{{RedisConf: redis.RedisConf{Host: server.Addr(), Type: redis.NodeType}, Weight: 100}})
	sharecaches.SetStoreForTest(store)
	ctx := context.Background()
	first := &tenant.Info{ID: 9_007_199_254_740_993, Code: "company-a", Name: "测试企业", OwnerUserID: 9_007_199_254_740_995}
	second := &tenant.Info{Code: "company-b", Name: "另一企业"}
	if err := InitTenant(ctx, first, &tenant.Info{Name: "缺少编码"}); err == nil {
		t.Fatal("身份无效的批次未被拒绝")
	}
	if server.Exists("tenant") {
		t.Fatal("无效批次发生部分写入")
	}
	if err := InitTenant(ctx, first, second); err != nil {
		t.Fatal(err)
	}
	raw := server.HGet("tenant", "company-a")
	if !strings.Contains(raw, `"id":9007199254740993`) || !strings.Contains(raw, `"ownerUserID":"9007199254740995"`) {
		t.Fatalf("原键格式或大整数资料丢失: %s", raw)
	}
	got, err := GetTenant(ctx, first.Code)
	if err != nil || got.ID != first.ID || got.OwnerUserID != first.OwnerUserID || got.Name != first.Name {
		t.Fatalf("企业资料往返错误: %+v %v", got, err)
	}
	if codes, err := GetTenantCodes(ctx); err != nil || len(codes) != 2 {
		t.Fatalf("企业编码列表错误: %v %v", codes, err)
	}
	first.Name = "更新企业"
	if err := SetTenant(ctx, first); err != nil {
		t.Fatal(err)
	}
	if got, err := GetTenant(ctx, first.Code); err != nil || got.Name != first.Name {
		t.Fatalf("单条更新错误: %+v %v", got, err)
	}
	if err := DelTenant(ctx, second.Code); err != nil {
		t.Fatal(err)
	}
	if _, err := GetTenant(ctx, second.Code); err == nil {
		t.Fatal("已删除企业仍可读取")
	}
	server.HSet("tenant", "company-a", `{"code":"company-b"}`)
	if _, err := GetTenant(ctx, first.Code); err == nil {
		t.Fatal("Hash 字段与资料编码不一致仍被接受")
	}
	server.HSet("tenant", "company-a", "")
	if _, err := GetTenant(ctx, first.Code); err == nil || !strings.Contains(err.Error(), "stored tenant") {
		t.Fatal("已存在的空 Hash 字段被误认为未命中")
	}
}
