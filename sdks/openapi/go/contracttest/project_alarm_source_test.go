// 本文件验证生成的 Things HTTP 客户端保留大整数项目编号和服务认证请求头。
package contracttest

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	thingsapi "github.com/unitedrhino/ur-kit/sdks/openapi/go/things"
)

// TestProjectAlarmSourceWire 验证结构来源等级请求的实际 HTTP 路径、类型与认证头。
func TestProjectAlarmSourceWire(t *testing.T) {
	const projectID = "9007199254740993"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/things/project/alarm-source/structure-set" {
			t.Errorf("请求线缆错误: %s %s", r.Method, r.URL.Path)
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("token") != "service-token" || r.Header.Get("project-id") != projectID {
			t.Errorf("认证请求头未保留: %v", r.Header)
		}
		var body struct {
			ProjectID string `json:"projectID"`
			Level     int64  `json:"level"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.ProjectID != projectID || body.Level != 4 {
			t.Errorf("请求体错误: %+v: %v", body, err)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"code":200,"data":{"alarmStatus":5}}`))
	}))
	defer server.Close()

	config := thingsapi.NewConfiguration()
	config.Servers = thingsapi.ServerConfigurations{{URL: server.URL}}
	config.HTTPClient = server.Client()
	config.AddDefaultHeader("token", "service-token")
	config.AddDefaultHeader("project-id", projectID)
	client := thingsapi.NewAPIClient(config)
	response, _, err := client.ThingsProjectAlarmSourceAPI.PostApiV1ThingsProjectAlarmSourceStructureSet(context.Background()).ProjectAlarmSourceSetReq(*thingsapi.NewProjectAlarmSourceSetReq(4, projectID)).Execute()
	if err != nil {
		t.Fatal(err)
	}
	if response == nil || response.Data.AlarmStatus != 5 {
		t.Fatalf("聚合结果错误: %+v", response)
	}
}
