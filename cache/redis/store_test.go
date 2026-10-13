// 本文件验证 Redis 适配器的 TTL、删除及超大消息 ID 原子单调更新。
package redisstore

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// TestStore 验证业务缓存的基础 Redis 操作与游标不回退语义。
func TestStore(t *testing.T) {
	server := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: server.Addr()})
	t.Cleanup(func() { _ = client.Close() })
	store, err := NewStore(client)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	if err := store.SetTTL(ctx, "online", "node-1", 20*time.Second); err != nil {
		t.Fatal(err)
	}
	if value, err := client.Get(ctx, "online").Result(); err != nil || value != "node-1" {
		t.Fatalf("在线节点错误: %q %v", value, err)
	}
	if err := store.Delete(ctx, "online"); err != nil {
		t.Fatal(err)
	}
	if server.Exists("online") {
		t.Fatal("在线节点未删除")
	}
	const high int64 = 9_223_372_036_854_775_001
	const low int64 = 9_007_199_254_740_993
	var wait sync.WaitGroup
	for _, value := range []int64{high, low, high - 1, low + 1} {
		wait.Add(1)
		go func(value int64) {
			defer wait.Done()
			if _, err := store.MaxTTL(ctx, "cursor", value, 7*24*time.Hour); err != nil {
				t.Error(err)
			}
		}(value)
	}
	wait.Wait()
	value, found, err := store.GetInt64(ctx, "cursor")
	if err != nil || !found || value != high {
		t.Fatalf("游标回退或丢精度: value=%d found=%v err=%v", value, found, err)
	}
	server.FastForward(7*24*time.Hour + time.Second)
	_, found, err = store.GetInt64(ctx, "cursor")
	if err != nil || found {
		t.Fatalf("游标 TTL 错误: found=%v err=%v", found, err)
	}
}
