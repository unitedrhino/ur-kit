// 本文件提供独立于 SaaS go-zero 服务上下文的设备认证 gRPC 客户端入口。
package deviceauth

import (
	dg "github.com/unitedrhino/ur-kit/sdks/go/pb/things/sdk/deviceauth/pb/dg"
	"google.golang.org/grpc"
)

// Client 是设备登录、访问认证与注册的生成 RPC 客户端接口。
type Client = dg.DeviceAuthClient

// NewClient 使用标准 gRPC 连接创建设备认证客户端；连接生命周期由调用方管理。
func NewClient(connection grpc.ClientConnInterface) Client {
	return dg.NewDeviceAuthClient(connection)
}
