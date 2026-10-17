// 本文件验证协议适配层经真实 RPC 完成注册、心跳和资料/物模型缓存，保持服务身份与失效语义。
package platformcore

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/exec"
	"sync/atomic"
	"testing"
	"time"

	"gitee.com/unitedrhino/share/caches"
	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/share/eventBus"
	"gitee.com/unitedrhino/share/interceptors"
	"gitee.com/unitedrhino/share/utils"
	"gitee.com/unitedrhino/things/share/devices"
	"gitee.com/unitedrhino/things/share/rpccache"
	"github.com/alicebob/miniredis/v2"
	"github.com/stretchr/testify/require"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	storecache "github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// pureRPCServer 提供真实回环服务；计数器用于验证缓存命中、注册和心跳确实经过 RPC。
type pureRPCServer struct {
	dm.UnimplementedProtocolManageServer
	dm.UnimplementedProductManageServer
	dm.UnimplementedDeviceManageServer
	registrations atomic.Int64 // 已完成的协议注册次数。
	heartbeats    atomic.Int64 // 已完成的协议心跳次数。
	productReads  atomic.Int64 // 产品资料 RPC 查询次数。
	version       atomic.Int64 // 更新后的产品资料和物模型版本。
}

// ProtocolRuntimeConfigGetOne 返回空覆盖，保留调用方的本地运行配置。
func (server *pureRPCServer) ProtocolRuntimeConfigGetOne(context.Context, *dm.ProtocolRuntimeConfigGetReq) (*dm.ProtocolRuntimeConfigResp, error) {
	return &dm.ProtocolRuntimeConfigResp{}, nil
}

// ProtocolInfoCreate 记录真实协议登记。
func (server *pureRPCServer) ProtocolInfoCreate(context.Context, *dm.ProtocolInfo) (*dm.ProtocolManageWithID, error) {
	server.registrations.Add(1)
	return &dm.ProtocolManageWithID{}, nil
}

// ProtocolServiceUpdate 记录真实协议心跳。
func (server *pureRPCServer) ProtocolServiceUpdate(context.Context, *dm.ProtocolService) (*dm.ProtocolManageEmpty, error) {
	server.heartbeats.Add(1)
	return &dm.ProtocolManageEmpty{}, nil
}

// ProductInfoGetOne 验证旧缓存仍请求分类和协议资料，并回显大整数分类 ID。
func (server *pureRPCServer) ProductInfoGetOne(_ context.Context, request *dm.ProductInfoGetOneReq) (*dm.ProductInfo, error) {
	if !request.WithCategory || !request.WithProtocol {
		return nil, status.Error(codes.InvalidArgument, "完整产品资料选项丢失")
	}
	server.productReads.Add(1)
	return &dm.ProductInfo{ProductID: request.ProductID, CategoryID: 9007199254740993, ProductName: fmt.Sprint(server.version.Load())}, nil
}

// DeviceInfoGetOne 回显设备标识，确保资料查询使用公开 RPC 请求字段。
func (server *pureRPCServer) DeviceInfoGetOne(_ context.Context, request *dm.DeviceInfoGetOneReq) (*dm.DeviceInfo, error) {
	return &dm.DeviceInfo{ProductID: request.ProductID, DeviceName: request.DeviceName}, nil
}

// ProductSchemaTslGetOne 按版本返回产品属性，用于检验产品变更后设备模型同步失效。
func (server *pureRPCServer) ProductSchemaTslGetOne(context.Context, *dm.ProductSchemaTslGetOneReq) (*dm.ProductSchemaTslGetOneResp, error) {
	return &dm.ProductSchemaTslGetOneResp{Tsl: fmt.Sprintf(`{"properties":[{"identifier":"power%d","name":"功率","define":{"type":"float","min":"0","max":"100","step":"1"}}]}`, server.version.Load())}, nil
}

