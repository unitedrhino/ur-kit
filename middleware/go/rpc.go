// 本文件提供 gRPC 服务端身份验证、权限校验与脱敏日志拦截器。
package middleware

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// RPCAuthorizer 根据验证身份与 gRPC 完整方法名判断权限。
type RPCAuthorizer func(context.Context, Identity, string) bool

// RPCOptions 描述 RPC 身份验证、方法权限与日志配置。
type RPCOptions struct {
	Authenticator Authenticator
	Authorizer    RPCAuthorizer
	Logger        *slog.Logger
}

// UnaryServerInterceptor 在每次业务 RPC 前验证令牌，过滤伪造身份元数据并写入可信上下文。
func UnaryServerInterceptor(options RPCOptions) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, request any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		started := time.Now()
		defer func() {
			if options.Logger != nil {
				options.Logger.Info("rpc request", "method", info.FullMethod, "duration_ms", time.Since(started).Milliseconds())
			}
		}()
		if options.Authenticator == nil {
			return nil, status.Error(codes.Internal, "auth_not_configured")
		}
		incoming, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "unauthorized")
		}
		token := strings.TrimSpace(first(incoming.Get("ithings-token")))
		if token == "" {
			token = strings.TrimPrefix(first(incoming.Get("authorization")), "Bearer ")
		}
		if token == "" {
			return nil, status.Error(codes.Unauthenticated, "unauthorized")
		}
		// 认证器仅接收可信的 HTTP 形式请求信息；禁止把 ithings-user 原值写入上下文。
		identity, err := options.Authenticator.Authenticate(newRPCAuthRequest(ctx, incoming), token)
		if err != nil || identity.UserID == "" || identity.TenantCode == "" {
			return nil, status.Error(codes.Unauthenticated, "unauthorized")
		}
		if options.Authorizer != nil && !options.Authorizer(ctx, identity, info.FullMethod) {
			return nil, status.Error(codes.PermissionDenied, "forbidden")
		}
		identity.AccessToken = token
		return handler(context.WithValue(ctx, identityKey{}, identity), request)
	}
}

// StreamServerInterceptor 对流式 RPC 逐连接验证令牌，并将可信身份注入流上下文。
func StreamServerInterceptor(options RPCOptions) grpc.StreamServerInterceptor {
	return func(server any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		ctx := stream.Context()
		incoming, ok := metadata.FromIncomingContext(ctx)
		if !ok || options.Authenticator == nil {
			return status.Error(codes.Unauthenticated, "unauthorized")
		}
		token := strings.TrimSpace(first(incoming.Get("ithings-token")))
		if token == "" {
			return status.Error(codes.Unauthenticated, "unauthorized")
		}
		identity, err := options.Authenticator.Authenticate(newRPCAuthRequest(ctx, incoming), token)
		if err != nil || identity.UserID == "" || identity.TenantCode == "" {
			return status.Error(codes.Unauthenticated, "unauthorized")
		}
		if options.Authorizer != nil && !options.Authorizer(ctx, identity, info.FullMethod) {
			return status.Error(codes.PermissionDenied, "forbidden")
		}
		identity.AccessToken = token
		return handler(server, &identityStream{ServerStream: stream, context: context.WithValue(ctx, identityKey{}, identity)})
	}
}

// identityStream 使流处理器读取到经认证的上下文。
type identityStream struct {
	grpc.ServerStream
	context context.Context
}

// Context 返回包含可信身份的流上下文。
func (stream *identityStream) Context() context.Context { return stream.context }

// newRPCAuthRequest 将 RPC 的租户和项目元数据映射为认证器可读取的请求。
func newRPCAuthRequest(ctx context.Context, incoming metadata.MD) *http.Request {
	request, _ := http.NewRequestWithContext(ctx, http.MethodPost, "http://rpc.local/", nil)
	request.Header.Set("tenant-code", first(incoming.Get("tenant-code")))
	request.Header.Set("project-id", first(incoming.Get("project-id")))
	return request
}

// first 返回元数据的第一个值，空列表返回空串。
func first(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return values[0]
}

// ErrPermissionDenied 供适配层区分权限不足与其他身份错误。
var ErrPermissionDenied = errors.New("permission denied")
