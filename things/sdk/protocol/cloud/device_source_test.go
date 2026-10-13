// 本文件验证云协议设备分页同步的产品隔离、错误汇总与分页保护。
package cloud

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// fakeDeviceClient 在测试中模拟公开设备列表 RPC。
type fakeDeviceClient struct {
	dm.DeviceManageClient
	list func(*dm.DeviceInfoGetListReq) (*dm.DeviceInfoGetListResp, error)
}

// DeviceInfoGetList 返回本次测试设定的设备页。
func (client fakeDeviceClient) DeviceInfoGetList(_ context.Context, req *dm.DeviceInfoGetListReq, _ ...grpc.CallOption) (*dm.DeviceInfoGetListResp, error) {
	return client.list(req)
}

// TestForEachDevice 验证产品过滤、分页完成和逐设备失败后的继续处理。
func TestForEachDevice(t *testing.T) {
	var visited []string
	source := GRPCDeviceSource{PageSize: 1, Client: fakeDeviceClient{list: func(req *dm.DeviceInfoGetListReq) (*dm.DeviceInfoGetListResp, error) {
		if req.ProductID != "p1" || req.Page.Size != 1 {
			t.Fatalf("设备列表未限定产品或分页：%+v", req)
		}
		return &dm.DeviceInfoGetListResp{Total: 2, List: []*dm.DeviceInfo{{ProductID: "p1", DeviceName: []string{"d1", "d2"}[req.Page.Page-1]}}}, nil
	}}}
	err := source.ForEachDevice(context.Background(), "p1", func(_ context.Context, device *dm.DeviceInfo) error {
		visited = append(visited, device.DeviceName)
		if device.DeviceName == "d1" {
			return errors.New("temporary failure")
		}
		return nil
	})
	if !reflect.DeepEqual(visited, []string{"d1", "d2"}) || err == nil || !strings.Contains(err.Error(), "p1/d1") {
		t.Fatalf("设备同步与错误汇总不正确：visited=%v err=%v", visited, err)
	}
}

// TestForEachDeviceRejectsUnexpectedPage 验证跨产品数据和未完成的空页不能作为成功返回。
func TestForEachDeviceRejectsUnexpectedPage(t *testing.T) {
	for name, response := range map[string]*dm.DeviceInfoGetListResp{
		"other-product": {Total: 1, List: []*dm.DeviceInfo{{ProductID: "p2", DeviceName: "d1"}}},
		"empty-page":    {Total: 1},
		"changed-total": {Total: 2, List: []*dm.DeviceInfo{{ProductID: "p1", DeviceName: "d1"}}},
		"duplicate":     {Total: 2, List: []*dm.DeviceInfo{{ProductID: "p1", DeviceName: "d1"}}},
	} {
		t.Run(name, func(t *testing.T) {
			calls := 0
			source := GRPCDeviceSource{PageSize: 1, Client: fakeDeviceClient{list: func(req *dm.DeviceInfoGetListReq) (*dm.DeviceInfoGetListResp, error) {
				calls++
				if name == "changed-total" && req.Page.Page == 2 {
					return &dm.DeviceInfoGetListResp{Total: 3, List: []*dm.DeviceInfo{{ProductID: "p1", DeviceName: "d2"}}}, nil
				}
				return response, nil
			}}}
			err := source.ForEachDevice(context.Background(), "p1", func(context.Context, *dm.DeviceInfo) error { return nil })
			if err == nil || calls > 2 {
				t.Fatalf("异常分页未被拒绝：calls=%d err=%v", calls, err)
			}
		})
	}
}
