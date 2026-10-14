// 本文件验证 HTTP 客户端保留大整数、认证头与平台错误状态。
package httpclient

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync/atomic"
	"testing"
)

// TestPostJSON 验证 POST 请求与大整数响应不会丢失精度。
func TestPostJSON(t *testing.T) {
	fixture, err := os.ReadFile("../../conformance/http-response.json")
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost || request.URL.Path != "/api/v1/things/demo/get-one" || request.Header.Get("ithings-token") != "test-token" || request.Header.Get("tenant-code") != "tenant-a" || request.Header.Get("project-id") != "9007199254740993" || request.Header.Get("app-id") != "12" {
			t.Errorf("请求语义错误: %s %s", request.Method, request.URL.Path)
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write(fixture)
	}))
	defer server.Close()
	client := Client{BaseURL: server.URL, Token: "test-token", TenantCode: "tenant-a", ProjectID: "9007199254740993", AppID: "12"}
	var response map[string]any
	if err := client.PostJSON(context.Background(), "/api/v1/things/demo/get-one", map[string]string{"id": "1"}, &response); err != nil {
		t.Fatal(err)
	}
	data, ok := response["data"].(map[string]any)
	if !ok || data["id"] != json.Number("9007199254740993") || data["nullable"] != nil || data["receivedTime"] != json.Number("1760000000123") {
		t.Fatalf("ID、空值或毫秒时间语义错误: %#v", response)
	}
}

// TestPostJSONPreservesHTTPError 验证平台错误保留状态与响应体且不泄露认证令牌。
func TestPostJSONPreservesHTTPError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusForbidden)
		_, _ = writer.Write([]byte(`{"code":403,"msg":"denied"}`))
	}))
	defer server.Close()
	client := Client{BaseURL: server.URL, Token: "secret-token"}
	err := client.PostJSON(context.Background(), "/api/denied", nil, nil)
	apiError, ok := err.(*APIError)
	if !ok || apiError.Status != http.StatusForbidden || string(apiError.Body) != `{"code":403,"msg":"denied"}` {
		t.Fatalf("HTTP 错误语义错误: %v", err)
	}
	if strings.Contains(err.Error(), client.Token) {
		t.Fatal("错误消息泄露认证令牌")
	}
}

// TestPostJSONRejectsInvalidInput 验证三语言客户端一致拒绝空令牌、非根地址和含查询的接口路径。
func TestPostJSONRejectsInvalidInput(t *testing.T) {
	for _, input := range []struct {
		name    string
		baseURL string
		token   string
		path    string
	}{
		{"empty token", "https://example.invalid", " ", "/api/demo"},
		{"credentials", "https://user:pass@example.invalid", "valid", "/api/demo"},
		{"base path", "https://example.invalid/root", "valid", "/api/demo"},
		{"base query", "https://example.invalid/?key=value", "valid", "/api/demo"},
		{"path query", "https://example.invalid", "valid", "/api/demo?x=1"},
	} {
		t.Run(input.name, func(t *testing.T) {
			client := Client{BaseURL: input.baseURL, Token: input.token}
			if err := client.PostJSON(context.Background(), input.path, nil, nil); err == nil {
				t.Fatal("非法客户端配置仍发起请求")
			}
		})
	}
}

// TestPostJSONRejectsRedirect 验证平台重定向不能把令牌带到其他 HTTP 地址。
func TestPostJSONRejectsRedirect(t *testing.T) {
	var leaked atomic.Int32
	target := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("ithings-token") != "" {
			leaked.Add(1)
		}
		writer.WriteHeader(http.StatusOK)
	}))
	defer target.Close()
	platform := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Location", target.URL+"/leak")
		writer.WriteHeader(http.StatusTemporaryRedirect)
	}))
	defer platform.Close()
	client := Client{BaseURL: platform.URL, Token: "private-token", HTTP: &http.Client{CheckRedirect: func(*http.Request, []*http.Request) error { return nil }}}
	err := client.PostJSON(context.Background(), "/api/demo", nil, nil)
	apiError, ok := err.(*APIError)
	if !ok || apiError.Status != http.StatusTemporaryRedirect || leaked.Load() != 0 {
		t.Fatalf("平台重定向未安全停止: %v leaked=%d", err, leaked.Load())
	}
}

// TestPostJSONTokenHeaderAndLimit 验证旧平台令牌头可显式选择，超长响应会在解码前拒绝。
func TestPostJSONTokenHeaderAndLimit(t *testing.T) {
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		requests.Add(1)
		if request.Header.Get("token") != "private-token" || request.Header.Get("ithings-token") != "" {
			t.Error("令牌头未使用受控的 token 形式")
		}
		_, _ = writer.Write([]byte(`{"code":200,"data":"long response"}`))
	}))
	defer server.Close()
	client := Client{BaseURL: server.URL, Token: "private-token", TokenHeader: "token", ResponseLimit: 8}
	if err := client.PostJSON(context.Background(), "/api/demo", nil, nil); err == nil || !strings.Contains(err.Error(), "exceeds limit") {
		t.Fatalf("超长响应未拒绝: %v", err)
	}
	client.ResponseLimit = 1024
	var response map[string]any
	if err := client.PostJSON(context.Background(), "/api/demo", nil, &response); err != nil || response["code"] != json.Number("200") {
		t.Fatalf("受控令牌头或响应解码失败: %v %#v", err, response)
	}
	client.TokenHeader = "x-user-role"
	if err := client.PostJSON(context.Background(), "/api/demo", nil, nil); err == nil || requests.Load() != 2 {
		t.Fatalf("非法令牌头进入平台请求: %v, requests=%d", err, requests.Load())
	}
	client.TokenHeader = "token"
	client.ResponseLimit = 16<<20 + 1
	if err := client.PostJSON(context.Background(), "/api/demo", nil, nil); err == nil || requests.Load() != 2 {
		t.Fatalf("过大响应上限进入平台请求: %v, requests=%d", err, requests.Load())
	}
}
