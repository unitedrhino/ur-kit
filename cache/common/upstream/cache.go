// 文件说明：三级共享缓存；本实例以有界发布屏障防止失效后的旧回源和异步回填污染后继读取。
package caches

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"reflect"
	"sync"
	"sync/atomic"
	"time"

	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/eventBus"
	"gitee.com/unitedrhino/share/utils"
	"github.com/maypok86/otter"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/syncx"
)

var NeedCache = true

type FastFunc = func(ctx context.Context, t time.Time, body []byte) error
type Event interface {
	Subscribe(topic string, f FastFunc) error
	Publish(ctx context.Context, topic string, arg any) error
}

type Cache[dataT any, keyType comparable] struct {
	keyType        string
	cache          otter.Cache[string, *dataT]
	fastEvent      Event
	getData        func(ctx context.Context, key keyType) (*dataT, error)
	notifyCallback []func(ctx context.Context, key []byte)
	fmt            func(ctx context.Context, key keyType, data *dataT) *dataT
	expireTime     time.Duration
	sf             syncx.SingleFlight
	generation     atomic.Uint64 // 有界实例代次；任一失效取消旧回填，不维护无界每键账本。
	publication    chan struct{} // 仅串行缓存发布/失效，不在数据库loader期间持有。
}

type CacheConfig[dataT any, keyType comparable] struct {
	KeyType    string
	FastEvent  Event
	Fmt        func(ctx context.Context, key keyType, data *dataT) *dataT
	GetData    func(ctx context.Context, key keyType) (*dataT, error)
	ExpireTime time.Duration
}

var (
	cacheMap   = map[string]any{}
	cacheMutex sync.Mutex
)

