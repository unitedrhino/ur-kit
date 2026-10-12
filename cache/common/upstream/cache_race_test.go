// 本文件对 caches 包的全局缓存注册表(cacheMap + cacheMutex)与 Cache 实例的
// 并发读取路径做并发回归:
//   - 多 goroutine 并发注册不同名缓存(NewCache 走 cacheMutex 写入 cacheMap)
//     并各自执行 GetData(otter 内存缓存 / redis / singleflight / 异步回写全路径)无 race;
//   - 并发以相同 KeyType 注册缓存时单例语义成立(全部返回同一实例)。
//
// store 依赖通过测试专用注入口 SetStoreForTest 注入基于 miniredis 的内存实现,
// 不依赖外部 redis,也不占用 InitStore 的一次性 sync.Once。
//
// 需 -race 才有完整意义:请以 `go test -race ./share/caches/...` 运行;
// 不带 -race 时仅能验证功能正确性,无法发现注册表与缓存读路径的数据竞态。
package caches

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	gocache "github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// setupRaceStore 注入基于 miniredis 的内存 store,供 GetData 的 redis 层使用
func setupRaceStore(t *testing.T) {
	t.Helper()
	mr := miniredis.RunT(t)
	SetStoreForTest(kv.NewStore(gocache.ClusterConf{
		{
			RedisConf: redis.RedisConf{
				Host: mr.Addr(),
				Type: redis.NodeType,
			},
			Weight: 100,
		},
	}))
}

// raceCacheLoader 返回一个固定取值的 loader:命中后同时触发异步回写 redis 路径
func raceCacheLoader() func(ctx context.Context, key string) (*string, error) {
	return func(ctx context.Context, key string) (*string, error) {
		v := "v-" + key
		return &v, nil
	}
}

// TestCache_并发注册不同名缓存无race 并发注册 32 个不同 KeyType 的缓存,
// 每个缓存执行两次 GetData:首次走 loader 并触发异步回写,第二次命中内存缓存。
// -race 下验证 cacheMap 注册、otter 读写、singleflight 与异步回写无数据竞态;
// 结束后校验注册表条目数与注册数一致(全部注册成功)。
// 需 -race 才有完整意义。
func TestCache_并发注册不同名缓存无race(t *testing.T) {
	setupRaceStore(t)

	const goroutines = 32
	// 注册表基线:只统计本测试新增的条目,不受其他测试残留影响
	baseLen := len(cacheMap)

	var wg sync.WaitGroup
	for g := 0; g < goroutines; g++ {
		wg.Add(1)
		go func(g int) {
			defer wg.Done()
			keyType := fmt.Sprintf("cache-race-uniq-%d-%d", time.Now().UnixNano(), g)
			c, err := NewCache(CacheConfig[string, string]{
				KeyType: keyType,
				GetData: raceCacheLoader(),
			})
			if err != nil {
				t.Errorf("并发注册缓存 %s 失败: %v", keyType, err)
				return
			}
			// 首次读取:内存/redis 均未命中,走 loader 并异步回写
			got, err := c.GetData(context.Background(), "k1")
			if err != nil {
				t.Errorf("首次 GetData 失败: %v", err)
				return
			}
			if got == nil || *got != "v-k1" {
				t.Errorf("首次 GetData 返回值错误: got=%v", got)
				return
			}
			// 二次读取:命中 otter 内存缓存(并发读路径)
			got, err = c.GetData(context.Background(), "k1")
			if err != nil {
				t.Errorf("二次 GetData 失败: %v", err)
				return
			}
			if got == nil || *got != "v-k1" {
				t.Errorf("二次 GetData 返回值错误: got=%v", got)
			}
		}(g)
	}
	wg.Wait()

	assert.Equal(t, baseLen+goroutines, len(cacheMap),
		"并发注册的 %d 个缓存应全部进入全局注册表", goroutines)
}

// TestCache_并发同名注册返回单例 并发以相同 KeyType 注册缓存:
// cacheMap 单例语义下全部调用应返回同一实例指针,且实例功能可用。
// 需 -race 才有完整意义(-race 下验证同名并发注册的锁语义)。
func TestCache_并发同名注册返回单例(t *testing.T) {
	setupRaceStore(t)

	keyType := fmt.Sprintf("cache-race-singleton-%d", time.Now().UnixNano())
	const goroutines = 16
	results := make([]*Cache[string, string], goroutines)
	var wg sync.WaitGroup
	for g := 0; g < goroutines; g++ {
		wg.Add(1)
		go func(g int) {
			defer wg.Done()
			c, err := NewCache(CacheConfig[string, string]{
				KeyType: keyType,
				GetData: raceCacheLoader(),
			})
			if err != nil {
				t.Errorf("同名并发注册失败: %v", err)
				return
			}
			results[g] = c
		}(g)
	}
	wg.Wait()

	for g := 1; g < goroutines; g++ {
		if results[g] == nil || results[0] == nil {
			t.Fatalf("第 %d 个调用未拿到实例", g)
		}
		assert.Same(t, results[0], results[g],
			"相同 KeyType 并发注册应全部返回同一单例实例")
	}

	// 单例实例功能可用
	got, err := results[0].GetData(context.Background(), "sk")
	require.NoError(t, err, "单例实例 GetData 应成功")
	require.NotNil(t, got, "单例实例 GetData 不应返回 nil")
	assert.Equal(t, "v-sk", *got)
}

// TestCache_并发读取同一缓存无race 多 goroutine 并发读取同一缓存实例的
// 同一批 key(部分命中内存、部分走 loader/singleflight),验证读路径并发安全。
// 需 -race 才有完整意义。
func TestCache_并发读取同一缓存无race(t *testing.T) {
	setupRaceStore(t)

	c, err := NewCache(CacheConfig[string, string]{
		KeyType: fmt.Sprintf("cache-race-read-%d", time.Now().UnixNano()),
		GetData: raceCacheLoader(),
	})
	require.NoError(t, err, "创建缓存失败")

	const goroutines = 16
	const perGoroutine = 25
	var errCount atomic.Int64
	var wg sync.WaitGroup
	for g := 0; g < goroutines; g++ {
		wg.Add(1)
		go func(g int) {
			defer wg.Done()
			for j := 0; j < perGoroutine; j++ {
				key := fmt.Sprintf("key-%d", j%10) // 有限 key 集合,制造 singleflight 合并与缓存命中交错
				got, err := c.GetData(context.Background(), key)
				if err != nil {
					errCount.Add(1)
					t.Errorf("并发 GetData key=%s 失败: %v", key, err)
					return
				}
				if got == nil || *got != "v-"+key {
					errCount.Add(1)
					t.Errorf("并发 GetData key=%s 返回值错误: got=%v", key, got)
					return
				}
			}
		}(g)
	}
	wg.Wait()

	assert.Equal(t, int64(0), errCount.Load(), "并发读取不应产生错误")
}
