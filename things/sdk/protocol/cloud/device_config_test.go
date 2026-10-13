// 本文件验证设备协议配置根据所属产品选择主协议或子协议字段。
package cloud

import (
	"context"
	"errors"
	"testing"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

// TestDeviceProtocolConfig 验证产品查询错误、归属不符和主子协议选择。
func TestDeviceProtocolConfig(t *testing.T) {
	device := &dm.DeviceInfo{ProductID: "platform-1", ProtocolConf: map[string]string{"source": "main"},
		SubProtocolConf: map[string]string{"source": "sub"}}
	product := &dm.ProductInfo{ProductID: "platform-1", SubProtocolCode: wrapperspb.String("modbus")}
	lookup := func(_ context.Context, id string) (*dm.ProductInfo, error) {
		if id != "platform-1" {
			t.Fatalf("产品 ID 错误: %s", id)
		}
		return product, nil
	}
	config, err := DeviceProtocolConfig(context.Background(), lookup, "modbus", device)
	if err != nil || config["source"] != "sub" {
		t.Fatalf("子协议设备配置错误: %v %v", config, err)
	}
	config, err = DeviceProtocolConfig(context.Background(), lookup, "other", device)
	if err != nil || config["source"] != "main" {
		t.Fatalf("主协议设备配置错误: %v %v", config, err)
	}
	if _, err = DeviceProtocolConfig(context.Background(), func(context.Context, string) (*dm.ProductInfo, error) {
		return nil, errors.New("unavailable")
	}, "modbus", device); err == nil {
		t.Fatal("产品查询失败未传播")
	}
	if _, err = DeviceProtocolConfig(context.Background(), func(context.Context, string) (*dm.ProductInfo, error) {
		return &dm.ProductInfo{ProductID: "other"}, nil
	}, "modbus", device); err == nil {
		t.Fatal("不匹配产品 ID 未拒绝")
	}
}
