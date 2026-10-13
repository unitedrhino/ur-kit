// 本文件以模拟平台验证公开 Go 认证适配器的企业、项目和重定向边界。
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestPlatformAuthenticator 验证只有平台确认的成员和项目才进入可信身份上下文。
func TestPlatformAuthenticator(t *testing.T) {
	redirected := false
	foreign := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		redirected = true
		if request.Header.Get("ithings-token") != "" {
			t.Error("认证令牌被转发到重定向目标")
		}
	}))
	defer foreign.Close()
	mode := "normal"
	platform := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("ithings-token") != "valid" || request.Header.Get("tenant-code") != "demo" {
			t.Error("平台认证请求缺少令牌或企业选择")
		}
		if mode == "redirect" {
			writer.Header().Set("Location", foreign.URL)
			writer.WriteHeader(http.StatusFound)
			return
		}
		switch request.URL.Path {
		case "/api/v1/system/user/self/get-one":
			_, _ = writer.Write([]byte(`{"code":200,"data":{"userID":"9007199254740993","tenants":[{"tenantCode":"demo","status":1}]}}`))
		case "/api/v1/things/project/info/get-list":
			if request.Header.Get("project-id") != "101" {
				t.Error("项目请求缺少已选择的项目上下文")
			}
			if mode == "forbidden" {
				_, _ = writer.Write([]byte(`{"code":200,"data":{"list":[{"projectID":"101","tenantCode":"demo","myAuthType":0}]}}`))
				return
			}
			_, _ = writer.Write([]byte(`{"code":200,"data":{"list":[{"projectID":"101","tenantCode":"demo","myAuthType":2}]}}`))
		default:
			http.NotFound(writer, request)
		}
	}))
	defer platform.Close()
	auth := PlatformAuthenticator{BaseURL: platform.URL}
	request := httptest.NewRequest(http.MethodPost, "/sample", nil)
	request.Header.Set("tenant-code", "demo")
	identity, err := auth.Authenticate(request, "valid")
	if err != nil || identity.UserID != "9007199254740993" || identity.TenantCode != "demo" || identity.ProjectID != "" {
		t.Fatalf("企业成员认证错误: %+v %v", identity, err)
	}
	request.Header.Set("project-id", "101")
	identity, err = auth.Authenticate(request, "valid")
	if err != nil || identity.ProjectID != "101" {
		t.Fatalf("项目权限认证错误: %+v %v", identity, err)
	}
	mode = "forbidden"
	if _, err := auth.Authenticate(request, "valid"); err == nil {
		t.Fatal("无项目授权被接受")
	}
	mode = "redirect"
	if _, err := auth.Authenticate(request, "valid"); err == nil || redirected {
		t.Fatalf("平台重定向未在认证边界终止: err=%v redirected=%v", err, redirected)
	}
}
