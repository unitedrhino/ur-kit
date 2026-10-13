// 本文件提供向平台 RPC 透传令牌与可信项目上下文的 gRPC 客户端拦截器。
package rpcclient

import (
	"context"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// Context 保存需要随 RPC 发送的令牌、企业和项目标识。
type Context struct {
	Token      string
	TenantCode string
	ProjectID  string
	AppID      string
}

// UnaryClientInterceptor 为一元 RPC 注入平台认证元数据，不发送可伪造的 ithings-user。
func UnaryClientInterceptor(identity Context) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, request, reply any, connection *grpc.ClientConn, invoke grpc.UnaryInvoker, options ...grpc.CallOption) error {
		return invoke(withMetadata(ctx, identity), method, request, reply, connection, options...)
	}
}

// StreamClientInterceptor 为流式 RPC 注入平台认证元数据。
func StreamClientInterceptor(identity Context) grpc.StreamClientInterceptor {
	return func(ctx context.Context, description *grpc.StreamDesc, connection *grpc.ClientConn, method string, stream grpc.Streamer, options ...grpc.CallOption) (grpc.ClientStream, error) {
		return stream(withMetadata(ctx, identity), description, connection, method, options...)
	}
}

// withMetadata 只添加非空可信字段，保留调用方已有的其他元数据。
func withMetadata(ctx context.Context, identity Context) context.Context {
	copy := metadata.MD{}
	if existing, ok := metadata.FromOutgoingContext(ctx); ok {
		copy = existing.Copy()
	}
	copy.Delete("ithings-user")
	if token := strings.TrimSpace(identity.Token); token != "" {
		copy.Set("ithings-token", token)
	}
	if tenant := strings.TrimSpace(identity.TenantCode); tenant != "" {
		copy.Set("tenant-code", tenant)
	}
	if project := strings.TrimSpace(identity.ProjectID); project != "" {
		copy.Set("project-id", project)
	}
	if app := strings.TrimSpace(identity.AppID); app != "" {
		copy.Set("app-id", app)
	}
	return metadata.NewOutgoingContext(ctx, copy)
}
