// 本文件通过公开 Things RPC 解析独立协议服务启动时的运行配置。
package runtimeconfig

import (
	"context"
	"errors"
	"strings"

	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Reader 是协议运行配置所需的最小公开 RPC 接口。
type Reader interface {
	ProtocolRuntimeConfigGetOne(context.Context, *dm.ProtocolRuntimeConfigGetReq, ...grpc.CallOption) (*dm.ProtocolRuntimeConfigResp, error)
}

// Resolve 从平台读取协议覆盖配置；无配置或未找到时保留调用方的本地基础配置。
func Resolve[T any](ctx context.Context, code string, base T, reader Reader) (T, error) {
	var empty T
	if strings.TrimSpace(code) == "" {
		return empty, errors.New("protocol code is required")
	}
	if reader == nil {
		return base, nil
	}
	response, err := reader.ProtocolRuntimeConfigGetOne(ctx, &dm.ProtocolRuntimeConfigGetReq{ProtocolCode: code})
	if status.Code(err) == codes.NotFound {
		return base, nil
	}
	if err != nil {
		return empty, err
	}
	if response == nil || strings.TrimSpace(response.ConfigJson) == "" {
		return base, nil
	}
	return MergeConfigJSON(base, response.ConfigJson)
}
