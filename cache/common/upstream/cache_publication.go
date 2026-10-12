// 文件说明：缓存单实例的有界发布屏障；防止失效后旧loader、旧singleflight或异步Redis写污染后继读取。
// 不为分布式Redis写和远端事件建立强一致协议；数据库回源和业务通知不得持有本屏障。
package caches

import (
	"context"
	"time"
)

// cachePublicationBudget 限制发布锁等待及Redis操作的总预算，原调用者更短截止仍优先。
const cachePublicationBudget = 2 * time.Second

// withPublication 串行有限缓存操作；锁等待和IO使用同一有界ctx，不延长原调用者期限。
func (c *Cache[dataT, keyType]) withPublication(ctx context.Context, operation func(context.Context) error) error {
	bounded, cancel := context.WithTimeout(ctx, cachePublicationBudget)
	defer cancel()
	select {
	case c.publication <- struct{}{}:
		defer func() { <-c.publication }()
	case <-bounded.Done():
		return bounded.Err()
	}
	if err := bounded.Err(); err != nil {
		return err
	}
	return operation(bounded)
}

// publishMemory 仅在原捕获代次仍有效时发布回源结果；过期或取消的原请求只返回自身结果，不缓存。
func (c *Cache[dataT, keyType]) publishMemory(ctx context.Context, generation uint64, key string, data *dataT) bool {
	published := false
	_ = c.withPublication(ctx, func(context.Context) error {
		if c.generation.Load() == generation {
			c.cache.Set(key, data)
			published = true
		}
		return nil
	})
	return published
}
