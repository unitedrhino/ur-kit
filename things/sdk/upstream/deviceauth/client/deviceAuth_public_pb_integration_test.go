// 本文件验证旧设备认证客户端包装层通过公开 protobuf 完成真实 gRPC 往返。
package deviceauth

import (
	"context"
	"net"
	"testing"
	"time"

	dg "github.com/unitedrhino/ur-kit/sdks/go/pb/things/sdk/deviceauth/pb/dg"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"
)

// deviceAuthTestClient 将真实 gRPC 连接交给现有 zrpc.Client 包装入口。
type deviceAuthTestClient struct{ connection *grpc.ClientConn }

// Conn 返回测试用的 gRPC 连接。
func (client deviceAuthTestClient) Conn() *grpc.ClientConn { return client.connection }

// deviceAuthTestServer 记录经公开 protobuf 解码后的登录请求。
type deviceAuthTestServer struct {
	dg.UnimplementedDeviceAuthServer
	request chan *dg.LoginAuthReq
}

// LoginAuth 返回成功响应并记录收到的请求。
func (server *deviceAuthTestServer) LoginAuth(_ context.Context, request *dg.LoginAuthReq) (*dg.Response, error) {
	server.request <- request
	return &dg.Response{}, nil
}

// TestDeviceAuthClientPublicPB 验证原客户端入口与公开设备认证服务的请求线缆兼容。
func TestDeviceAuthClientPublicPB(t *testing.T) {
	listener := bufconn.Listen(1 << 20)
	server := grpc.NewServer()
	handler := &deviceAuthTestServer{request: make(chan *dg.LoginAuthReq, 1)}
	dg.RegisterDeviceAuthServer(server, handler)
	go func() { _ = server.Serve(listener) }()
	t.Cleanup(func() { server.Stop(); _ = listener.Close() })

	connection, err := grpc.NewClient("passthrough:///device-auth-test",
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) { return listener.Dial() }),
	)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = connection.Close() })

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := NewDeviceAuth(deviceAuthTestClient{connection}).LoginAuth(ctx, &dg.LoginAuthReq{
		Username: "device-1", ClientID: "client-1",
	}); err != nil {
		t.Fatal(err)
	}
	select {
	case request := <-handler.request:
		if request.GetUsername() != "device-1" || request.GetClientID() != "client-1" {
			t.Fatalf("设备认证参数丢失: %v", request)
		}
	case <-ctx.Done():
		t.Fatal(ctx.Err())
	}
}
