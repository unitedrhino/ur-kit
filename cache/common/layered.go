// 本文件提供可注入 Redis 与事件总线的三级业务缓存，保持平台缓存键和失效主题兼容。
package common

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"sync"
	"sync/atomic"
	"time"

	"golang.org/x/sync/singleflight"
)

// LayeredStore 是可替换的二级键值缓存；未命中与存储错误由调用方区分。
type LayeredStore interface {
	GetString(context.Context, string) (string, bool, error)
	SetTTL(context.Context, string, string, time.Duration) error
	SetNXTTL(context.Context, string, string, time.Duration) (bool, error)
	Delete(context.Context, string) error
}

// InvalidationBus 发布和接收平台缓存失效事件；回调中的键是缓存键的原始字符串形式。
type InvalidationBus interface {
	Subscribe(string, func(context.Context, string) error) error
	Publish(context.Context, string, string) error
}

// LayeredOptions 定义缓存名称、有效期、回源与可注入的外部依赖。
type LayeredOptions[K comparable, V any] struct {
	Name       string
	TTL        time.Duration
	MaxEntries int
	Key        func(K) string
	Loader     Loader[K, V]
	Format     func(context.Context, K, V) (V, error)
	Store      LayeredStore
	Bus        InvalidationBus
}

// layeredEntry 保存不可变的 JSON 快照及本地到期时间。
type layeredEntry struct {
	data      []byte
	found     bool
	expiresAt time.Time
}

// layeredResult 是一次缓存回源的不可变结果。
type layeredResult struct {
	data  []byte
	found bool
}

// LayeredCache 提供本地内存、外部存储和业务加载器三级读取及代次失效屏障。
type LayeredCache[K comparable, V any] struct {
	options     LayeredOptions[K, V]
	mu          sync.Mutex
	values      map[string]layeredEntry
	generation  atomic.Uint64
	publication chan struct{}
	flight      singleflight.Group
}

// NewLayeredCache 创建有界缓存并订阅平台兼容的失效主题。
func NewLayeredCache[K comparable, V any](options LayeredOptions[K, V]) (*LayeredCache[K, V], error) {
	if isNilDependency(options.Store) {
		options.Store = nil
	}
	if isNilDependency(options.Bus) {
		options.Bus = nil
	}
	if options.Name == "" || options.TTL <= 0 || (options.Loader == nil && options.Store == nil) {
		return nil, errors.New("cache name, positive TTL and loader or store are required")
	}
	if options.MaxEntries <= 0 {
		options.MaxEntries = 10_000
	}
	if options.Key == nil {
		options.Key = func(key K) string { return fmt.Sprint(key) }
	}
	cache := &LayeredCache[K, V]{options: options, values: make(map[string]layeredEntry), publication: make(chan struct{}, 1)}
	if options.Bus != nil {
		if err := options.Bus.Subscribe(cache.topic(), func(ctx context.Context, key string) error {
			return cache.invalidateLocal(ctx, key)
		}); err != nil {
			return nil, err
		}
	}
	return cache, nil
}

// Get 返回独立 JSON 解码的数据副本；存储失败时尝试业务回源。
func (cache *LayeredCache[K, V]) Get(ctx context.Context, key K) (V, bool, error) {
	var zero V
	if err := ctx.Err(); err != nil {
		return zero, false, err
	}
	keyString := cache.options.Key(key)
	cache.mu.Lock()
	entry, ok := cache.values[keyString]
	cache.mu.Unlock()
	if ok && time.Now().Before(entry.expiresAt) {
		return cache.decode(ctx, key, entry.data, entry.found)
	}
	generation := cache.generation.Load()
	flightKey := fmt.Sprintf("%d:%s", generation, keyString)
	resultCh := cache.flight.DoChan(flightKey, func() (any, error) {
		return cache.load(ctx, key, keyString, generation)
	})
	select {
	case <-ctx.Done():
		return zero, false, ctx.Err()
	case result := <-resultCh:
		if result.Err != nil {
			return zero, false, result.Err
		}
		loaded := result.Val.(layeredResult)
		return cache.decode(ctx, key, loaded.data, loaded.found)
	}
}

// Set 更新本地和二级存储，并在发布锁外通知其他实例失效。
func (cache *LayeredCache[K, V]) Set(ctx context.Context, key K, value V) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	keyString := cache.options.Key(key)
	err = cache.withPublication(ctx, func(bounded context.Context) error {
		cache.generation.Add(1)
		cache.remember(keyString, data, true)
		if cache.options.Store != nil {
			return cache.options.Store.SetTTL(bounded, cache.storeKey(keyString), string(data), cache.options.TTL)
		}
		return nil
	})
	return errors.Join(err, cache.publish(ctx, keyString))
}

// Invalidate 删除指定键并广播失效；旧的在途加载不会重新发布。
func (cache *LayeredCache[K, V]) Invalidate(ctx context.Context, key K) error {
	keyString := cache.options.Key(key)
	err := cache.withPublication(ctx, func(bounded context.Context) error {
		cache.generation.Add(1)
		cache.mu.Lock()
		delete(cache.values, keyString)
		cache.mu.Unlock()
		if cache.options.Store != nil {
			return cache.options.Store.Delete(bounded, cache.storeKey(keyString))
		}
		return nil
	})
	return errors.Join(err, cache.publish(ctx, keyString))
}

