// 本文件提供可注入身份验证与权限检查的 HTTP 中间件。
package middleware

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

// Identity 是认证后的平台身份；外部请求头不得直接构造该值。
type Identity struct {
	UserID      string `json:"userId"`
	TenantCode  string `json:"tenantCode"`
	ProjectID   string `json:"projectId"`
	AccessToken string `json:"-"`
}

// Authenticator 负责验证原始令牌并返回可信身份。
type Authenticator interface {
	Authenticate(*http.Request, string) (Identity, error)
}

// Authorizer 根据认证身份和资源动作判断是否允许访问。
type Authorizer interface {
	Allow(context.Context, Identity, string, string) bool
}

// AuthenticatorFunc 允许用函数实现令牌验证。
type AuthenticatorFunc func(*http.Request, string) (Identity, error)

// Authenticate 调用用户提供的认证函数并返回可信身份。
func (fn AuthenticatorFunc) Authenticate(request *http.Request, token string) (Identity, error) {
	return fn(request, token)
}

// AuthorizerFunc 允许用函数实现权限判定。
type AuthorizerFunc func(context.Context, Identity, string, string) bool

// Allow 调用用户提供的权限判定函数。
func (fn AuthorizerFunc) Allow(ctx context.Context, identity Identity, resource, action string) bool {
	return fn(ctx, identity, resource, action)
}

// identityKey 仅用于在请求上下文中保存经认证的身份。
type identityKey struct{}

// FromContext 返回认证中间件写入的身份；未认证时第二个返回值为 false。
func FromContext(ctx context.Context) (Identity, bool) {
	identity, ok := ctx.Value(identityKey{}).(Identity)
	return identity, ok
}

// Options 描述单个路由需要的身份、权限与日志设置。
type Options struct {
	Authenticator Authenticator
	Authorizer    Authorizer
	Resource      string
	Action        string
	Logger        *slog.Logger
}

// HTTP 验证令牌、注入可信身份、检查权限并补安全头和脱敏访问日志。
func HTTP(next http.Handler, options Options) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		started := time.Now()
		writer.Header().Set("X-Content-Type-Options", "nosniff")
		writer.Header().Set("X-Frame-Options", "DENY")
		writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		// 内部身份只能由验证器产生，不能接受请求头伪造。
		StripUntrustedIdentityHeaders(request.Header)
		defer func() {
			if options.Logger != nil {
				options.Logger.Info("http request", "method", request.Method, "path", request.URL.Path, "duration_ms", time.Since(started).Milliseconds())
			}
		}()
		if options.Authenticator == nil {
			writeError(writer, http.StatusInternalServerError, "auth_not_configured")
			return
		}
		token := strings.TrimSpace(request.Header.Get("ithings-token"))
		if token == "" {
			token = strings.TrimSpace(request.Header.Get("token"))
		}
		if token == "" {
			token = strings.TrimPrefix(request.Header.Get("Authorization"), "Bearer ")
		}
		if token == "" {
			writeError(writer, http.StatusUnauthorized, "unauthorized")
			return
		}
		identity, err := options.Authenticator.Authenticate(request, token)
		if err != nil || identity.UserID == "" || identity.TenantCode == "" {
			writeError(writer, http.StatusUnauthorized, "unauthorized")
			return
		}
		if options.Resource != "" && (options.Authorizer == nil || !options.Authorizer.Allow(request.Context(), identity, options.Resource, options.Action)) {
			writeError(writer, http.StatusForbidden, "forbidden")
			return
		}
		identity.AccessToken = token
		next.ServeHTTP(writer, request.WithContext(context.WithValue(request.Context(), identityKey{}, identity)))
	})
}

// writeError 返回稳定的 JSON 错误码，避免泄露验证失败细节。
func writeError(writer http.ResponseWriter, status int, code string) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(map[string]string{"code": code})
}
