// 本文件在本地模拟平台接口，验证云协议从注册到设备同步及退出的完整流程。
package cloud

import (
	"context"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
)

// TestCloudRuntimeDeviceSync 验证首次配置在任务注册前生效、设备回调可用且退出后不再执行。
func TestCloudRuntimeDeviceSync(t *testing.T) {
	released := 0
	base, manager, registry := newRuntimeParts(t, &released)
	source := &runtimeConfigSource{version: "first"}
	scheduler := &deviceSyncScheduler{}
	timer, err := core.NewTimer(core.TimerOptions{ProtocolCode: "cloud-example", ServerName: "runtime-test", GroupCode: "cloud-example", Scheduler: scheduler})
	if err != nil {
		t.Fatal(err)
	}
	products := GRPCProductSource{ProtocolCode: "cloud-example", Client: fakeProductClient{list: func(*dm.ProductInfoGetListReq) (*dm.ProductInfoGetListResp, error) {
		return &dm.ProductInfoGetListResp{Total: 1, List: []*dm.ProductInfo{{ProductID: "p1", ProtocolConf: map[string]string{"connection": "first"}}}}, nil
	}}}
	devices := GRPCDeviceSource{Client: fakeDeviceClient{list: func(*dm.DeviceInfoGetListReq) (*dm.DeviceInfoGetListResp, error) {
		return &dm.DeviceInfoGetListResp{Total: 1, List: []*dm.DeviceInfo{{ProductID: "p1", DeviceName: "d1"}}}, nil
	}}}
	visits := 0
	if err := RegisterDeviceSync(timer, products, devices, "connection", manager, func(_ context.Context, config testCloudConfig, product *dm.ProductInfo, device *dm.DeviceInfo) error {
		if config.Key != "first" || product.ProductID != "p1" || device.DeviceName != "d1" {
			t.Fatalf("同步参数错误: config=%+v product=%+v device=%+v", config, product, device)
		}
		visits++
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	runtime, err := NewRuntime(RuntimeOptions[testCloudConfig]{Base: base, Manager: manager, Source: source, ProtocolCode: "cloud-example", Timer: timer})
	if err != nil {
		t.Fatal(err)
	}
	if err := runtime.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if registry.registers != 1 || source.calls != 1 || scheduler.task.Handler == nil {
		t.Fatalf("协议未依次注册并加载配置: registry=%+v source=%+v task=%+v", registry, source, scheduler.task)
	}
	if err := scheduler.task.Handler(context.Background(), time.Now()); err != nil || visits != 1 {
		t.Fatalf("设备同步未执行: visits=%d err=%v", visits, err)
	}
	runtime.Stop()
	if err := scheduler.task.Handler(context.Background(), time.Now()); err != nil || visits != 1 || released != 1 {
		t.Fatalf("退出后仍同步设备或资源未释放: visits=%d released=%d err=%v", visits, released, err)
	}
}
