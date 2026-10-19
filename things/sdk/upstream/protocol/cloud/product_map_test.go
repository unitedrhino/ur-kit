// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件验证外部产品 ID 映射的主子协议选择、分页刷新及失败时的快照保留。
package cloud

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

// TestProductIDMapRefresh 验证平台产品列表完整读取后才替换当前映射。
func TestProductIDMapRefresh(t *testing.T) {
	products := []*dm.ProductInfo{
		{ProductID: "platform-1", ProtocolConf: map[string]string{"productID": "remote-1"}},
		{ProductID: "platform-2", ProtocolConf: map[string]string{"productID": "wrong"},
			SubProtocolCode: wrapperspb.String("modbus"), SubProtocolConf: map[string]string{"productID": "remote-2"}},
	}
	failPage := int64(0)
	inconsistentTotal := false
	source := GRPCProductSource{ProtocolCode: "modbus", PageSize: 1, Client: fakeProductClient{list: func(request *dm.ProductInfoGetListReq) (*dm.ProductInfoGetListResp, error) {
		if request.ProtocolCode != "modbus" || request.Page.Size != 1 {
			t.Fatalf("产品列表请求错误: %+v", request)
		}
		if request.Page.Page == failPage {
			return nil, errors.New("platform unavailable")
		}
		total := int64(len(products))
		if inconsistentTotal && request.Page.Page == 2 {
			total = 1
		}
		if total == 0 {
			return &dm.ProductInfoGetListResp{}, nil
		}
		return &dm.ProductInfoGetListResp{Total: total, List: []*dm.ProductInfo{products[request.Page.Page-1]}}, nil
	}}}
	var mapping ProductIDMap
	if err := mapping.Refresh(context.Background(), source, "productID"); err != nil {
		t.Fatal(err)
	}
	if mapping.Get("remote-1") != "platform-1" || mapping.Get("remote-2") != "platform-2" || mapping.Get("wrong") != "" {
		t.Fatalf("主子协议 ID 映射错误: %v", mapping.PlatformIDs())
	}
	ids := mapping.PlatformIDs()
	if !reflect.DeepEqual(ids, []string{"platform-1", "platform-2"}) {
		t.Fatalf("平台产品列表错误: %v", ids)
	}
	ids[0] = "modified"
	if mapping.PlatformIDs()[0] != "platform-1" {
		t.Fatal("调用方可修改内部映射快照")
	}
	failPage = 2
	if err := mapping.Refresh(context.Background(), source, "productID"); err == nil {
		t.Fatal("第二页 RPC 失败后刷新未报错")
	}
	if mapping.Get("remote-2") != "platform-2" {
		t.Fatal("分页失败清空了已生效映射")
	}
	failPage = 0
	inconsistentTotal = true
	if err := mapping.Refresh(context.Background(), source, "productID"); err == nil {
		t.Fatal("分页总数变化未拒绝")
	}
	if mapping.Get("remote-2") != "platform-2" {
		t.Fatal("分页总数变化覆盖了已生效映射")
	}
	inconsistentTotal = false
	products[1].SubProtocolConf["productID"] = "remote-1"
	if err := mapping.Refresh(context.Background(), source, "productID"); err == nil {
		t.Fatal("重复外部产品 ID 未拒绝")
	}
	if mapping.Get("remote-2") != "platform-2" {
		t.Fatal("冲突产品 ID 覆盖了已生效映射")
	}
	products[1] = products[0]
	if err := mapping.Refresh(context.Background(), source, "productID"); err == nil {
		t.Fatal("分页重复平台产品未拒绝")
	}
	if !reflect.DeepEqual(mapping.PlatformIDs(), []string{"platform-1", "platform-2"}) {
		t.Fatal("重复平台产品污染了已生效映射")
	}
	products = nil
	if err := mapping.Refresh(context.Background(), source, "productID"); err != nil {
		t.Fatal(err)
	}
	if mapping.Get("remote-1") != "" || len(mapping.PlatformIDs()) != 0 {
		t.Fatal("空产品列表未移除旧映射")
	}
}
