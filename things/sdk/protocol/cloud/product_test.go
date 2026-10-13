// 本文件验证云协议产品同步时主子协议配置选择、分页和单项失败隔离。
package cloud

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

// fakeProductClient 只实现本测试使用的产品列表 RPC。
type fakeProductClient struct {
	dm.ProductManageClient
	list func(*dm.ProductInfoGetListReq) (*dm.ProductInfoGetListResp, error)
}

// ProductInfoGetList 返回当前测试场景的分页产品。
func (client fakeProductClient) ProductInfoGetList(_ context.Context, req *dm.ProductInfoGetListReq, _ ...grpc.CallOption) (*dm.ProductInfoGetListResp, error) {
	return client.list(req)
}

// TestForEachConfig 验证主子协议分别选取配置，并在一个产品失败后继续处理。
func TestForEachConfig(t *testing.T) {
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
	products := []*dm.ProductInfo{
		{ProductID: "p1", ProtocolConf: map[string]string{"connection": "main"}},
		{ProductID: "p2", ProtocolConf: map[string]string{"connection": "main"}, SubProtocolCode: wrapperspb.String("cloud-example"), SubProtocolConf: map[string]string{"connection": "sub"}},
		{ProductID: "p3", ProtocolConf: map[string]string{"connection": "missing"}},
	}
	var visited []string
	source := GRPCProductSource{ProtocolCode: "cloud-example", PageSize: 1, Client: fakeProductClient{list: func(req *dm.ProductInfoGetListReq) (*dm.ProductInfoGetListResp, error) {
		if req.ProtocolCode != "cloud-example" || req.Page.Size != 1 || req.Page.Page < 1 || req.Page.Page > 3 {
			t.Fatalf("产品分页请求错误: %+v", req)
		}
		return &dm.ProductInfoGetListResp{Total: 3, List: []*dm.ProductInfo{products[req.Page.Page-1]}}, nil
	}}}
	err = ForEachConfig(context.Background(), source, "connection", manager, func(_ context.Context, config testCloudConfig, product *dm.ProductInfo) error {
		visited = append(visited, product.ProductID+":"+config.Key)
		if product.ProductID == "p1" {
			return errors.New("device sync failed")
		}
		return nil
	})
	if err == nil || !reflect.DeepEqual(visited, []string{"p1:main", "p2:sub"}) {
		t.Fatalf("产品配置或失败隔离错误: visited=%v, err=%v", visited, err)
	}
}
