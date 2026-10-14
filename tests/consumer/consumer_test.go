// 本文件从仓外模块验证公开 SDK、中间件、缓存、物模型及 Modbus 可以组合使用。
package consumer

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/cache/common"
	"github.com/unitedrhino/ur-kit/cache/platform"
	_ "github.com/unitedrhino/ur-kit/cache/redis"
	middleware "github.com/unitedrhino/ur-kit/middleware/go"
	"github.com/unitedrhino/ur-kit/protocols/modbus"
	"github.com/unitedrhino/ur-kit/sdks/go/httpclient"
	_ "github.com/unitedrhino/ur-kit/sdks/go/rpcclient"
	_ "github.com/unitedrhino/ur-kit/things/sdk/cache"
	_ "github.com/unitedrhino/ur-kit/things/sdk/deviceauth"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/cloud"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/configmerge"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/configselect"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/mqtt"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/natsbus"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/runtimeconfig"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking/gozero"
	"github.com/unitedrhino/ur-kit/things/sdk/schema"
	"github.com/unitedrhino/ur-kit/things/sdk/seed"
)

// TestPublicPackages 验证外部应用不依赖 SaaS 私有模块即可使用四组公开能力。
func TestPublicPackages(t *testing.T) {
	ctx := context.Background()
	base, err := common.NewCache(time.Minute, func(_ context.Context, key string) (string, bool, error) {
		return key + "-loaded", true, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if got, found, err := base.Get(ctx, "device"); err != nil || !found || got != "device-loaded" {
		t.Fatalf("公共缓存读取失败：%q %v %v", got, found, err)
	}

	permissions, err := platform.NewProjectPermissionCache(time.Minute, func(_ context.Context, key platform.UserAuthKey) ([]platform.ProjectPermission, error) {
		return []platform.ProjectPermission{{ProjectID: key.UserID, AuthType: 1}}, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	items, err := permissions.Get(ctx, platform.UserAuthKey{TenantCode: "example", UserID: 7})
	if err != nil || len(items) != 1 || items[0].ProjectID != 7 {
		t.Fatalf("平台权限缓存读取失败：%v %v", items, err)
	}

	category := seed.Category{ID: 9007199254740993, Code: "meter", Name: "仪表"}
	if category.ID != 9007199254740993 || (&schema.Model{}).Version != "" {
		t.Fatal("公开种子或物模型类型不可用")
	}
	if !((protocol.DefaultConf{}).Equal(protocol.DefaultConf{})) || (protocol.DefaultConf{}).GenKey() != "" {
		t.Fatal("无配置协议默认值不可用")
	}
	subCode := "modbus"
	if selected := configselect.Select("modbus", &subCode, map[string]string{"source": "main"}, map[string]string{"source": "sub"}); selected["source"] != "sub" {
		t.Fatalf("协议配置选择错误：%v", selected)
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	serveCtx, stop := context.WithCancel(ctx)
	done := make(chan error, 1)
	go func() { done <- modbus.NewSimulator([]uint16{42}).Serve(serveCtx, listener) }()
	t.Cleanup(func() {
		stop()
		if err := <-done; err != nil {
			t.Errorf("模拟设备退出失败：%v", err)
		}
	})
	client := modbus.Client{Address: listener.Addr().String(), UnitID: 1}
	values, err := client.ReadHoldingRegisters(ctx, 0, 1)
	if err != nil || len(values) != 1 || values[0] != 42 {
		t.Fatalf("Modbus 读取失败：%v %v", values, err)
	}
}

// TestPublicHTTPComposition 验证仓外应用可将公开客户端与身份中间件直接组合。
func TestPublicHTTPComposition(t *testing.T) {
	handler := middleware.HTTP(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		identity, ok := middleware.FromContext(request.Context())
		if !ok || identity.UserID != "9007199254740993" || identity.TenantCode != "example" || identity.ProjectID != "9007199254740993" || request.Header.Get("ithings-user") != "" {
			t.Error("业务处理器未收到可信身份，或收到了伪造身份头")
			writer.WriteHeader(http.StatusInternalServerError)
			return
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]string{"userId": identity.UserID})
	}), middleware.Options{
		Authenticator: middleware.AuthenticatorFunc(func(request *http.Request, token string) (middleware.Identity, error) {
			if token != "local-token" {
				return middleware.Identity{}, http.ErrNoCookie
			}
			return middleware.Identity{UserID: "9007199254740993", TenantCode: request.Header.Get("tenant-code"), ProjectID: request.Header.Get("project-id")}, nil
		}),
		Authorizer: middleware.AuthorizerFunc(func(_ context.Context, identity middleware.Identity, resource, action string) bool {
			return identity.TenantCode == "example" && resource == "device" && action == "view"
		}),
		Resource: "device", Action: "view",
	})
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		request.Header.Set("ithings-user", "forged")
		handler.ServeHTTP(writer, request)
	}))
	defer server.Close()
	client := httpclient.Client{BaseURL: server.URL, Token: "local-token", TenantCode: "example", ProjectID: "9007199254740993"}
	var response map[string]any
	if err := client.PostJSON(context.Background(), "/api/device", map[string]any{"id": "9007199254740993"}, &response); err != nil {
		t.Fatal(err)
	}
	if response["userId"] != "9007199254740993" {
		t.Fatalf("公开 HTTP 组合丢失大整数身份: %#v", response)
	}
}
