// 本文件验证 RPC 客户端不透传伪造身份且保留认证元数据。
package rpcclient

import (
	"context"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// TestUnaryClientInterceptor 验证请求元数据与客户端调用语义。
func TestUnaryClientInterceptor(t *testing.T) {
	ctx := metadata.NewOutgoingContext(context.Background(), metadata.Pairs("ithings-user", "forged", "ithings-user-role", "forged", "ithings-tenant-code", "forged", "ithings-project-id", "forged", "ithings-meta", "forged", "ithings-set-token", "forged", "trace-id", "trace"))
	err := UnaryClientInterceptor(Context{Token: "good", TenantCode: "demo", ProjectID: "12", AppID: "7"})(ctx, "/Demo/Read", nil, nil, nil, func(ctx context.Context, _ string, _, _ any, _ *grpc.ClientConn, _ ...grpc.CallOption) error {
		meta, ok := metadata.FromOutgoingContext(ctx)
		if !ok || len(meta.Get("ithings-user")) != 0 || len(meta.Get("ithings-user-role")) != 0 || len(meta.Get("ithings-tenant-code")) != 0 || len(meta.Get("ithings-project-id")) != 0 || len(meta.Get("ithings-meta")) != 0 || len(meta.Get("ithings-set-token")) != 0 || meta.Get("ithings-token")[0] != "good" || meta.Get("app-id")[0] != "7" || meta.Get("trace-id")[0] != "trace" {
			t.Errorf("客户端元数据错误: %#v", meta)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

// TestUnaryClientInterceptorRejectsMissingToken 确认空令牌在发往平台前被拒绝。
func TestUnaryClientInterceptorRejectsMissingToken(t *testing.T) {
	invoked := false
	err := UnaryClientInterceptor(Context{Token: "  "})(context.Background(), "/Demo/Read", nil, nil, nil, func(context.Context, string, any, any, *grpc.ClientConn, ...grpc.CallOption) error {
		invoked = true
		return nil
	})
	if status.Code(err) != codes.Unauthenticated || invoked {
		t.Fatalf("空令牌应在调用前拒绝，err=%v invoked=%v", err, invoked)
	}
}

// TestStreamClientInterceptorRejectsMissingToken 确认流式 RPC 不发送空令牌请求。
func TestStreamClientInterceptorRejectsMissingToken(t *testing.T) {
	invoked := false
	_, err := StreamClientInterceptor(Context{})(context.Background(), &grpc.StreamDesc{}, nil, "/Demo/Watch", func(context.Context, *grpc.StreamDesc, *grpc.ClientConn, string, ...grpc.CallOption) (grpc.ClientStream, error) {
		invoked = true
		return nil, nil
	})
	if status.Code(err) != codes.Unauthenticated || invoked {
		t.Fatalf("空令牌应在建流前拒绝，err=%v invoked=%v", err, invoked)
	}
}
