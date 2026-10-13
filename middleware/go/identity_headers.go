// 本文件统一过滤客户端可伪造的平台内部身份头与 gRPC 元数据。
package middleware

import (
	"context"
	"net/http"

	"google.golang.org/grpc/metadata"
)

// untrustedIdentityHeaders 是平台验证后才允许注入的内部身份字段。
var untrustedIdentityHeaders = [...]string{
	"ithings-user",
	"ithings-user-role",
	"ithings-tenant-code",
	"ithings-project-id",
	"ithings-meta",
	"ithings-set-token",
}

// StripUntrustedIdentityHeaders 删除外部请求自报的内部身份，保留令牌和普通项目选择头。
func StripUntrustedIdentityHeaders(headers http.Header) {
	for _, name := range untrustedIdentityHeaders {
		headers.Del(name)
	}
}

// stripUntrustedRPCIdentity 从请求元数据副本中删除伪造身份，并交给后续处理器读取。
func stripUntrustedRPCIdentity(ctx context.Context, incoming metadata.MD) context.Context {
	clean := incoming.Copy()
	for _, name := range untrustedIdentityHeaders {
		clean.Delete(name)
	}
	return metadata.NewIncomingContext(ctx, clean)
}
