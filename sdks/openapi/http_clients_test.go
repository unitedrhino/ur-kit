// 本文件验证从固定 Swagger 生成的 Go HTTP 客户端能无损发送大整数 ID 和认证头。
package openapi_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	thingsapi "github.com/unitedrhino/ur-kit/sdks/openapi/go/things"
)

// TestThingsAlarmStringIDs 验证告警请求的字符串 ID 不经浮点数转换。
func TestThingsAlarmStringIDs(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/things/alarm/info/evaluate-trigger" {
			t.Errorf("method/path=%s %s", r.Method, r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer local-token" {
			t.Errorf("Authorization=%q", r.Header.Get("Authorization"))
		}
		var body struct {
			AlarmIDStrings []string `json:"alarmIDStrings"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || len(body.AlarmIDStrings) != 1 || body.AlarmIDStrings[0] != "9007199254740993" {
			t.Errorf("request body=%+v err=%v", body, err)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":0,"msg":"ok","data":{}}`))
	}))
	defer server.Close()
	config := thingsapi.NewConfiguration()
	config.Servers = thingsapi.ServerConfigurations{{URL: server.URL}}
	config.AddDefaultHeader("Authorization", "Bearer local-token")
	client := thingsapi.NewAPIClient(config)
	request := thingsapi.NewAlarmEvaluateTriggerReq()
	request.SetAlarmIDStrings([]string{"9007199254740993"})
	_, _, err := client.ThingsAlarmInfoAPI.PostApiV1ThingsAlarmInfoEvaluateTrigger(context.Background()).AlarmEvaluateTriggerReq(*request).Execute()
	if err != nil || !called {
		t.Fatalf("called=%t err=%v", called, err)
	}
}
