package caches

import (
	"context"
	"sync"
	"testing"

	"gitee.com/unitedrhino/share/errors"
	"github.com/alicebob/miniredis/v2"
	gocache "github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

func TestGetDataReturnsNotFindWhenLoaderReturnsNil(t *testing.T) {
	t.Parallel()

	mr := miniredis.RunT(t)
	store = nil
	once = sync.Once{}
	InitStore(gocache.ClusterConf{
		{
			RedisConf: redis.RedisConf{
				Host: mr.Addr(),
				Type: redis.NodeType,
			},
			Weight: 100,
		},
	})

	c, err := NewCache(CacheConfig[string, string]{
		KeyType: "cache-test-loader-nil",
		GetData: func(ctx context.Context, key string) (*string, error) {
			return nil, nil
		},
	})
	if err != nil {
		t.Fatalf("NewCache err=%v", err)
	}

	got, err := c.GetData(context.Background(), "missing")
	if got != nil {
		t.Fatalf("expected nil data, got %v", *got)
	}
	if !errors.Cmp(err, errors.NotFind) {
		t.Fatalf("expected errors.NotFind, got %v", err)
	}
}

// TestGetDataSkipsFmtWhenDataNotFind 验证 loader 返回 (nil, NotFind) 时:
// 1) fmt 不会被以 nil 数据调用(fmt 实现普遍访问 data 字段,nil 会导致 panic)
// 2) fmt 产物不会被缓存到不存在的数据 key 上(如设备物模型缓存的 Fmt 在 data=nil 时
//    会聚合出产品物模型,若被缓存,后续读取已删除的设备将不再返回 NotFind)
func TestGetDataSkipsFmtWhenDataNotFind(t *testing.T) {
	mr := miniredis.RunT(t)
	store = nil
	once = sync.Once{}
	InitStore(gocache.ClusterConf{
		{
			RedisConf: redis.RedisConf{
				Host: mr.Addr(),
				Type: redis.NodeType,
			},
			Weight: 100,
		},
	})

	c, err := NewCache(CacheConfig[string, string]{
		KeyType: "cache-test-fmt-nil-guard",
		GetData: func(ctx context.Context, key string) (*string, error) {
			return nil, errors.NotFind
		},
		Fmt: func(ctx context.Context, key string, data *string) *string {
			if data == nil {
				// 模拟设备物模型缓存 Fmt 在 nil 数据上聚合出产品物模型的场景
				s := "fmt-product"
				return &s
			}
			return data
		},
	})
	if err != nil {
		t.Fatalf("NewCache err=%v", err)
	}

	for i := 0; i < 2; i++ {
		got, err := c.GetData(context.Background(), "missing")
		if got != nil {
			t.Fatalf("第 %d 次读取: expected nil data, got %v", i+1, *got)
		}
		if !errors.Cmp(err, errors.NotFind) {
			t.Fatalf("第 %d 次读取: expected errors.NotFind, got %v", i+1, err)
		}
	}
}
