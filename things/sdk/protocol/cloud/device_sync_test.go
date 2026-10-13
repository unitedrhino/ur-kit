// 本文件验证云协议周期任务按产品配置同步设备及失败隔离。
package cloud

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

// deviceSyncScheduler 保存本次注册的周期任务。
type deviceSyncScheduler struct{ task core.TimerTask }

// Register 接收并保存周期任务以供测试触发。
func (scheduler *deviceSyncScheduler) Register(_ context.Context, task core.TimerTask) error {
	scheduler.task = task
	return nil
}

// TestRegisterDeviceSync 验证主子协议配置选择、设备分页和单设备失败后的继续处理。
func TestRegisterDeviceSync(t *testing.T) {
	manager, err := NewConfigManager(Options[testCloudConfig]{
		Key:     func(config testCloudConfig) string { return config.Key },
		Equal:   func(left, right testCloudConfig) bool { return left == right },
		Prepare: func(context.Context, testCloudConfig) (func(), error) { return nil, nil },
	})
	if err != nil {
		t.Fatal(err)
	}
	defer manager.Close()
	if err := manager.Reconcile(context.Background(), []testCloudConfig{{Key: "main"}, {Key: "sub"}}); err != nil {
		t.Fatal(err)
	}
	scheduler := &deviceSyncScheduler{}
	timer, err := core.NewTimer(core.TimerOptions{ProtocolCode: "cloud-example", ServerName: "cloud-example", GroupCode: "protocol", Scheduler: scheduler})
	if err != nil {
		t.Fatal(err)
	}
	defer timer.Stop()
	products := GRPCProductSource{ProtocolCode: "cloud-example", Client: fakeProductClient{list: func(req *dm.ProductInfoGetListReq) (*dm.ProductInfoGetListResp, error) {
		if req.Page.Page != 1 {
			t.Fatalf("产品页码错误: %d", req.Page.Page)
		}
		return &dm.ProductInfoGetListResp{Total: 2, List: []*dm.ProductInfo{
			{ProductID: "p1", ProtocolConf: map[string]string{"connection": "main"}},
			{ProductID: "p2", SubProtocolCode: wrapperspb.String("cloud-example"), SubProtocolConf: map[string]string{"connection": "sub"}},
		}}, nil
	}}}
	devices := GRPCDeviceSource{PageSize: 1, Client: fakeDeviceClient{list: func(req *dm.DeviceInfoGetListReq) (*dm.DeviceInfoGetListResp, error) {
		if req.ProductID == "p1" {
			return &dm.DeviceInfoGetListResp{Total: 2, List: []*dm.DeviceInfo{{ProductID: "p1", DeviceName: []string{"d1", "d2"}[req.Page.Page-1]}}}, nil
		}
		return &dm.DeviceInfoGetListResp{Total: 1, List: []*dm.DeviceInfo{{ProductID: "p2", DeviceName: "d3"}}}, nil
	}}}
	var visited []string
	err = RegisterDeviceSync(timer, products, devices, "connection", manager, func(_ context.Context, config testCloudConfig, product *dm.ProductInfo, device *dm.DeviceInfo) error {
		visited = append(visited, product.ProductID+"/"+device.DeviceName+":"+config.Key)
		if device.DeviceName == "d1" {
			return errors.New("device unavailable")
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := timer.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	err = scheduler.task.Handler(context.Background(), time.Now())
	if err == nil || !strings.Contains(err.Error(), "p1/d1") || !reflect.DeepEqual(visited, []string{"p1/d1:main", "p1/d2:main", "p2/d3:sub"}) {
		t.Fatalf("同步结果错误: visited=%v, err=%v", visited, err)
	}
}
