// 本文件统一解析 Go HTTP 与 RPC 认证令牌，避免不同入口放行非 Bearer 授权头。
package middleware

import "strings"

// readToken 优先读取平台令牌头，其次读取严格 Bearer 授权头；返回空串表示未认证。
func readToken(platformToken, alias, authorization string) string {
	if token := strings.TrimSpace(platformToken); token != "" {
		return token
	}
	if token := strings.TrimSpace(alias); token != "" {
		return token
	}
	parts := strings.SplitN(strings.TrimSpace(authorization), " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