// DeviceSchemaTslGetOne 返回空增量，设备应完全继承产品物模型。
func (server *pureRPCServer) DeviceSchemaTslGetOne(context.Context, *dm.DeviceSchemaTslGetOneReq) (*dm.DeviceSchemaTslGetOneResp, error) {
	return &dm.DeviceSchemaTslGetOneResp{}, nil
}

// TestPureRPCPlatformIntegration 隔离缓存单例，验证完整网络调用与旧缓存合同。
func TestPureRPCPlatformIntegration(t *testing.T) {
	if os.Getenv("UR_KIT_PURE_RPC_CHILD") != "1" {
		command := exec.Command(os.Args[0], "-test.run=^TestPureRPCPlatformIntegration$", "-test.count=1", "-test.timeout=30s")
		command.Env = append(os.Environ(), "UR_KIT_PURE_RPC_CHILD=1")
		output, err := command.CombinedOutput()
		require.NoError(t, err, string(output))
		return
	}
	store := miniredis.RunT(t)
	caches.SetStoreForTest(kv.NewStore(storecache.ClusterConf{{RedisConf: redis.RedisConf{Host: store.Addr(), Type: redis.NodeType}, Weight: 100}}))
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	server := grpc.NewServer(grpc.ChainUnaryInterceptor(interceptors.Ctxs,
		func(ctx context.Context, request any, _ *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
			if ctxs.IsRoot(ctx) != nil {
				return nil, status.Error(codes.PermissionDenied, "协议服务身份丢失")
			}
			return handler(ctx, request)
		}))
	implementation := &pureRPCServer{}
	dm.RegisterProtocolManageServer(server, implementation)
	dm.RegisterProductManageServer(server, implementation)
	dm.RegisterDeviceManageServer(server, implementation)
	done := make(chan error, 1)
	utils.Go(context.Background(), func() { done <- server.Serve(listener) })
	t.Cleanup(func() { server.Stop(); require.NoError(t, <-done) })
	client, err := zrpc.NewClient(zrpc.RpcClientConf{Target: listener.Addr().String(), NonBlock: true})
	require.NoError(t, err)
	t.Cleanup(func() { _ = client.Conn().Close() })
	protocol, err := NewCoreProtocol(Options{
		Info: &dm.ProtocolInfo{Code: "pure-rpc-test", Name: "纯 RPC 协议"}, ServerName: "pure-rpc-test",
		DmClient: client, FastEvent: eventBus.NewMemFastEvent(), NodeID: 1,
	})
	require.NoError(t, err)
	require.NoError(t, protocol.Start())
	t.Cleanup(protocol.Stop)
	require.Equal(t, int64(1), implementation.registrations.Load())
	require.Positive(t, implementation.heartbeats.Load())
	ctx, cancel := context.WithTimeout(ctxs.WithRoot(context.Background()), 5*time.Second)
	defer cancel()
	product, err := protocol.ProductCache.GetData(ctx, "pure-rpc-product")
	require.NoError(t, err)
	require.Equal(t, int64(9007199254740993), product.CategoryID)
	_, err = protocol.ProductCache.GetData(ctx, "pure-rpc-product")
	require.NoError(t, err)
	require.Equal(t, int64(1), implementation.productReads.Load())
	key := devices.Core{ProductID: "pure-rpc-product", DeviceName: "device"}
	device, err := protocol.DeviceCache.GetData(ctx, key)
	require.NoError(t, err)
	require.Equal(t, key.DeviceName, device.DeviceName)
	model, err := protocol.SchemaCache.GetData(ctx, key)
	require.NoError(t, err)
	require.NotNil(t, model.Property["power0"])
	implementation.version.Store(1)
	// 产品变更时沿用平台的缓存失效及设备模型联动，下一次查询必须重新聚合。
	products, err := rpccache.NewProductSchemaCache(protocol.ProductM, protocol.FastEvent)
	require.NoError(t, err)
	require.NoError(t, products.SetData(ctx, key.ProductID, nil))
	model, err = protocol.SchemaCache.GetData(ctx, key)
	require.NoError(t, err)
	require.NotNil(t, model.Property["power1"])
	require.Nil(t, model.Property["power0"])
}
