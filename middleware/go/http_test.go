// 本文件验证 HTTP 中间件的认证、权限、身份头隔离与安全头。
package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestHTTP 验证令牌失败和权限失败均不能调用业务处理器。
func TestHTTP(t *testing.T) {
	called := false
	wrapped := HTTP(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		called = true
		identity, ok := FromContext(request.Context())
		if !ok || identity.UserID != "42" || request.Header.Get("ithings-user") != "" || request.Header.Get("ithings-user-role") != "" || request.Header.Get("ithings-tenant-code") != "" || request.Header.Get("ithings-project-id") != "" || request.Header.Get("ithings-meta") != "" || request.Header.Get("ithings-set-token") != "" {
			t.Error("业务处理器未获得可信身份或伪造身份未过滤")
		}
		writer.WriteHeader(http.StatusNoContent)
	}), Options{
		Authenticator: AuthenticatorFunc(func(_ *http.Request, token string) (Identity, error) {
			if token != "good" {
				return Identity{}, errors.New("invalid")
			}
			return Identity{UserID: "42", TenantCode: "tenant"}, nil
		}),
		Authorizer: AuthorizerFunc(func(_ context.Context, _ Identity, resource, action string) bool {
			return resource == "demo" && action == "view"
		}),
		Resource: "demo", Action: "view",
	})
	for _, test := range []struct {
		header string
		token  string
		status int
	}{
		{"ithings-token", "", http.StatusUnauthorized}, {"ithings-token", "bad", http.StatusUnauthorized},
		{"ithings-token", "good", http.StatusNoContent}, {"token", "good", http.StatusNoContent},
		{"Authorization", "Bearer good", http.StatusNoContent},
	} {
		called = false
		request := httptest.NewRequest(http.MethodPost, "/sample", nil)
		request.Header.Set(test.header, test.token)
		request.Header.Set("ithings-user", "forged")
		for _, name := range []string{"ithings-user-role", "ithings-tenant-code", "ithings-project-id", "ithings-meta", "ithings-set-token"} {
			request.Header.Set(name, "forged")
		}
		response := httptest.NewRecorder()
		wrapped.ServeHTTP(response, request)
		if response.Code != test.status || called != (test.status == http.StatusNoContent) || response.Header().Get("X-Content-Type-Options") != "nosniff" {
			t.Errorf("token=%q: status=%d called=%v", test.token, response.Code, called)
		}
	}
}

// TestHTTPRejectsNonBearerAuthorization 验证通用授权头必须使用 Bearer 格式。
func TestHTTPRejectsNonBearerAuthorization(t *testing.T) {
	wrapped := HTTP(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("非法授权头不能进入业务处理器")
	}), Options{Authenticator: AuthenticatorFunc(func(_ *http.Request, _ string) (Identity, error) {
		return Identity{UserID: "42", TenantCode: "demo"}, nil
	})})
	request := httptest.NewRequest(http.MethodPost, "/sample", nil)
	request.Header.Set("Authorization", "Basic valid")
	response := httptest.NewRecorder()
	wrapped.ServeHTTP(response, request)
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("非法授权头返回状态: %d", response.Code)
	}
}
