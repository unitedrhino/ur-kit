// 本文件验证公开 Things RPC 资料缓存的键、深拷贝与在途失效行为。
package cache

import (
	"context"
	"errors"
	"fmt"
	"sync/atomic"
	"testing"
	"time"

	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// productReaderFunc 允许测试注入产品公开 RPC 的响应。
type productReaderFunc func(context.Context, *dm.ProductInfoGetOneReq) (*dm.ProductInfo, error)

// ProductInfoGetOne 实现缓存要求的产品 RPC 接口。
func (reader productReaderFunc) ProductInfoGetOne(ctx context.Context, input *dm.ProductInfoGetOneReq, _ ...grpc.CallOption) (*dm.ProductInfo, error) {
	return reader(ctx, input)
}

// deviceReaderFunc 允许测试注入设备公开 RPC 的响应。
type deviceReaderFunc func(context.Context, *dm.DeviceInfoGetOneReq) (*dm.DeviceInfo, error)

// DeviceInfoGetOne 实现缓存要求的设备 RPC 接口。
func (reader deviceReaderFunc) DeviceInfoGetOne(ctx context.Context, input *dm.DeviceInfoGetOneReq, _ ...grpc.CallOption) (*dm.DeviceInfo, error) {
	return reader(ctx, input)
}

// authContextKey 标记测试 RPC 调用应继承的可信身份上下文。
type authContextKey struct{}

// TestProductInfoCache 验证完整产品读取选项、返回副本和失效回源。
func TestProductInfoCache(t *testing.T) {
	var calls atomic.Int64
	reader := productReaderFunc(func(ctx context.Context, input *dm.ProductInfoGetOneReq) (*dm.ProductInfo, error) {
		if ctx.Value(authContextKey{}) != "tenant-a" {
			t.Error("产品详情 RPC 未继承调用方身份上下文")
		}
		if input.ProductID != "product-a" || !input.WithCategory || !input.WithProtocol {
			t.Errorf("产品详情 RPC 参数错误: %+v", input)
		}
		return &dm.ProductInfo{TenantCode: "tenant-a", ProductID: input.ProductID, ProductName: fmt.Sprintf("version-%d", calls.Add(1))}, nil
	})
	cache, err := NewProductInfoCache(time.Minute, reader)
	if err != nil {
		t.Fatal(err)
	}
	key := ProductKey{TenantCode: "tenant-a", ProductID: "product-a"}
	ctx := context.WithValue(context.Background(), authContextKey{}, "tenant-a")
	first, err := cache.Get(ctx, key)
	if err != nil || first.ProductName != "version-1" {
		t.Fatalf("产品首次读取错误: %+v %v", first, err)
	}
	first.ProductName = "mutated"
	second, err := cache.Get(ctx, key)
	if err != nil || second.ProductName != "version-1" || calls.Load() != 1 {
		t.Fatalf("缓存数据被调用方改写: %+v %v", second, err)
	}
	cache.Invalidate(key)
	refreshed, err := cache.Get(ctx, key)
	if err != nil || refreshed.ProductName != "version-2" || calls.Load() != 2 {
		t.Fatalf("产品失效后未回源: %+v %v", refreshed, err)
	}
	if _, err := cache.Get(context.Background(), ProductKey{TenantCode: "tenant-a"}); err == nil {
		t.Fatal("空产品 ID 应被拒绝")
	}
	if _, err := cache.Get(ctx, ProductKey{TenantCode: "tenant-b", ProductID: "product-a"}); err == nil {
		t.Fatal("其他企业的同名产品缓存不应复用")
	}
}

// TestDeviceInfoCache 验证产品与设备双字段键、返回副本和定向失效。
func TestDeviceInfoCache(t *testing.T) {
	var calls atomic.Int64
	reader := deviceReaderFunc(func(_ context.Context, input *dm.DeviceInfoGetOneReq) (*dm.DeviceInfo, error) {
		calls.Add(1)
		return &dm.DeviceInfo{TenantCode: "tenant-a", ProductID: input.ProductID, DeviceName: input.DeviceName, Id: calls.Load()}, nil
	})
	cache, err := NewDeviceInfoCache(time.Minute, reader)
	if err != nil {
		t.Fatal(err)
	}
	firstKey := DeviceKey{TenantCode: "tenant-a", ProductID: "product-a", DeviceName: "meter-a"}
	secondKey := DeviceKey{TenantCode: "tenant-a", ProductID: "product-a", DeviceName: "meter-b"}
	first, err := cache.Get(context.Background(), firstKey)
	if err != nil || first.Id != 1 {
		t.Fatalf("设备首次读取错误: %+v %v", first, err)
	}
	first.Id = 999
	if second, err := cache.Get(context.Background(), firstKey); err != nil || second.Id != 1 {
		t.Fatalf("设备缓存被调用方改写: %+v %v", second, err)
	}
	if second, err := cache.Get(context.Background(), secondKey); err != nil || second.Id != 2 {
		t.Fatalf("第二台设备键错误: %+v %v", second, err)
	}
	cache.Invalidate(firstKey)
	if refreshed, err := cache.Get(context.Background(), firstKey); err != nil || refreshed.Id != 3 || calls.Load() != 3 {
		t.Fatalf("定向失效未回源: %+v %v", refreshed, err)
	}
	if _, err := cache.Get(context.Background(), DeviceKey{TenantCode: "tenant-a", ProductID: "product-a"}); err == nil {
		t.Fatal("缺设备名应被拒绝")
	}
	if _, err := cache.Get(context.Background(), DeviceKey{TenantCode: "tenant-b", ProductID: "product-a", DeviceName: "meter-a"}); err == nil {
		t.Fatal("其他企业的同名设备缓存不应复用")
	}
}

// TestProductInfoCacheInvalidateDuringLoad 验证失效后在途旧 RPC 结果不会覆盖新资料。
func TestProductInfoCacheInvalidateDuringLoad(t *testing.T) {
	started := make(chan struct{})
	release := make(chan struct{})
	var calls atomic.Int64
	reader := productReaderFunc(func(ctx context.Context, _ *dm.ProductInfoGetOneReq) (*dm.ProductInfo, error) {
		if calls.Add(1) == 1 {
			close(started)
			select {
			case <-release:
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			return &dm.ProductInfo{ProductName: "old"}, nil
		}
		return &dm.ProductInfo{ProductName: "new"}, nil
	})
	cache, err := NewProductInfoCache(time.Minute, reader)
	if err != nil {
		t.Fatal(err)
	}
	result := make(chan *dm.ProductInfo, 1)
	failure := make(chan error, 1)
	go func() {
		info, err := cache.Get(context.Background(), ProductKey{TenantCode: "tenant-a", ProductID: "product-a"})
		result <- info
		failure <- err
	}()
	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("首次回源未开始")
	}
	cache.Invalidate(ProductKey{TenantCode: "tenant-a", ProductID: "product-a"})
	close(release)
	select {
	case info := <-result:
		if err := <-failure; err != nil || info == nil || info.ProductName != "new" || calls.Load() != 2 {
			t.Fatalf("旧结果覆盖失效后的新值: %+v %v", info, err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("失效后回源未结束")
	}
}

// TestInfoCacheRejectsInvalidSetup 验证缺 RPC 客户端、非正 TTL 与空响应均有明确错误。
func TestInfoCacheRejectsInvalidSetup(t *testing.T) {
	if _, err := NewProductInfoCache(time.Minute, nil); err == nil {
		t.Fatal("缺产品 RPC 客户端应拒绝")
	}
	if _, err := NewDeviceInfoCache(time.Minute, nil); err == nil {
		t.Fatal("缺设备 RPC 客户端应拒绝")
	}
	if _, err := NewProductInfoCache(0, productReaderFunc(func(context.Context, *dm.ProductInfoGetOneReq) (*dm.ProductInfo, error) { return nil, nil })); err == nil {
		t.Fatal("非正 TTL 应拒绝")
	}
	cache, err := NewProductInfoCache(time.Minute, productReaderFunc(func(context.Context, *dm.ProductInfoGetOneReq) (*dm.ProductInfo, error) { return nil, nil }))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := cache.Get(context.Background(), ProductKey{TenantCode: "tenant-a", ProductID: "missing"}); err == nil || errors.Is(err, context.Canceled) {
		t.Fatalf("空 RPC 响应应返回未找到错误: %v", err)
	}
}
