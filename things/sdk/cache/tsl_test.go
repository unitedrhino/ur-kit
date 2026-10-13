// 本文件验证公开物模型缓存的覆盖、继承、降级及产品级失效。
package cache

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// productTSLReaderFunc 注入产品模型 RPC 返回值。
type productTSLReaderFunc func(context.Context, *dm.ProductSchemaTslGetOneReq) (*dm.ProductSchemaTslGetOneResp, error)

// ProductSchemaTslGetOne 实现公开产品模型 RPC 接口。
func (reader productTSLReaderFunc) ProductSchemaTslGetOne(ctx context.Context, req *dm.ProductSchemaTslGetOneReq, _ ...grpc.CallOption) (*dm.ProductSchemaTslGetOneResp, error) {
	return reader(ctx, req)
}

// deviceTSLReaderFunc 注入设备模型 RPC 返回值。
type deviceTSLReaderFunc func(context.Context, *dm.DeviceSchemaTslGetOneReq) (*dm.DeviceSchemaTslGetOneResp, error)

// DeviceSchemaTslGetOne 实现公开设备模型 RPC 接口。
func (reader deviceTSLReaderFunc) DeviceSchemaTslGetOne(ctx context.Context, req *dm.DeviceSchemaTslGetOneReq, _ ...grpc.CallOption) (*dm.DeviceSchemaTslGetOneResp, error) {
	return reader(ctx, req)
}

// TestTSLCacheInheritanceAndInvalidation 验证同名设备覆盖、产品继承与更新后回源。
func TestTSLCacheInheritanceAndInvalidation(t *testing.T) {
	var productCalls, deviceCalls atomic.Int64
	product := productTSLReaderFunc(func(ctx context.Context, req *dm.ProductSchemaTslGetOneReq) (*dm.ProductSchemaTslGetOneResp, error) {
		if ctx.Value(authContextKey{}) != "tenant-a" || req.ProductID != "product-a" {
			t.Fatal("RPC 身份或产品 ID 错误")
		}
		version := productCalls.Add(1)
		return &dm.ProductSchemaTslGetOneResp{Tsl: `{"profile":{"productID":"product-a"},"version":"` + string(rune('0'+version)) + `","properties":[{"identifier":"temperature","name":"product"},{"identifier":"humidity"}],"events":[{"identifier":"alarm"}],"vendor":{"preserve":true}}`}, nil
	})
	device := deviceTSLReaderFunc(func(_ context.Context, req *dm.DeviceSchemaTslGetOneReq) (*dm.DeviceSchemaTslGetOneResp, error) {
		if req.ProductID != "product-a" || req.DeviceName != "meter-a" {
			t.Fatal("设备 RPC 键错误")
		}
		deviceCalls.Add(1)
		return &dm.DeviceSchemaTslGetOneResp{Tsl: `{"properties":[{"identifier":"temperature","name":"device"}],"extra":17}`}, nil
	})
	cache, err := NewTSLCache(time.Minute, product, device)
	if err != nil {
		t.Fatal(err)
	}
	key := DeviceKey{TenantCode: "tenant-a", ProductID: "product-a", DeviceName: "meter-a"}
	ctx := context.WithValue(context.Background(), authContextKey{}, "tenant-a")
	first, err := cache.Device(ctx, key)
	if err != nil {
		t.Fatal(err)
	}
	assertTSL(t, first, "1")
	first[0] = 'x'
	second, err := cache.Device(ctx, key)
	if err != nil {
		t.Fatal(err)
	}
	assertTSL(t, second, "1")
	if productCalls.Load() != 1 || deviceCalls.Load() != 1 {
		t.Fatal("缓存未命中")
	}
	cache.InvalidateProduct(ProductKey{TenantCode: "tenant-a", ProductID: "product-a"})
	third, err := cache.Device(ctx, key)
	if err != nil {
		t.Fatal(err)
	}
	assertTSL(t, third, "2")
	if productCalls.Load() != 2 || deviceCalls.Load() != 2 {
		t.Fatal("产品变更未失效设备聚合模型")
	}
}

