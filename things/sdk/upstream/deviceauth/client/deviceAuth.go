package deviceauth

import (
	"context"

	"gitee.com/unitedrhino/things/sdk/deviceauth/pb/dg"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
)

type (
	AccessAuthReq      = dg.AccessAuthReq
	DeviceRegisterReq  = dg.DeviceRegisterReq
	DeviceRegisterResp = dg.DeviceRegisterResp
	LoginAuthReq       = dg.LoginAuthReq
	Request            = dg.Request
	Response           = dg.Response

	DeviceAuth interface {
		LoginAuth(ctx context.Context, in *LoginAuthReq, opts ...grpc.CallOption) (*Response, error)
		AccessAuth(ctx context.Context, in *AccessAuthReq, opts ...grpc.CallOption) (*Response, error)
		DeviceRegister(ctx context.Context, in *DeviceRegisterReq, opts ...grpc.CallOption) (*DeviceRegisterResp, error)
	}

	defaultDeviceAuth struct {
		cli zrpc.Client
	}
)

func NewDeviceAuth(cli zrpc.Client) DeviceAuth {
	return &defaultDeviceAuth{cli: cli}
}

func (m *defaultDeviceAuth) LoginAuth(ctx context.Context, in *LoginAuthReq, opts ...grpc.CallOption) (*Response, error) {
	client := dg.NewDeviceAuthClient(m.cli.Conn())
	return client.LoginAuth(ctx, in, opts...)
}

func (m *defaultDeviceAuth) AccessAuth(ctx context.Context, in *AccessAuthReq, opts ...grpc.CallOption) (*Response, error) {
	client := dg.NewDeviceAuthClient(m.cli.Conn())
	return client.AccessAuth(ctx, in, opts...)
}

func (m *defaultDeviceAuth) DeviceRegister(ctx context.Context, in *DeviceRegisterReq, opts ...grpc.CallOption) (*DeviceRegisterResp, error) {
	client := dg.NewDeviceAuthClient(m.cli.Conn())
	return client.DeviceRegister(ctx, in, opts...)
}
