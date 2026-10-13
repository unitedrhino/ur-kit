// 本文件通过 Redis 模拟器和同步事件总线验证三级缓存与跨实例失效。
package common_test

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/unitedrhino/ur-kit/cache/common"
	redisstore "github.com/unitedrhino/ur-kit/cache/redis"
)

// syncBus 模拟同进程同步分发，以检查发布回调不会死锁。
type syncBus struct {
	mu          sync.Mutex
	subscribers map[string][]func(context.Context, string) error
}

// Subscribe 登记缓存失效订阅。
func (bus *syncBus) Subscribe(topic string, callback func(context.Context, string) error) error {
	bus.mu.Lock()
	defer bus.mu.Unlock()
	if bus.subscribers == nil {
		bus.subscribers = make(map[string][]func(context.Context, string) error)
	}
	bus.subscribers[topic] = append(bus.subscribers[topic], callback)
	return nil
}

// Publish 同步通知订阅者；订阅者可在回调内再获取缓存。
func (bus *syncBus) Publish(ctx context.Context, topic, key string) error {
	bus.mu.Lock()
	callbacks := append([]func(context.Context, string) error(nil), bus.subscribers[topic]...)
	bus.mu.Unlock()
	for _, callback := range callbacks {
		if err := callback(ctx, key); err != nil {
			return err
		}
	}
	return nil
}

// failingStore 模拟 Redis 故障以验证业务回源降级。
type failingStore struct{}

// GetString 返回模拟读取失败。
func (failingStore) GetString(context.Context, string) (string, bool, error) {
	return "", false, errors.New("redis unavailable")
}

// SetTTL 返回模拟写入失败。
func (failingStore) SetTTL(context.Context, string, string, time.Duration) error {
	return errors.New("redis unavailable")
}

// SetNXTTL 返回模拟条件写入失败。
func (failingStore) SetNXTTL(context.Context, string, string, time.Duration) (bool, error) {
	return false, errors.New("redis unavailable")
}

// Delete 返回模拟删除失败。
func (failingStore) Delete(context.Context, string) error { return errors.New("redis unavailable") }

// TestLayeredCacheInvalidationBarrier 验证写入后旧回源不能污染随后读取。
func TestLayeredCacheInvalidationBarrier(t *testing.T) {
	started, release := make(chan struct{}), make(chan struct{})
	cache, err := common.NewLayeredCache(common.LayeredOptions[string, string]{
		Name: "device", TTL: time.Minute,
		Loader: func(context.Context, string) (string, bool, error) {
			close(started)
			<-release
			return "old", true, nil
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan struct{})
	go func() {
		defer close(done)
		_, _, _ = cache.Get(context.Background(), "one")
	}()
	<-started
	if err := cache.Set(t.Context(), "one", "new"); err != nil {
		t.Fatal(err)
	}
	close(release)
	<-done
	value, found, err := cache.Get(t.Context(), "one")
	if err != nil || !found || value != "new" {
		t.Fatalf("旧回源污染缓存: value=%q found=%t err=%v", value, found, err)
	}
}

// TestLayeredCacheRedisAndEvents 验证两实例共享 Redis 和失效主题，返回值互不污染。
func TestLayeredCacheRedisAndEvents(t *testing.T) {
	server := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: server.Addr()})
	t.Cleanup(func() { _ = client.Close() })
	store, err := redisstore.NewStore(client)
	if err != nil {
		t.Fatal(err)
	}
	bus := &syncBus{}
	var loads atomic.Int64
	newCache := func() *common.LayeredCache[string, map[string]string] {
		cache, createErr := common.NewLayeredCache(common.LayeredOptions[string, map[string]string]{
			Name: "tenant", TTL: time.Minute, Store: store, Bus: bus,
			Loader: func(context.Context, string) (map[string]string, bool, error) {
				loads.Add(1)
				return map[string]string{"name": "database"}, true, nil
			},
		})
		if createErr != nil {
			t.Fatal(createErr)
		}
		return cache
	}
	first, second := newCache(), newCache()
	if err := first.Set(t.Context(), "a", map[string]string{"name": "current"}); err != nil {
		t.Fatal(err)
	}
	if raw, err := server.Get("cache:tenant:a"); err != nil || raw != `{"name":"current"}` {
		t.Fatalf("Redis 键或内容不兼容: raw=%q err=%v", raw, err)
	}
	value, found, err := second.Get(t.Context(), "a")
	if err != nil || !found || value["name"] != "current" || loads.Load() != 0 {
		t.Fatalf("二级缓存未命中: value=%v found=%t err=%v loads=%d", value, found, err, loads.Load())
	}
	value["name"] = "mutated"
	value, _, _ = second.Get(t.Context(), "a")
	if value["name"] != "current" {
		t.Fatalf("返回值污染缓存快照: %v", value)
	}
	if err := first.Invalidate(t.Context(), "a"); err != nil {
		t.Fatal(err)
	}
	value, found, err = second.Get(t.Context(), "a")
	if err != nil || !found || value["name"] != "database" || loads.Load() != 1 {
		t.Fatalf("跨实例失效后未回源: value=%v found=%t err=%v loads=%d", value, found, err, loads.Load())
	}
}

// TestLayeredCacheRedisFailureFallsBack 验证二级存储故障不阻断业务数据读取。
func TestLayeredCacheRedisFailureFallsBack(t *testing.T) {
	cache, err := common.NewLayeredCache(common.LayeredOptions[string, string]{
		Name: "device", TTL: time.Minute, Store: failingStore{},
		Loader: func(context.Context, string) (string, bool, error) { return "database", true, nil },
	})
	if err != nil {
		t.Fatal(err)
	}
	value, found, err := cache.Get(t.Context(), "a")
	if err != nil || !found || value != "database" {
		t.Fatalf("Redis 故障未回源: value=%q found=%t err=%v", value, found, err)
	}
}

// TestLayeredCacheFormatAndTypedNil 验证展示转换不污染缓存，空接口适配器可安全降级。
func TestLayeredCacheFormatAndTypedNil(t *testing.T) {
	var missingBus *syncBus
	var missingStore *redisstore.Store
	cache, err := common.NewLayeredCache(common.LayeredOptions[string, map[string]string]{
		Name: "tenant", TTL: time.Minute, Bus: missingBus, Store: missingStore,
		Loader: func(context.Context, string) (map[string]string, bool, error) {
			return map[string]string{"name": "raw"}, true, nil
		},
		Format: func(_ context.Context, _ string, value map[string]string) (map[string]string, error) {
			value["name"] += "!"
			return value, nil
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	for range 2 {
		value, found, getErr := cache.Get(t.Context(), "a")
		if getErr != nil || !found || value["name"] != "raw!" {
			t.Fatalf("转换或空依赖处理错误: value=%v found=%t err=%v", value, found, getErr)
		}
	}
}
