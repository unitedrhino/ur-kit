// 本文件用真实 gRPC 传输验证公开 Things 物模型客户端与缓存的接口接线。
package cache

import (
	"context"
	"errors"
	"net"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/test/bufconn"
)

// grpcProductTSLServer 模拟公开产品物模型服务并核对认证元数据。
type grpcProductTSLServer struct {
	dm.UnimplementedProductManageServer
	calls atomic.Int64
}

// ProductSchemaTslGetOne 返回带版本的产品模型，便于验证产品级失效。
func (server *grpcProductTSLServer) ProductSchemaTslGetOne(ctx context.Context, req *dm.ProductSchemaTslGetOneReq) (*dm.ProductSchemaTslGetOneResp, error) {
	if err := requireTestToken(ctx); err != nil {
		return nil, err
	}
	if req.ProductID != "product-a" {
		return nil, errors.New("unexpected product ID")
	}
	if server.calls.Add(1) == 1 {
		return &dm.ProductSchemaTslGetOneResp{Tsl: `{"version":"1","properties":[{"identifier":"voltage"}]}`}, nil
	}
	return &dm.ProductSchemaTslGetOneResp{Tsl: `{"version":"2","properties":[{"identifier":"voltage"},{"identifier":"current"}]}`}, nil
}

// grpcDeviceTSLServer 模拟公开设备物模型服务并核对认证元数据。
type grpcDeviceTSLServer struct {
	dm.UnimplementedDeviceManageServer
}

// DeviceSchemaTslGetOne 返回空增量模型，必须继承产品物模型。
func (server *grpcDeviceTSLServer) DeviceSchemaTslGetOne(ctx context.Context, req *dm.DeviceSchemaTslGetOneReq) (*dm.DeviceSchemaTslGetOneResp, error) {
	if err := requireTestToken(ctx); err != nil {
		return nil, err
	}
	if req.ProductID != "product-a" || req.DeviceName != "meter-a" {
		return nil, errors.New("unexpected device key")
	}
	return &dm.DeviceSchemaTslGetOneResp{Tsl: ""}, nil
}

// requireTestToken 校验出站 RPC 保留调用方授权令牌。
func requireTestToken(ctx context.Context) error {
	values, ok := metadata.FromIncomingContext(ctx)
	if !ok || len(values.Get("ithings-token")) != 1 || values.Get("ithings-token")[0] != "test-token" {
		return errors.New("missing test token")
	}
	return nil
}

// TestTSLCacheGRPCIntegration 验证生成的 RPC 客户端、元数据和产品更新后的设备模型。
func TestTSLCacheGRPCIntegration(t *testing.T) {
	listener := bufconn.Listen(1 << 20)
	server := grpc.NewServer()
	product := &grpcProductTSLServer{}
	dm.RegisterProductManageServer(server, product)
	dm.RegisterDeviceManageServer(server, &grpcDeviceTSLServer{})
	go func() { _ = server.Serve(listener) }()
	t.Cleanup(func() { server.Stop(); _ = listener.Close() })
	connection, err := grpc.NewClient("passthrough:///things-test", grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) { return listener.Dial() }), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = connection.Close() })
	cache, err := NewTSLCache(time.Minute, dm.NewProductManageClient(connection), dm.NewDeviceManageClient(connection))
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(metadata.NewOutgoingContext(context.Background(), metadata.Pairs("ithings-token", "test-token")), 2*time.Second)
	defer cancel()
	key := DeviceKey{TenantCode: "tenant-a", ProductID: "product-a", DeviceName: "meter-a"}
	first, err := cache.Device(ctx, key)
	if err != nil || !strings.Contains(string(first), `"version":"1"`) {
		t.Fatalf("首次 RPC 设备继承错误: %s %v", first, err)
	}
	cache.InvalidateProduct(ProductKey{TenantCode: key.TenantCode, ProductID: key.ProductID})
	second, err := cache.Device(ctx, key)
	if err != nil || !strings.Contains(string(second), `"current"`) || product.calls.Load() != 2 {
		t.Fatalf("产品更新后 RPC 聚合未刷新: %s %v", second, err)
	}
}
