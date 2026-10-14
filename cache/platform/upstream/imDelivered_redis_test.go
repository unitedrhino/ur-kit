// 本文件用真实 Redis 协议的内存服务验证公共游标与 go-zero 存储适配。
package caches

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/unitedrhino/ur-kit/cache/platform"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// TestDeliveredCursorGoZeroRedis 验证超大 ID 的原子最大值、原有键格式与七天过期。
func TestDeliveredCursorGoZeroRedis(t *testing.T) {
	server := miniredis.RunT(t)
	store := kv.NewStore(cache.ClusterConf{{RedisConf: redis.RedisConf{Host: server.Addr(), Type: redis.NodeType}, Weight: 100}})
	cursor, err := platform.NewDeliveredCursor(deliveredKVStore{store: store})
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	const high int64 = 9_223_372_036_854_775_001
	const low int64 = 9_007_199_254_740_993
	var wait sync.WaitGroup
	for _, value := range []int64{high, low, high - 1, low + 1} {
		wait.Add(1)
		go func(value int64) {
			defer wait.Done()
			if _, err := cursor.Set(ctx, "demo", 42, 55, value); err != nil {
				t.Error(err)
			}
		}(value)
	}
	wait.Wait()
	got, err := cursor.Get(ctx, "demo", 42, 55)
	if err != nil || got != high {
		t.Fatalf("最大游标 = %d, err=%v, want %d", got, err, high)
	}
	if value, err := server.Get("im:delivered:demo:42:55"); err != nil || value != "9223372036854775001" {
		t.Fatalf("兼容键值 = %q, err=%v", value, err)
	}
	server.FastForward(7*24*time.Hour + time.Second)
	got, err = cursor.Get(ctx, "demo", 42, 55)
	if err != nil || got != 0 {
		t.Fatalf("游标过期后 = %d, err=%v, want 0", got, err)
	}
}
