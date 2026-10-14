// 本文件验证公开设备认证客户端与生成服务之间的实际 gRPC 请求和响应。
package deviceauth

import (
	"context"
	"net"
	"testing"
	"time"

	dg "github.com/unitedrhino/ur-kit/sdks/go/pb/things/sdk/deviceauth/pb/dg"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// authServer 检查登录、访问认证与设备注册消息在 gRPC 传输后的字段语义。
type authServer struct {
	dg.UnimplementedDeviceAuthServer
	login    chan *dg.LoginAuthReq
	access   chan *dg.AccessAuthReq
	register chan *dg.DeviceRegisterReq
}

// LoginAuth 保存收到的登录参数并返回设备认证响应。
func (server *authServer) LoginAuth(_ context.Context, request *dg.LoginAuthReq) (*dg.Response, error) {
	server.login <- request
	return &dg.Response{Pong: "login-ok"}, nil
}

// AccessAuth 保存收到的访问参数并返回设备认证响应。
func (server *authServer) AccessAuth(_ context.Context, request *dg.AccessAuthReq) (*dg.Response, error) {
	server.access <- request
	return &dg.Response{Pong: "access-ok"}, nil
}

// DeviceRegister 保存收到的注册参数并返回认证服务的注册响应。
func (server *authServer) DeviceRegister(_ context.Context, request *dg.DeviceRegisterReq) (*dg.DeviceRegisterResp, error) {
	server.register <- request
	return &dg.DeviceRegisterResp{Payload: "register-ok"}, nil
}

// TestNewClientGRPC 验证兼容入口完成三种设备认证 RPC，保留全部请求字段。
func TestNewClientGRPC(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	server := grpc.NewServer()
	handler := &authServer{login: make(chan *dg.LoginAuthReq, 1), access: make(chan *dg.AccessAuthReq, 1), register: make(chan *dg.DeviceRegisterReq, 1)}
	dg.RegisterDeviceAuthServer(server, handler)
	go func() { _ = server.Serve(listener) }()
	t.Cleanup(func() { server.Stop(); _ = listener.Close() })

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	connection, err := grpc.NewClient(listener.Addr().String(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = connection.Close() })
	client := NewDeviceAuth(connection)
	login, err := client.LoginAuth(ctx, &LoginAuthReq{ProtocolType: "mqtt", Username: "device-1", Password: "local-test", ClientID: "client-1", Ip: "127.0.0.1", Certificate: []byte("certificate")})
	if err != nil || login.GetPong() != "login-ok" {
		t.Fatalf("登录 RPC 响应错误: %v, %v", login, err)
	}
	loginRequest := <-handler.login
	if loginRequest.GetUsername() != "device-1" || loginRequest.GetClientID() != "client-1" || string(loginRequest.GetCertificate()) != "certificate" {
		t.Fatalf("登录字段丢失: %v", loginRequest)
	}
	access, err := client.AccessAuth(ctx, &AccessAuthReq{ProtocolType: "mqtt", Username: "device-1", Topic: "device/up", ClientID: "client-1", Access: "publish", Ip: "127.0.0.1"})
	if err != nil || access.GetPong() != "access-ok" {
		t.Fatalf("访问认证 RPC 响应错误: %v, %v", access, err)
	}
	accessRequest := <-handler.access
	if accessRequest.GetTopic() != "device/up" || accessRequest.GetAccess() != "publish" || accessRequest.GetClientID() != "client-1" {
		t.Fatalf("访问认证字段丢失: %v", accessRequest)
	}
	registered, err := client.DeviceRegister(ctx, &DeviceRegisterReq{ProductID: "product-1", DeviceName: "device-1", Nonce: 99, Timestamp: 1234567890000, Signature: "test-signature", TenantCode: "tenant-a"})
	if err != nil || registered.GetPayload() != "register-ok" {
		t.Fatalf("设备注册 RPC 响应错误: %v, %v", registered, err)
	}
	registerRequest := <-handler.register
	if registerRequest.GetProductID() != "product-1" || registerRequest.GetDeviceName() != "device-1" || registerRequest.GetNonce() != 99 || registerRequest.GetTimestamp() != 1234567890000 || registerRequest.GetTenantCode() != "tenant-a" {
		t.Fatalf("设备注册字段丢失: %v", registerRequest)
	}
}
