// 本文件验证 HTTP 客户端保留大整数、认证头与平台错误状态。
package httpclient

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestPostJSON 验证 POST 请求与大整数响应不会丢失精度。
func TestPostJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost || request.URL.Path != "/api/v1/things/demo/get-one" || request.Header.Get("ithings-token") != "test-token" {
			t.Errorf("请求语义错误: %s %s", request.Method, request.URL.Path)
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"id":9007199254740993,"value":null}`))
	}))
	defer server.Close()
	client := Client{BaseURL: server.URL, Token: "test-token"}
	var response map[string]any
	if err := client.PostJSON(context.Background(), "/api/v1/things/demo/get-one", map[string]string{"id": "1"}, &response); err != nil {
		t.Fatal(err)
	}
	if response["id"] != json.Number("9007199254740993") || response["value"] != nil {
		t.Fatalf("ID 或空值语义错误: %#v", response)
	}
}
