// 本文件通过本机 gRPC 服务验证公开种子客户端幂等初始化。
package seed

import (
	"context"
	"net"
	"testing"

	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// categoryService 模拟产品品类 RPC，仅覆盖种子初始化所需方法。
type categoryService struct {
	dm.UnimplementedProductManageServer
	category *dm.ProductCategory
	creates  int
}

// ProductCategoryGetList 按编码返回已保存的品类。
func (service *categoryService) ProductCategoryGetList(_ context.Context, request *dm.ProductCategoryGetListReq) (*dm.ProductCategoryGetListResp, error) {
	response := &dm.ProductCategoryGetListResp{}
	if service.category != nil && service.category.Code == request.Code {
		response.List = []*dm.ProductCategory{service.category}
	}
	return response, nil
}

// ProductCategoryCreate 保存新建品类并返回完整 int64 ID。
func (service *categoryService) ProductCategoryCreate(_ context.Context, category *dm.ProductCategory) (*dm.ProductManageWithID, error) {
	service.creates++
	service.category = category
	return &dm.ProductManageWithID{Id: category.Id}, nil
}

// TestEnsureCategory 验证公开 pb 客户端在两次初始化后只创建一次且保留大整数 ID。
func TestEnsureCategory(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	server := grpc.NewServer()
	service := &categoryService{}
	dm.RegisterProductManageServer(server, service)
	go func() { _ = server.Serve(listener) }()
	defer server.Stop()
	connection, err := grpc.NewClient(listener.Addr().String(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	client := dm.NewProductManageClient(connection)
	category := Category{ID: 9007199254740993, Code: "demo", Name: "示例"}
	for attempt := 0; attempt < 2; attempt++ {
		id, ensureErr := EnsureCategory(context.Background(), client, category)
		if ensureErr != nil || id != category.ID {
			t.Fatalf("第 %d 次初始化错误：id=%d err=%v", attempt, id, ensureErr)
		}
	}
	if service.creates != 1 {
		t.Fatalf("非幂等创建次数：%d", service.creates)
	}
}
