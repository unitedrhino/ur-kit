// 本文件验证在线节点期限、企业隔离及 IM 已送达游标的并发单调性。
package platform

import (
	"context"
	"sync"
	"testing"
	"time"
)

// memoryPresenceStore 是测试用的原子键值存储，不对外提供实现。
type memoryPresenceStore struct {
	mu     sync.Mutex
	values map[string]int64
	ttls   map[string]time.Duration
}

// SetTTL 记录在线节点及其期限。
func (store *memoryPresenceStore) SetTTL(_ context.Context, key, value string, ttl time.Duration) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	if store.ttls == nil {
		store.ttls = make(map[string]time.Duration)
	}
	if store.values == nil {
		store.values = make(map[string]int64)
	}
	store.ttls[key] = ttl
	store.values[key] = int64(len(value))
	return nil
}

// Delete 删除在线节点记录。
func (store *memoryPresenceStore) Delete(_ context.Context, key string) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	delete(store.values, key)
	return nil
}

// MaxTTL 原子推进游标并记录过期时间。
func (store *memoryPresenceStore) MaxTTL(_ context.Context, key string, value int64, ttl time.Duration) (int64, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	if store.values == nil {
		store.values = make(map[string]int64)
	}
	if store.ttls == nil {
		store.ttls = make(map[string]time.Duration)
	}
	if value > store.values[key] {
		store.values[key] = value
	}
	store.ttls[key] = ttl
	return store.values[key], nil
}

// GetInt64 返回指定游标及存在状态。
func (store *memoryPresenceStore) GetInt64(_ context.Context, key string) (int64, bool, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	value, found := store.values[key]
	return value, found, nil
}

// TestOnlineStoreScopeAndTTL 验证在线节点按企业隔离并保留原 20 秒期限。
func TestOnlineStoreScopeAndTTL(t *testing.T) {
	ctx := context.Background()
	store := &memoryPresenceStore{}
	cache, err := NewUserOnlineCache(store)
	if err != nil {
		t.Fatal(err)
	}
	for _, tenant := range []string{"first", "second"} {
		if err := cache.SetUser(ctx, tenant, 7, 11); err != nil {
			t.Fatal(err)
		}
	}
	store.mu.Lock()
	first := store.ttls["user:online:first:7"]
	second := store.ttls["user:online:second:7"]
	store.mu.Unlock()
	if first != 20*time.Second || second != 20*time.Second {
		t.Fatalf("unexpected TTL: first=%s second=%s", first, second)
	}
	if err := cache.DeleteUser(ctx, "first", 7); err != nil {
		t.Fatal(err)
	}
	store.mu.Lock()
	_, firstFound := store.values["user:online:first:7"]
	_, secondFound := store.values["user:online:second:7"]
	store.mu.Unlock()
	if firstFound || !secondFound {
		t.Fatalf("tenant isolation failed: first=%v second=%v", firstFound, secondFound)
	}
}

// TestDeliveredCursorMonotonic 验证并发乱序 ACK 不回退游标。
func TestDeliveredCursorMonotonic(t *testing.T) {
	ctx := context.Background()
	store := &memoryPresenceStore{}
	cursor, err := NewDeliveredCursor(store)
	if err != nil {
		t.Fatal(err)
	}
	var group sync.WaitGroup
	for id := int64(1); id <= 100; id++ {
		group.Add(1)
		go func(msgID int64) {
			defer group.Done()
			if _, err := cursor.Set(ctx, "tenant", 7, 9, msgID); err != nil {
				t.Error(err)
			}
		}(id)
	}
	group.Wait()
	got, err := cursor.Get(ctx, "tenant", 7, 9)
	if err != nil || got != 100 {
		t.Fatalf("cursor = %d, err = %v", got, err)
	}
	store.mu.Lock()
	ttl := store.ttls["im:delivered:tenant:7:9"]
	store.mu.Unlock()
	if ttl != 7*24*time.Hour {
		t.Fatalf("unexpected TTL: %s", ttl)
	}
	other, err := cursor.Get(ctx, "another", 7, 9)
	if err != nil || other != 0 {
		t.Fatalf("other tenant cursor = %d, err = %v", other, err)
	}
}
