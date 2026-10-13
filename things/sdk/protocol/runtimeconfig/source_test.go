// 本文件验证协议启动配置的公开 RPC 读取与错误边界。
package runtimeconfig

import (
	"context"
	"errors"
	"testing"

	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// readerFunc 允许测试注入运行配置 RPC 响应。
type readerFunc func(context.Context, *dm.ProtocolRuntimeConfigGetReq) (*dm.ProtocolRuntimeConfigResp, error)

// ProtocolRuntimeConfigGetOne 实现公开运行配置 RPC 接口。
func (reader readerFunc) ProtocolRuntimeConfigGetOne(ctx context.Context, req *dm.ProtocolRuntimeConfigGetReq, _ ...grpc.CallOption) (*dm.ProtocolRuntimeConfigResp, error) {
	return reader(ctx, req)
}

// TestResolve 验证平台覆盖、空配置、未找到与故障的处理。
func TestResolve(t *testing.T) {
	type config struct {
		Enabled bool   `json:"enabled"`
		Limit   int64  `json:"limit"`
		Name    string `json:"name"`
	}
	base := config{Enabled: true, Limit: 42, Name: "default"}
	reader := readerFunc(func(ctx context.Context, req *dm.ProtocolRuntimeConfigGetReq) (*dm.ProtocolRuntimeConfigResp, error) {
		if ctx.Value(testContextKey{}) != "authorized" || req.ProtocolCode != "modbus" {
			t.Fatal("运行配置 RPC 未传递身份上下文或协议代码")
		}
		return &dm.ProtocolRuntimeConfigResp{ConfigJson: `{"enabled":false,"limit":0}`}, nil
	})
	ctx := context.WithValue(context.Background(), testContextKey{}, "authorized")
	got, err := Resolve(ctx, "modbus", base, reader)
	if err != nil || got.Enabled || got.Limit != 0 || got.Name != "default" {
		t.Fatalf("覆盖配置错误: %+v %v", got, err)
	}
	if got, err = Resolve(ctx, "modbus", base, nil); err != nil || got != base {
		t.Fatalf("无平台 RPC 时应保留本地配置: %+v %v", got, err)
	}
	missing := readerFunc(func(context.Context, *dm.ProtocolRuntimeConfigGetReq) (*dm.ProtocolRuntimeConfigResp, error) {
		return nil, status.Error(codes.NotFound, "missing")
	})
	if got, err = Resolve(ctx, "modbus", base, missing); err != nil || got != base {
		t.Fatalf("未找到应保留本地配置: %+v %v", got, err)
	}
	if got, err = Resolve(ctx, "modbus", base, readerFunc(func(context.Context, *dm.ProtocolRuntimeConfigGetReq) (*dm.ProtocolRuntimeConfigResp, error) {
		return nil, nil
	})); err != nil || got != base {
		t.Fatalf("空响应应保留本地配置: %+v %v", got, err)
	}
	broken := errors.New("rpc unavailable")
	if _, err = Resolve(ctx, "modbus", base, readerFunc(func(context.Context, *dm.ProtocolRuntimeConfigGetReq) (*dm.ProtocolRuntimeConfigResp, error) {
		return nil, broken
	})); !errors.Is(err, broken) {
		t.Fatalf("RPC 故障被隐藏: %v", err)
	}
	if _, err = Resolve(ctx, " ", base, reader); err == nil {
		t.Fatal("空协议代码应被拒绝")
	}
	if _, err = Resolve(ctx, "modbus", base, readerFunc(func(context.Context, *dm.ProtocolRuntimeConfigGetReq) (*dm.ProtocolRuntimeConfigResp, error) {
		return &dm.ProtocolRuntimeConfigResp{ConfigJson: `[]`}, nil
	})); err == nil {
		t.Fatal("非法覆盖配置应被拒绝")
	}
}

// testContextKey 标记测试身份上下文。
type testContextKey struct{}
