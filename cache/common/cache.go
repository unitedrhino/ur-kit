// 本文件提供无 SaaS 私有依赖的通用有界 TTL 缓存及失效屏障。
package common

import (
	"context"
	"errors"
	"sync"
	"time"
)

// Loader 在缓存缺失时获取数据；返回值为数据、是否存在与错误。
type Loader[K comparable, V any] func(context.Context, K) (V, bool, error)

// Entry 保存数据、过期时间与发布代次。
type Entry[V any] struct {
	Value     V
	ExpiresAt time.Time
	Version   uint64
}

// Cache 是线程安全的 TTL 缓存；失效代次阻止旧回源数据重新发布。
type Cache[K comparable, V any] struct {
	mu      sync.Mutex
	values  map[K]Entry[V]
	version uint64
	ttl     time.Duration
	loader  Loader[K, V]
}

// NewCache 建立 TTL 缓存；TTL 和 loader 必须有效。
func NewCache[K comparable, V any](ttl time.Duration, loader Loader[K, V]) (*Cache[K, V], error) {
	if ttl <= 0 || loader == nil {
		return nil, errors.New("positive TTL and loader are required")
	}
	return &Cache[K, V]{values: make(map[K]Entry[V]), ttl: ttl, loader: loader}, nil
}

// Get 返回缓存值或调用 loader；若期间发生失效则不发布旧值。
func (cache *Cache[K, V]) Get(ctx context.Context, key K) (V, bool, error) {
	for {
		if err := ctx.Err(); err != nil {
			var empty V
			return empty, false, err
		}
		cache.mu.Lock()
		if entry, ok := cache.values[key]; ok && time.Now().Before(entry.ExpiresAt) {
			cache.mu.Unlock()
			return entry.Value, true, nil
		}
		version := cache.version
		cache.mu.Unlock()
		value, found, err := cache.loader(ctx, key)
		cache.mu.Lock()
		if cache.version != version {
			cache.mu.Unlock()
			continue
		}
		if err == nil && found {
			cache.values[key] = Entry[V]{Value: value, ExpiresAt: time.Now().Add(cache.ttl), Version: version}
		}
		cache.mu.Unlock()
		return value, found, err
	}
}

// Invalidate 删除指定键，并推进代次以阻止在途旧回源重新写入。
func (cache *Cache[K, V]) Invalidate(key K) {
	cache.mu.Lock()
	cache.version++
	delete(cache.values, key)
	cache.mu.Unlock()
}

// Set 更新缓存值，并推进代次以防在途旧回源覆盖新值。
func (cache *Cache[K, V]) Set(key K, value V) {
	cache.mu.Lock()
	cache.version++
	cache.values[key] = Entry[V]{Value: value, ExpiresAt: time.Now().Add(cache.ttl), Version: cache.version}
	cache.mu.Unlock()
}
