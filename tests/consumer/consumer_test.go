// 本文件从仓外模块验证公开缓存、种子类型、物模型及 Modbus 示例可以组合使用。
package consumer

import (
	"context"
	"net"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/cache/common"
	"github.com/unitedrhino/ur-kit/cache/platform"
	_ "github.com/unitedrhino/ur-kit/cache/redis"
	"github.com/unitedrhino/ur-kit/protocols/modbus"
	_ "github.com/unitedrhino/ur-kit/things/sdk/cache"
	_ "github.com/unitedrhino/ur-kit/things/sdk/deviceauth"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/cloud"
	_ "github.com/unitedrhino/ur-kit/things/sdk/protocol/configmerge"
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
