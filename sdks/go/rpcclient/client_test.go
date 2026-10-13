// 本文件验证 RPC 客户端不透传伪造身份且保留认证元数据。
package rpcclient

import (
	"context"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// TestUnaryClientInterceptor 验证请求元数据与客户端调用语义。
func TestUnaryClientInterceptor(t *testing.T) {
	ctx := metadata.NewOutgoingContext(context.Background(), metadata.Pairs("ithings-user", "forged", "trace-id", "trace"))
	err := UnaryClientInterceptor(Context{Token: "good", TenantCode: "demo", ProjectID: "12", AppID: "7"})(ctx, "/Demo/Read", nil, nil, nil, func(ctx context.Context, _ string, _, _ any, _ *grpc.ClientConn, _ ...grpc.CallOption) error {
		meta, ok := metadata.FromOutgoingContext(ctx)
		if !ok || len(meta.Get("ithings-user")) != 0 || meta.Get("ithings-token")[0] != "good" || meta.Get("app-id")[0] != "7" || meta.Get("trace-id")[0] != "trace" {
			t.Errorf("客户端元数据错误: %#v", meta)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
