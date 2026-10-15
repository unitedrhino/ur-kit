// 本文件验证仓外应用直接通过公开生成客户端调用 Things，认证与业务 ID 不依赖私有服务代码。
package consumer

import (
	"context"
	"net"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/sdks/go/rpcclient"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

// productRPCServer 使用公开服务接口回显产品 ID，并记录实际到达服务端的认证元数据。
type productRPCServer struct {
	dm.UnimplementedProductManageServer
	metadata chan metadata.MD // 每次真实 RPC 到达服务端后记录的元数据。
}

// ProductInfoGetOne 回显产品并保留超过 JS 安全整数范围的分类 ID。
func (server *productRPCServer) ProductInfoGetOne(ctx context.Context, request *dm.ProductInfoGetOneReq) (*dm.ProductInfo, error) {
	md, _ := metadata.FromIncomingContext(ctx)
	server.metadata <- md.Copy()
	return &dm.ProductInfo{ProductID: request.ProductID, CategoryID: 9007199254740993}, nil
}

// TestPureRPCClient 验证仓外客户端经真实 TCP 发起带认证的请求，保留大整数并过滤伪造内部身份。
func TestPureRPCClient(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	implementation := &productRPCServer{metadata: make(chan metadata.MD, 1)}
	server := grpc.NewServer()
	dm.RegisterProductManageServer(server, implementation)
	done := make(chan error, 1)
	go func() { done <- server.Serve(listener) }()
	t.Cleanup(func() {
		server.Stop()
		if err := <-done; err != nil {
			t.Error(err)
		}
	})
	connection, err := grpc.NewClient(listener.Addr().String(),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithUnaryInterceptor(rpcclient.UnaryClientInterceptor(rpcclient.Context{
			Token: "local-test-token", TenantCode: "example", ProjectID: "9007199254740993",
		})))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = connection.Close() })
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	ctx = metadata.AppendToOutgoingContext(ctx, "ithings-user", "forged")
	response, err := dm.NewProductManageClient(connection).ProductInfoGetOne(ctx, &dm.ProductInfoGetOneReq{ProductID: "meter"})
	if err != nil {
		t.Fatal(err)
	}
	if response.ProductID != "meter" || response.CategoryID != 9007199254740993 {
		t.Fatalf("纯 RPC 客户端改变了合同数据：%v", response)
	}
	md := <-implementation.metadata
	if len(md.Get("ithings-user")) != 0 || firstMetadata(md, "ithings-token") != "local-test-token" || firstMetadata(md, "tenant-code") != "example" || firstMetadata(md, "project-id") != "9007199254740993" {
		t.Fatalf("RPC 身份元数据不符合公开接入合同：%v", md)
	}
}

// firstMetadata 返回首个元数据值，缺失时返回空字符串供断言明确失败。
func firstMetadata(md metadata.MD, name string) string {
	values := md.Get(name)
	if len(values) == 0 {
		return ""
	}
	return values[0]
}
