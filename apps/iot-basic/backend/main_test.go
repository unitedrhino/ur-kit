// 本文件验证基础应用仅接受平台确认的令牌和企业成员关系。
package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestVerifyPlatformToken 验证认证请求与企业成员检查。
func TestVerifyPlatformToken(t *testing.T) {
	platform := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/api/v1/system/user/self/get-one" || request.Header.Get("ithings-token") != "valid" {
			t.Error("平台认证请求不符合合同")
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"code":200,"data":{"userID":"9007199254740993","tenants":[{"tenantCode":"demo","status":1}]}}`))
	}))
	defer platform.Close()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/iot-basic/ping", nil)
	request.Header.Set("tenant-code", "demo")
	identity, err := verifyPlatformToken(request, platform.URL, "valid")
	if err != nil || identity.UserID != "9007199254740993" || identity.TenantCode != "demo" {
		t.Fatalf("平台认证失败: identity=%+v err=%v", identity, err)
	}
	request.Header.Set("tenant-code", "other")
	if _, err := verifyPlatformToken(request, platform.URL, "valid"); err == nil {
		t.Fatal("不属于用户的企业被接受")
	}
}

// TestBasicAppSingleContainerHandler 验证 Web 深层路径、样例 API 和平台代理可在同一服务工作。
func TestBasicAppSingleContainerHandler(t *testing.T) {
	platform := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("ithings-user") != "" || request.Header.Get("ithings-user-role") != "" || request.Header.Get("ithings-tenant-code") != "" || request.Header.Get("ithings-project-id") != "" || request.Header.Get("ithings-meta") != "" || request.Header.Get("ithings-set-token") != "" {
			t.Error("伪造身份头泄漏到平台")
		}
		if request.Header.Get("token") != "good" && request.Header.Get("ithings-token") != "good" {
			t.Error("平台未收到令牌")
		}
		switch request.URL.Path {
		case "/api/v1/system/user/self/get-one":
			_, _ = writer.Write([]byte(`{"code":200,"data":{"userID":"9007199254740993","tenants":[{"tenantCode":"demo","status":1}]}}`))
		case "/api/v1/things/device/info/get-list":
			writer.WriteHeader(http.StatusAccepted)
			_, _ = writer.Write([]byte(`{"code":202,"data":{"list":[]}}`))
		default:
			http.NotFound(writer, request)
		}
	}))
	defer platform.Close()
	webDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(webDir, "index.html"), []byte("<html>IoT app</html>"), 0o600); err != nil {
		t.Fatal(err)
	}
	handler, err := newHandler(platform.URL, webDir)
	if err != nil {
		t.Fatal(err)
	}
	call := func(method, route, body string) *httptest.ResponseRecorder {
		request := httptest.NewRequest(method, route, strings.NewReader(body))
		request.Header.Set("token", "good")
		request.Header.Set("tenant-code", "demo")
		request.Header.Set("ithings-user", "forged")
		for _, name := range []string{"ithings-user-role", "ithings-tenant-code", "ithings-project-id", "ithings-meta", "ithings-set-token"} {
			request.Header.Set(name, "forged")
		}
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		return response
	}
	if response := call(http.MethodGet, "/device-space/detail", ""); response.Code != http.StatusOK || !strings.Contains(response.Body.String(), "IoT app") {
		t.Fatalf("SPA 深层路径未回退: %d %s", response.Code, response.Body.String())
	}
	if response := call(http.MethodPost, "/api/v1/iot-basic/ping", "{}"); response.Code != http.StatusOK || !strings.Contains(response.Body.String(), "9007199254740993") {
		t.Fatalf("样例业务 API 未验证 Web token: %d %s", response.Code, response.Body.String())
	}
	if response := call(http.MethodPost, "/api/v1/things/device/info/get-list", "{}"); response.Code != http.StatusAccepted || !strings.Contains(response.Body.String(), `"code":202`) {
		t.Fatalf("平台代理未保留状态和内容: %d %s", response.Code, response.Body.String())
	}
	if response := call(http.MethodGet, "/api/v1/unknown", ""); response.Code != http.StatusNotFound {
		t.Fatalf("未知 API 被 SPA 吞掉: %d", response.Code)
	}
	if response := call(http.MethodGet, "/healthz", ""); response.Code != http.StatusOK {
		t.Fatalf("健康检查失败: %d", response.Code)
	}
}
