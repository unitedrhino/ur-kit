// 本文件验证从固定 Swagger 生成的 Go HTTP 客户端能无损发送大整数 ID 和认证头。
package openapi_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	coreapi "github.com/unitedrhino/ur-kit/sdks/openapi/go/core"
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

// TestCoreApplicationRegistrationContract 验证强类型客户端的应用和父子菜单标识不会被转为浮点数。
func TestCoreApplicationRegistrationContract(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/system/app/info/batch-import" || r.Header.Get("ithings-token") != "bootstrap-admin" {
			t.Error("注册路径或令牌错误")
		}
		var body struct {
			App struct {
				ID string `json:"id"`
			} `json:"app"`
			Menus []struct {
				ID       string `json:"id"`
				AppID    string `json:"appID"`
				ParentID string `json:"parentID"`
			} `json:"menus"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Error(err)
		}
		if body.App.ID != "9007199254740993" || len(body.Menus) != 1 || body.Menus[0].AppID != body.App.ID || body.Menus[0].ParentID != "1" {
			t.Error("字符串 ID 合同被改变")
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":200,"data":{"id":"9007199254740993"}}`))
	}))
	defer server.Close()
	config := coreapi.NewConfiguration()
	config.Servers = coreapi.ServerConfigurations{{URL: server.URL}}
	config.AddDefaultHeader("ithings-token", "bootstrap-admin")
	client := coreapi.NewAPIClient(config)
	app := coreapi.NewAppInfo()
	app.SetId("9007199254740993")
	menu := coreapi.NewMenuInfo()
	menu.SetId("9007199254740994")
	menu.SetAppID("9007199254740993")
	menu.SetParentID("1")
	req := coreapi.NewAppMenuBatchImportReq(*app, []coreapi.MenuInfo{*menu})
	_, _, err := client.SystemAppInfoAPI.PostApiV1SystemAppInfoBatchImport(context.Background()).AppMenuBatchImportReq(*req).Execute()
	if err != nil {
		t.Fatal(err)
	}
}
