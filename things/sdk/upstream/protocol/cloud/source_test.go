// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件验证云协议配置分页、解码与失败时保留现行配置的行为。
package cloud

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// fakeConfigClient 只实现本测试调用的本仓协议配置 RPC。
type fakeConfigClient struct {
	dm.ProtocolManageClient
	list func(*dm.ProtocolConfigGetListReq) (*dm.ProtocolConfigGetListResp, error)
}

// ProtocolConfigGetList 将分页请求交给当前测试场景。
func (client fakeConfigClient) ProtocolConfigGetList(_ context.Context, req *dm.ProtocolConfigGetListReq, _ ...grpc.CallOption) (*dm.ProtocolConfigGetListResp, error) {
	return client.list(req)
}

// testCloudConfig 代表调用方的简化协议配置。
type testCloudConfig struct{ Key string }

// TestGRPCConfigSourcePagination 验证按指定协议代码读取完整分页并解码。
func TestGRPCConfigSourcePagination(t *testing.T) {
	pages := []int64{}
	source := GRPCConfigSource[testCloudConfig]{
		ProtocolCode: "cloud-example", PageSize: 1,
		Client: fakeConfigClient{list: func(req *dm.ProtocolConfigGetListReq) (*dm.ProtocolConfigGetListResp, error) {
			if req.ProtocolCode != "cloud-example" || req.Page.Size != 1 {
				t.Fatalf("协议过滤或分页错误: %+v", req)
			}
			pages = append(pages, req.Page.Page)
			return &dm.ProtocolConfigGetListResp{Total: 2, List: []*dm.ProtocolConfig{{Id: req.Page.Page, Config: map[string]string{"key": fmt.Sprint(req.Page.Page)}}}}, nil
		}},
		Decode: func(raw map[string]string) (testCloudConfig, error) { return testCloudConfig{Key: raw["key"]}, nil },
	}
	configs, err := source.Fetch(context.Background())
	if err != nil || len(configs) != 2 || configs[0].Key != "1" || configs[1].Key != "2" || len(pages) != 2 || pages[0] != 1 || pages[1] != 2 {
		t.Fatalf("协议配置分页错误: %+v, pages=%v, err=%v", configs, pages, err)
	}
}

// TestGRPCConfigSourceFailureKeepsCurrent 验证后续分页失败不会清空现有配置。
func TestGRPCConfigSourceFailureKeepsCurrent(t *testing.T) {
	manager, err := NewConfigManager(Options[testCloudConfig]{
		Key:     func(config testCloudConfig) string { return config.Key },
		Equal:   func(left, right testCloudConfig) bool { return left == right },
		Prepare: func(context.Context, testCloudConfig) (func(), error) { return nil, nil },
	})
	if err != nil {
		t.Fatal(err)
	}
	defer manager.Close()
	if err := manager.Reconcile(context.Background(), []testCloudConfig{{Key: "current"}}); err != nil {
		t.Fatal(err)
	}
	source := GRPCConfigSource[testCloudConfig]{
		ProtocolCode: "cloud-example", PageSize: 1,
		Client: fakeConfigClient{list: func(req *dm.ProtocolConfigGetListReq) (*dm.ProtocolConfigGetListResp, error) {
			if req.Page.Page == 2 {
				return nil, errors.New("platform unavailable")
			}
			return &dm.ProtocolConfigGetListResp{Total: 2, List: []*dm.ProtocolConfig{{Config: map[string]string{"key": "new"}}}}, nil
		}},
		Decode: func(raw map[string]string) (testCloudConfig, error) { return testCloudConfig{Key: raw["key"]}, nil },
	}
	if err := source.Refresh(context.Background(), manager); err == nil {
		t.Fatal("后续分页失败被当作更新成功")
	}
	if _, exists := manager.Get("current"); !exists {
		t.Fatal("失败后丢失原配置")
	}
	if _, exists := manager.Get("new"); exists {
		t.Fatal("失败后部分新配置生效")
	}
}
