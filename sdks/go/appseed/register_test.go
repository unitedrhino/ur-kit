// 本文件验证公开应用注册的 HTTP 合同、认证头、错误处理和 ID 精度。
package appseed

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/unitedrhino/ur-kit/sdks/go/httpclient"
)

// TestRegisterContract 验证大型 ID 保持字符串且模板通过受认证的 POST 发送。
func TestRegisterContract(t *testing.T) {
	definition := Definition{App: json.RawMessage(`{"id":"9007199254740993","name":"行业应用"}`), Menus: []json.RawMessage{json.RawMessage(`{"id":"9007199254740994","appID":"9007199254740993","parentID":"1"}`)}}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" || r.URL.Path != "/api/v1/system/app/info/batch-import" {
			t.Errorf("注册路由错误: %s %s", r.Method, r.URL.Path)
		}
		if r.Header.Get("ithings-token") != "test-admin" || r.Header.Get("tenant-code") != "platform" {
			t.Error("注册身份头丢失")
		}
		var got Definition
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Error(err)
		}
		if string(got.App) != string(definition.App) {
			t.Error("应用模板发生变化")
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":200,"data":{"id":"9007199254740993"}}`))
	}))
	defer server.Close()
	id, err := Register(context.Background(), httpclient.Client{BaseURL: server.URL, Token: "test-admin", TenantCode: "platform"}, definition)
	if err != nil || id != "9007199254740993" {
		t.Fatalf("注册失败: %s %v", id, err)
	}
}

// TestRegisterRejectsFailures 验证平台拒绝、旧平台缺少入口和错误响应不会被当作成功。
func TestRegisterRejectsFailures(t *testing.T) {
	cases := []struct {
		name, body string
		status     int
	}{
		{"业务拒绝", `{"code":100002,"msg":"denied"}`, 200},
		{"错误应用ID", `{"code":200,"data":{"id":"700"}}`, 200},
		{"数值ID", `{"code":200,"data":{"id":600}}`, 200},
		{"无业务码", `{"data":{"id":"600"}}`, 200},
		{"旧平台", `not found`, 404},
		{"无权限", `denied`, 403},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.status)
				_, _ = w.Write([]byte(tc.body))
			}))
			defer s.Close()
			_, err := Register(context.Background(), httpclient.Client{BaseURL: s.URL, Token: "never-log-this-token"}, Definition{App: json.RawMessage(`{"id":"600"}`)})
			if err == nil {
				t.Fatal("失败响应不能注册成功")
			}
			if strings.Contains(err.Error(), "never-log-this-token") {
				t.Fatal("错误泄露令牌")
			}
		})
	}
}

// TestRegisterInvalidTemplate 验证无效 ID 在发送 HTTP 请求前被拒绝。
func TestRegisterInvalidTemplate(t *testing.T) {
	for _, app := range []string{`null`, `{}`, `{"id":600}`, `{"id":"0"}`, `{"id":"-1"}`, `{bad`} {
		if _, err := Register(context.Background(), httpclient.Client{}, Definition{App: json.RawMessage(app)}); err == nil {
			t.Fatalf("接受无效应用 %s", app)
		}
	}
}
