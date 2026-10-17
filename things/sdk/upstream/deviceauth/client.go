// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件提供独立于 SaaS go-zero 服务上下文的设备认证 gRPC 客户端入口。
package deviceauth

import (
	dg "gitee.com/unitedrhino/things/sdk/deviceauth/pb/dg"
	"google.golang.org/grpc"
)

// Client 是设备登录、访问认证与注册的生成 RPC 客户端接口。
type Client = dg.DeviceAuthClient

// DeviceAuth 保留原 Things SDK 的设备认证接口名称，使用标准 gRPC 连接。
type DeviceAuth = Client

// LoginAuthReq 是设备登录认证请求。
type LoginAuthReq = dg.LoginAuthReq

// AccessAuthReq 是设备访问认证请求。
type AccessAuthReq = dg.AccessAuthReq

// DeviceRegisterReq 是设备注册请求。
type DeviceRegisterReq = dg.DeviceRegisterReq

// DeviceRegisterResp 是设备注册响应。
type DeviceRegisterResp = dg.DeviceRegisterResp

// Request 是原设备认证服务的通用请求。
type Request = dg.Request

// Response 是原设备认证服务的通用响应。
type Response = dg.Response

// NewClient 使用标准 gRPC 连接创建设备认证客户端；连接生命周期由调用方管理。
func NewClient(connection grpc.ClientConnInterface) Client {
	return dg.NewDeviceAuthClient(connection)
}

// NewDeviceAuth 保留原 Things SDK 的构造入口；go-zero 客户端可传入其 Conn()。
func NewDeviceAuth(connection grpc.ClientConnInterface) DeviceAuth {
	return NewClient(connection)
}