// load 按二级存储、业务加载器顺序读取，代次变化时仅返回给原请求。
func (cache *LayeredCache[K, V]) load(ctx context.Context, key K, keyString string, generation uint64) (layeredResult, error) {
	if cache.options.Store != nil {
		data, found, err := cache.options.Store.GetString(ctx, cache.storeKey(keyString))
		if err == nil && found {
			if !json.Valid([]byte(data)) {
				return layeredResult{}, errors.New("invalid cached JSON")
			}
			cache.publishMemory(ctx, generation, keyString, []byte(data), true)
			return layeredResult{data: []byte(data), found: true}, nil
		}
	}
	if cache.options.Loader == nil {
		cache.publishMemory(ctx, generation, keyString, nil, false)
		return layeredResult{}, nil
	}
	value, found, err := cache.options.Loader(ctx, key)
	if err != nil {
		return layeredResult{}, err
	}
	var data []byte
	if found {
		data, err = json.Marshal(value)
		if err != nil {
			return layeredResult{}, err
		}
	}
	_ = cache.withPublication(ctx, func(bounded context.Context) error {
		if cache.generation.Load() != generation {
			return nil
		}
		cache.remember(keyString, data, found)
		if found && cache.options.Store != nil {
			_, err := cache.options.Store.SetNXTTL(bounded, cache.storeKey(keyString), string(data), cache.options.TTL)
			return err
		}
		return nil
	})
	return layeredResult{data: data, found: found}, nil
}

// publishMemory 仅在捕获代次仍有效时保存二级缓存结果。
func (cache *LayeredCache[K, V]) publishMemory(ctx context.Context, generation uint64, key string, data []byte, found bool) {
	_ = cache.withPublication(ctx, func(context.Context) error {
		if cache.generation.Load() == generation {
			cache.remember(key, data, found)
		}
		return nil
	})
}

// remember 写入有界本地缓存；满额时淘汰任意旧键。
func (cache *LayeredCache[K, V]) remember(key string, data []byte, found bool) {
	cache.mu.Lock()
	defer cache.mu.Unlock()
	if _, exists := cache.values[key]; !exists && len(cache.values) >= cache.options.MaxEntries {
		for oldest := range cache.values {
			delete(cache.values, oldest)
			break
		}
	}
	cache.values[key] = layeredEntry{data: append([]byte(nil), data...), found: found, expiresAt: time.Now().Add(cache.options.TTL/3 + time.Nanosecond)}
}

// invalidateLocal 接收其他实例事件，只删除本地缓存以避免广播循环。
func (cache *LayeredCache[K, V]) invalidateLocal(ctx context.Context, key string) error {
	return cache.withPublication(ctx, func(context.Context) error {
		cache.generation.Add(1)
		cache.mu.Lock()
		delete(cache.values, key)
		cache.mu.Unlock()
		return nil
	})
}

// withPublication 用同一个有界上下文串行提交缓存变更与二级存储写入。
func (cache *LayeredCache[K, V]) withPublication(ctx context.Context, operation func(context.Context) error) error {
	bounded, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	select {
	case cache.publication <- struct{}{}:
		defer func() { <-cache.publication }()
	case <-bounded.Done():
		return bounded.Err()
	}
	if err := bounded.Err(); err != nil {
		return err
	}
	return operation(bounded)
}

// publish 在本地发布锁外发出失效通知，允许同步事件回调再次读取缓存。
func (cache *LayeredCache[K, V]) publish(ctx context.Context, key string) error {
	if cache.options.Bus == nil {
		return nil
	}
	return cache.options.Bus.Publish(ctx, cache.topic(), key)
}

// storeKey 保持平台原有的二级缓存键前缀。
func (cache *LayeredCache[K, V]) storeKey(key string) string {
	return "cache:" + cache.options.Name + ":" + key
}

// topic 保持平台原有的跨实例失效主题。
func (cache *LayeredCache[K, V]) topic() string {
	return "server.cache.sync." + cache.options.Name
}

// decode 把缓存快照解码为独立副本，并应用调用方指定的展示转换。
func (cache *LayeredCache[K, V]) decode(ctx context.Context, key K, data []byte, found bool) (V, bool, error) {
	var value V
	if !found {
		return value, false, nil
	}
	if err := json.Unmarshal(data, &value); err != nil {
		return value, false, err
	}
	if cache.options.Format != nil {
		var err error
		value, err = cache.options.Format(ctx, key, value)
		if err != nil {
			return value, false, err
		}
	}
	return value, true, nil
}

// isNilDependency 识别包在接口中的空指针，避免未初始化适配器引发运行时崩溃。
func isNilDependency(value any) bool {
	if value == nil {
		return true
	}
	reflected := reflect.ValueOf(value)
	switch reflected.Kind() {
	case reflect.Chan, reflect.Func, reflect.Interface, reflect.Map, reflect.Ptr, reflect.Slice:
		return reflected.IsNil()
	}
	return false
}