// assertTSL 校验设备覆盖产品及未知字段保留。
func assertTSL(t *testing.T, raw []byte, version string) {
	t.Helper()
	var model struct {
		Version    string `json:"version"`
		Properties []struct {
			Identifier string `json:"identifier"`
			Name       string `json:"name"`
		} `json:"properties"`
		Events []struct {
			Identifier string `json:"identifier"`
		} `json:"events"`
		Extra  int `json:"extra"`
		Vendor struct {
			Preserve bool `json:"preserve"`
		} `json:"vendor"`
	}
	if err := json.Unmarshal(raw, &model); err != nil {
		t.Fatal(err)
	}
	if model.Version != version || len(model.Properties) != 2 || model.Properties[0].Name != "device" || model.Properties[1].Identifier != "humidity" || len(model.Events) != 1 || model.Events[0].Identifier != "alarm" || model.Extra != 17 || !model.Vendor.Preserve {
		t.Fatalf("聚合结果错误: %s", raw)
	}
}

// TestTSLCacheEmptyDeviceAndFallback 验证空设备模型继承以及产品 RPC 失败时的降级边界。
func TestTSLCacheEmptyDeviceAndFallback(t *testing.T) {
	parentFailed := false
	deviceTSL := ""
	cache, err := NewTSLCache(time.Minute,
		productTSLReaderFunc(func(context.Context, *dm.ProductSchemaTslGetOneReq) (*dm.ProductSchemaTslGetOneResp, error) {
			if parentFailed {
				return nil, errors.New("product unavailable")
			}
			return &dm.ProductSchemaTslGetOneResp{Tsl: `{"properties":[{"identifier":"voltage"}]}`}, nil
		}),
		deviceTSLReaderFunc(func(context.Context, *dm.DeviceSchemaTslGetOneReq) (*dm.DeviceSchemaTslGetOneResp, error) {
			return &dm.DeviceSchemaTslGetOneResp{Tsl: deviceTSL}, nil
		}))
	if err != nil {
		t.Fatal(err)
	}
	key := DeviceKey{TenantCode: "tenant-a", ProductID: "p", DeviceName: "d"}
	data, err := cache.Device(context.Background(), key)
	if err != nil || !strings.Contains(string(data), "voltage") {
		t.Fatalf("空设备模型未继承: %s %v", data, err)
	}
	parentFailed = true
	cache.InvalidateProduct(ProductKey{TenantCode: "tenant-a", ProductID: "p"})
	if _, err := cache.Device(context.Background(), key); err == nil {
		t.Fatal("空设备模型不能掩盖产品 RPC 故障")
	}
	deviceTSL = `{"properties":[{"identifier":"current"}]}`
	data, err = cache.Device(context.Background(), key)
	if err != nil || !strings.Contains(string(data), "current") {
		t.Fatalf("设备级降级失败: %s %v", data, err)
	}
}

// TestTSLCacheRejectsInvalidInputs 验证构造、身份键与非法模型响应。
func TestTSLCacheRejectsInvalidInputs(t *testing.T) {
	reader := productTSLReaderFunc(func(context.Context, *dm.ProductSchemaTslGetOneReq) (*dm.ProductSchemaTslGetOneResp, error) {
		return &dm.ProductSchemaTslGetOneResp{Tsl: `[]`}, nil
	})
	device := deviceTSLReaderFunc(func(context.Context, *dm.DeviceSchemaTslGetOneReq) (*dm.DeviceSchemaTslGetOneResp, error) {
		return &dm.DeviceSchemaTslGetOneResp{Tsl: `{}`}, nil
	})
	if _, err := NewTSLCache(0, reader, device); err == nil {
		t.Fatal("非正 TTL 应被拒绝")
	}
	if _, err := NewTSLCache(time.Minute, nil, device); err == nil {
		t.Fatal("空 RPC 应被拒绝")
	}
	cache, err := NewTSLCache(time.Minute, reader, device)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := cache.Product(context.Background(), ProductKey{ProductID: "p"}); err == nil {
		t.Fatal("缺企业编码应被拒绝")
	}
	if _, err := cache.Device(context.Background(), DeviceKey{TenantCode: "a", ProductID: "p"}); err == nil {
		t.Fatal("缺设备名应被拒绝")
	}
	if _, err := cache.Product(context.Background(), ProductKey{TenantCode: "a", ProductID: "p"}); err == nil {
		t.Fatal("非法 JSON 根应被拒绝")
	}
	if _, err := aggregateTSL([]byte(`{"properties":[{"name":"missing"}]}`), []byte(`{}`)); err == nil {
		t.Fatal("无标识符应被拒绝")
	}
}

