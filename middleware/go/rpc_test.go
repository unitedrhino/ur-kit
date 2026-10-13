// 本文件验证 RPC 元数据不能伪造身份且权限检查对业务处理生效。
package middleware

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// TestUnaryServerInterceptor 验证令牌、权限和可信身份注入。
func TestUnaryServerInterceptor(t *testing.T) {
	interceptor := UnaryServerInterceptor(RPCOptions{
		Authenticator: AuthenticatorFunc(func(_ *http.Request, token string) (Identity, error) {
			if token != "good" {
				return Identity{}, errors.New("invalid")
			}
			return Identity{UserID: "42", TenantCode: "demo"}, nil
		}),
		Authorizer: func(_ context.Context, _ Identity, method string) bool { return method == "/Demo/Read" },
	})
	for _, test := range []struct {
		header string
		token  string
		method string
		code   codes.Code
	}{
		{"ithings-token", "bad", "/Demo/Read", codes.Unauthenticated},
		{"ithings-token", "good", "/Demo/Write", codes.PermissionDenied},
		{"ithings-token", "good", "/Demo/Read", codes.OK},
		{"token", "good", "/Demo/Read", codes.OK},
	} {
		ctx := metadata.NewIncomingContext(context.Background(), metadata.Pairs(test.header, test.token, "ithings-user", "forged"))
		called := false
		_, err := interceptor(ctx, nil, &grpc.UnaryServerInfo{FullMethod: test.method}, func(ctx context.Context, _ any) (any, error) {
			called = true
			identity, ok := FromContext(ctx)
			if !ok || identity.UserID != "42" {
				t.Error("RPC 未收到经验证的身份")
			}
			return nil, nil
		})
		if status.Code(err) != test.code || called != (test.code == codes.OK) {
			t.Errorf("token=%q method=%q: code=%v called=%v", test.token, test.method, status.Code(err), called)
		}
	}
}

// fakeServerStream 只提供测试需要的上下文，其余流操作由 gRPC 接口空实现。
type fakeServerStream struct {
	grpc.ServerStream
	ctx context.Context
}

// Context 返回测试中设置的 gRPC 元数据上下文。
func (stream fakeServerStream) Context() context.Context { return stream.ctx }

// TestStreamServerInterceptor 验证流式 RPC 接受 Web 平台令牌头并拒绝未配置认证器。
func TestStreamServerInterceptor(t *testing.T) {
	interceptor := StreamServerInterceptor(RPCOptions{Authenticator: AuthenticatorFunc(func(_ *http.Request, token string) (Identity, error) {
		if token != "good" {
			return Identity{}, errors.New("invalid")
		}
		return Identity{UserID: "42", TenantCode: "demo"}, nil
	})})
	ctx := metadata.NewIncomingContext(context.Background(), metadata.Pairs("token", "good", "ithings-user", "forged"))
	called := false
	err := interceptor(nil, fakeServerStream{ctx: ctx}, &grpc.StreamServerInfo{FullMethod: "/Demo/Stream"}, func(_ any, stream grpc.ServerStream) error {
		called = true
		identity, ok := FromContext(stream.Context())
		if !ok || identity.UserID != "42" {
			t.Error("流处理器没有获得可信身份")
		}
		return nil
	})
	if err != nil || !called {
		t.Fatalf("平台令牌流式验证失败: %v called=%v", err, called)
	}
	if code := status.Code(StreamServerInterceptor(RPCOptions{})(nil, fakeServerStream{ctx: ctx}, &grpc.StreamServerInfo{}, nil)); code != codes.Internal {
		t.Fatalf("缺少认证器应返回内部配置错误: %v", code)
	}
}
