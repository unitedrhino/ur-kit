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
		token  string
		method string
		code   codes.Code
	}{
		{"bad", "/Demo/Read", codes.Unauthenticated},
		{"good", "/Demo/Write", codes.PermissionDenied},
		{"good", "/Demo/Read", codes.OK},
	} {
		ctx := metadata.NewIncomingContext(context.Background(), metadata.Pairs("ithings-token", test.token, "ithings-user", "forged"))
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