// TestTSLCacheTypedModels 验证公开模型的严格校验、设备覆盖、索引及返回值隔离。
func TestTSLCacheTypedModels(t *testing.T) {
	productTSL := `{"properties":[{"identifier":"temperature","name":"产品温度","define":{"type":"int","min":"0","max":"100"}},{"identifier":"humidity","name":"湿度","define":{"type":"int","min":"0","max":"100"}}]}`
	deviceTSL := `{"properties":[{"identifier":"temperature","name":"设备温度","define":{"type":"int","min":"-20","max":"120"}}]}`
	cache, err := NewTSLCache(time.Minute,
		productTSLReaderFunc(func(context.Context, *dm.ProductSchemaTslGetOneReq) (*dm.ProductSchemaTslGetOneResp, error) {
			return &dm.ProductSchemaTslGetOneResp{Tsl: productTSL}, nil
		}),
		deviceTSLReaderFunc(func(context.Context, *dm.DeviceSchemaTslGetOneReq) (*dm.DeviceSchemaTslGetOneResp, error) {
			return &dm.DeviceSchemaTslGetOneResp{Tsl: deviceTSL}, nil
		}))
	if err != nil {
		t.Fatal(err)
	}
	productKey := ProductKey{TenantCode: "tenant-a", ProductID: "p"}
	deviceKey := DeviceKey{TenantCode: "tenant-a", ProductID: "p", DeviceName: "d"}
	productModel, err := cache.ProductModel(context.Background(), productKey)
	if err != nil || productModel.Property["temperature"] == nil {
		t.Fatalf("产品模型索引错误: %v", err)
	}
	deviceModel, err := cache.DeviceModel(context.Background(), deviceKey)
	if err != nil {
		t.Fatal(err)
	}
	if len(deviceModel.Properties) != 2 || deviceModel.Property["temperature"].Name != "设备温度" || deviceModel.Property["humidity"] == nil {
		t.Fatalf("设备覆盖或继承错误: %s", deviceModel.String())
	}
	deviceModel.Property["temperature"].Name = "调用方修改"
	again, err := cache.DeviceModel(context.Background(), deviceKey)
	if err != nil || again.Property["temperature"].Name != "设备温度" {
		t.Fatalf("调用方修改污染缓存: %v", err)
	}
	productTSL = `{"properties":[{"identifier":"invalid","name":"无类型"}]}`
	cache.InvalidateProduct(productKey)
	if _, err := cache.ProductModel(context.Background(), productKey); err == nil {
		t.Fatal("非法模型没有被严格校验拒绝")
	}
}

// TestTSLCacheProductInvalidationDuringDeviceLoad 验证在途设备 RPC 不会回填产品变更前的模型。
func TestTSLCacheProductInvalidationDuringDeviceLoad(t *testing.T) {
	started := make(chan struct{})
	release := make(chan struct{})
	var calls atomic.Int64
	cache, err := NewTSLCache(time.Minute,
		productTSLReaderFunc(func(context.Context, *dm.ProductSchemaTslGetOneReq) (*dm.ProductSchemaTslGetOneResp, error) {
			return &dm.ProductSchemaTslGetOneResp{Tsl: `{}`}, nil
		}),
		deviceTSLReaderFunc(func(ctx context.Context, _ *dm.DeviceSchemaTslGetOneReq) (*dm.DeviceSchemaTslGetOneResp, error) {
			if calls.Add(1) == 1 {
				close(started)
				select {
				case <-release:
				case <-ctx.Done():
					return nil, ctx.Err()
				}
				return &dm.DeviceSchemaTslGetOneResp{Tsl: `{"properties":[{"identifier":"old"}]}`}, nil
			}
			return &dm.DeviceSchemaTslGetOneResp{Tsl: `{"properties":[{"identifier":"new"}]}`}, nil
		}))
	if err != nil {
		t.Fatal(err)
	}
	key := DeviceKey{TenantCode: "tenant-a", ProductID: "p", DeviceName: "d"}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	result := make(chan []byte, 1)
	failure := make(chan error, 1)
	go func() {
		data, err := cache.Device(ctx, key)
		result <- data
		failure <- err
	}()
	select {
	case <-started:
	case <-ctx.Done():
		t.Fatal(ctx.Err())
	}
	cache.InvalidateProduct(ProductKey{TenantCode: key.TenantCode, ProductID: key.ProductID})
	close(release)
	select {
	case data := <-result:
		if err := <-failure; err != nil || !strings.Contains(string(data), `"new"`) || calls.Load() != 2 {
			t.Fatalf("产品失效后设备旧值被回填: %s %v", data, err)
		}
	case <-ctx.Done():
		t.Fatal(ctx.Err())
	}
}