func NewCache[dataT any, keyType comparable](cfg CacheConfig[dataT, keyType]) (*Cache[dataT, keyType], error) {
	cacheMutex.Lock() //单例模式
	defer cacheMutex.Unlock()
	if v, ok := cacheMap[cfg.KeyType]; ok {
		return v.(*Cache[dataT, keyType]), nil
	}
	// 过期时间先归一化（默认 10 分钟+随机抖动），再构建内存缓存；否则默认配置下 WithTTL 会拿到约 1 纳秒，内存缓存被静默禁用
	expireTime := cfg.ExpireTime
	if expireTime == 0 {
		expireTime = time.Minute*10 + time.Second*time.Duration(rand.Int63n(60))
	}
	cache, err := otter.MustBuilder[string, *dataT](10_000).
		CollectStats().
		Cost(func(key string, value *dataT) uint32 {
			return 1
		}).
		WithTTL(expireTime/3 + 1).
		Build()
	if err != nil {
		return nil, err
	}
	ret := Cache[dataT, keyType]{
		publication: make(chan struct{}, 1),
		sf:          syncx.NewSingleFlight(),
		keyType:     cfg.KeyType,
		cache:       cache,
		fastEvent:   cfg.FastEvent,
		getData:     cfg.GetData,
		expireTime:  expireTime,
		fmt:         cfg.Fmt,
	}
	// typed-nil 守卫：Event 接口可能包裹 nil 指针（如测试场景 svcCtx.FastEvent 未初始化），
	// 仅判接口非 nil 会在 Subscribe/Publish 时空指针 panic
	if !isNilEvent(ret.fastEvent) {
		err = ret.fastEvent.Subscribe(ret.genTopic(), func(ctx context.Context, t time.Time, body []byte) error {
			if err := ret.withPublication(ctx, func(context.Context) error {
				ret.generation.Add(1)
				ret.cache.Delete(string(body))
				return nil
			}); err != nil {
				return err
			}
			for _, f := range ret.notifyCallback {
				f(ctx, body)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	cacheMap[cfg.KeyType] = &ret
	return &ret, nil
}

func GenKeyStr(in any) string {
	return utils.Fmt2(in)
}

// isNilEvent 判断 Event 是否为 nil，包括接口包裹 nil 指针的 typed-nil 情况
// （reflect 只对指针类 Kind 判 IsNil，避免误判非指针实现）
func isNilEvent(e Event) bool {
	if e == nil {
		return true
	}
	v := reflect.ValueOf(e)
	switch v.Kind() {
	case reflect.Ptr, reflect.Interface, reflect.Chan, reflect.Func, reflect.Map, reflect.Slice:
		return v.IsNil()
	}
	return false
}

// 更新通知回调
func (c *Cache[dataT, keyType]) AddNotifyCallback(f func(ctx context.Context, key []byte)) {
	c.notifyCallback = append(c.notifyCallback, f)
}

func (c *Cache[dataT, keyType]) genTopic() string {
	return fmt.Sprintf(eventBus.ServerCacheSync, c.keyType)
}

func (c *Cache[dataT, keyType]) GenCacheKey(key any) string {
	return fmt.Sprintf("cache:%s:%v", c.keyType, key)
}

func (c *Cache[dataT, keyType]) DeleteByFunc(f func(cacheKey string) bool) {
	err := c.withPublication(context.Background(), func(context.Context) error {
		c.generation.Add(1)
		c.cache.DeleteByFunc(func(key string, value *dataT) bool { return f(key) })
		return nil
	})
	if err != nil {
		logx.Error("cache predicate invalidation did not complete")
	}
}

// 删除数据的时候设置为空即可
func (c *Cache[dataT, keyType]) SetData(ctx context.Context, key keyType, data *dataT) error {
	cacheKey := c.GenCacheKey(key)
	keyStr := GenKeyStr(key)
	dataStr, err := json.Marshal(data)
	if err != nil {
		return err
	}
	currentStore := store
	err = c.withPublication(ctx, func(bounded context.Context) error {
		c.generation.Add(1)
		c.cache.Delete(keyStr)
		if data != nil {
			return currentStore.SetexCtx(bounded, cacheKey, string(dataStr), int(c.expireTime/time.Second))
		}
		_, err := currentStore.DelCtx(bounded, cacheKey)
		return err
	})
	// 通知及业务回调在锁外；同步内存总线的回调允许读取已更新数据，不能递归等待自己的发布锁。
	if !isNilEvent(c.fastEvent) {
		err := c.fastEvent.Publish(ctx, c.genTopic(), keyStr)
		if err != nil {
			logx.WithContext(ctx).Error(err)
		}
	}
	return err
}

func (c *Cache[dataT, keyType]) GetData(ctx context.Context, key keyType) (*dataT, error) {
	ctx = ctxs.WithRoot(ctx)
	cacheKey := c.GenCacheKey(key)
	keyStr := GenKeyStr(key)
	generation := c.generation.Load()
	currentStore := store // 原异步写持有同一存储适配器，不在退出后的新测试/装配中借用另一实例。
	temp, ok := c.cache.Get(keyStr)
	if ok && NeedCache {
		if temp == nil {
			return nil, errors.NotFind
		}
		return temp, nil
	}
	//并发获取的情况下避免击穿
	ret, err := c.sf.Do(fmt.Sprintf("%d:%s", generation, keyStr), func() (any, error) {
		{ //内存中没有就从redis上获取
			val, err := currentStore.GetCtx(ctx, cacheKey)
			if err != nil {
				// redis 故障时降级读数据库,避免 redis 单点故障导致所有缓存接口不可用。
				// 不 return,落到下方 c.getData 的 DB 读取分支。
				logx.WithContext(ctx).Errorf("cache redis get fail, fallback to db. key:%s err:%v", cacheKey, err)
			} else if len(val) > 0 && NeedCache {
				var ret dataT
				err = json.Unmarshal([]byte(val), &ret)
				if err != nil {
					return nil, err
				}
				if c.fmt != nil {
					ret = *c.fmt(ctx, key, &ret)
				}
				c.publishMemory(ctx, generation, keyStr, &ret)
				return &ret, nil
			}
		}
		if c.getData == nil { //如果没有设置第三级缓存则直接设置该参数为空并返回
			c.publishMemory(ctx, generation, keyStr, nil)
			return nil, nil
		}
		//redis上没有就读数据库
		data, err := c.getData(ctxs.WithRoot(ctx), key)
		if err != nil && !errors.Cmp(err, errors.NotFind) { //如果是其他错误直接返回
			return nil, err
		}
		//读到了之后设置缓存
		var newData = data
		// data 为 nil(数据不存在)时跳过 fmt:fmt 实现普遍会访问 data 字段,
		// 传入 nil 可能 panic;且 fmt 产物(如设备物模型聚合出的产品物模型)
		// 会被错误缓存到不存在的数据 key 上,导致后续读取不再返回 NotFind
		if c.fmt != nil && data != nil {
			newData = c.fmt(ctx, key, data)
		}
		published := c.publishMemory(ctx, generation, keyStr, newData)
		if data == nil {
			return data, err
		}
		if !published {
			return newData, nil // 原读可返回其旧快照，但失效后的新读不能重新命中它。
		}
		ctxs.GoNewCtx(ctx, func(ctx context.Context) { //异步设置缓存
			str, err := json.Marshal(data)
			if err != nil {
				logx.WithContext(ctx).Error(err)
				return
			}
			err = c.withPublication(ctx, func(bounded context.Context) error {
				if c.generation.Load() != generation {
					return nil
				}
				_, err := currentStore.SetnxExCtx(bounded, cacheKey, string(str), int(c.expireTime/time.Second))
				return err
			})
			if err != nil {
				logx.WithContext(ctx).Error(err)
				return
			}
		})
		return newData, nil
	})
	if err != nil {
		return nil, err
	}
	if ret == nil {
		return nil, errors.NotFind
	}
	rv := reflect.ValueOf(ret)
	if rv.Kind() == reflect.Pointer && rv.IsNil() {
		return nil, errors.NotFind
	}
	return ret.(*dataT), nil
}
