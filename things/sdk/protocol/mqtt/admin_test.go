// 本文件验证公开 EMQX 管理客户端的认证、差量订阅和失败语义。
package mqtt

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
)

// TestAdminSubscriptions 验证设备 ID 转义、Basic 认证和差量批量订阅。
func TestAdminSubscriptions(t *testing.T) {
	var posted []subscription
	var removed []subscription
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, secret, ok := r.BasicAuth()
		if !ok || user != "key" || secret != "secret" || !strings.HasPrefix(r.URL.EscapedPath(), "/api/v5/clients/device%2Fone") {
			t.Errorf("invalid authentication or client path: %s", r.URL.EscapedPath())
		}
		switch r.URL.Path[len("/api/v5/clients/device/one"):] {
		case "/subscriptions":
			_, _ = w.Write([]byte(`[{"topic":"existing","qos":1}]`))
		case "/subscribe/bulk":
			if r.Header.Get("Content-Type") != "application/json" || json.NewDecoder(r.Body).Decode(&posted) != nil {
				t.Error("invalid subscribe request")
			}
			w.WriteHeader(http.StatusNoContent)
		case "/unsubscribe/bulk":
			if err := json.NewDecoder(r.Body).Decode(&removed); err != nil {
				t.Error(err)
			}
			w.WriteHeader(http.StatusNoContent)
		default:
			t.Errorf("unexpected request: %s", r.URL.Path)
		}
	}))
	defer server.Close()
	admin := &Admin{BaseURL: server.URL, APIKey: "key", Secret: "secret"}
	if err := admin.SetClientMutSub(context.Background(), "device/one", []string{"existing", "new", "new"}, 1); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual([]subscription{{Topic: "new", QoS: 1}}, posted) {
		t.Fatalf("unexpected subscriptions: %+v", posted)
	}
	if err := admin.SetClientMutUnSub(context.Background(), "device/one", []string{"old"}); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual([]subscription{{Topic: "old"}}, removed) {
		t.Fatalf("unexpected removals: %+v", removed)
	}
}

// TestAdminRejectsBrokerError 验证非成功状态不会被误判为已完成订阅。
func TestAdminRejectsBrokerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"message":"denied"}`))
	}))
	defer server.Close()
	admin := &Admin{BaseURL: server.URL}
	if err := admin.SetClientMutSub(context.Background(), "device", []string{"topic"}, 0); err == nil || !strings.Contains(err.Error(), "401") {
		t.Fatalf("expected unauthorized error, got %v", err)
	}
}
