// 本文件通过固定的 protocolSync 合同和本机 gRPC 服务验证公开客户端真实往返。
package rpcclient

import (
	"context"
	"net"
	"testing"
	"time"

	protocolsync "github.com/unitedrhino/ur-kit/sdks/go/pb/things/share/rpcs/protocolSync/pb/protocolSync"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/test/bufconn"
)

// protocolSyncExampleServer 返回请求设备名，认证元数据由服务端拦截器核对。
type protocolSyncExampleServer struct {
	protocolsync.UnimplementedProtocolSyncServer
}

// SyncDevice 模拟协议同步服务，确认生成的请求字段到达服务端。
func (protocolSyncExampleServer) SyncDevice(_ context.Context, request *protocolsync.SyncDeviceReq) (*protocolsync.SyncDeviceResp, error) {
	return &protocolsync.SyncDeviceResp{DeviceNames: []string{request.ProductID + "-sensor"}}, nil
}

// TestProtocolSyncRoundTrip 验证固定合同可传输令牌、大整数项目编号与生成的消息。
func TestProtocolSyncRoundTrip(t *testing.T) {
	listener := bufconn.Listen(1 << 20)
	server := grpc.NewServer(grpc.UnaryInterceptor(func(ctx context.Context, request any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		meta, ok := metadata.FromIncomingContext(ctx)
		if !ok || len(meta.Get("ithings-token")) != 1 || meta.Get("ithings-token")[0] != "test-token" || len(meta.Get("project-id")) != 1 || meta.Get("project-id")[0] != "9007199254740993" || len(meta.Get("ithings-user")) != 0 {
			t.Errorf("服务端收到错误认证元数据: %#v", meta)
		}
		return handler(ctx, request)
	}))
	protocolsync.RegisterProtocolSyncServer(server, protocolSyncExampleServer{})
	go func() { _ = server.Serve(listener) }()
	t.Cleanup(func() { server.Stop(); _ = listener.Close() })

	connection, err := grpc.NewClient("passthrough:///bufnet", grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) {
		return listener.Dial()
	}), grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithUnaryInterceptor(UnaryClientInterceptor(Context{
		Token: "test-token", ProjectID: "9007199254740993",
	})))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = connection.Close() })
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	response, err := protocolsync.NewProtocolSyncClient(connection).SyncDevice(ctx, &protocolsync.SyncDeviceReq{ProductID: "product-demo"})
	if err != nil || len(response.GetDeviceNames()) != 1 || response.GetDeviceNames()[0] != "product-demo-sensor" {
		t.Fatalf("生成的 RPC 消息往返失败: response=%v err=%v", response, err)
	}
}
