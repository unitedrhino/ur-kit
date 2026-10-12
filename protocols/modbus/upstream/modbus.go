package main

import (
	"context"
	"fmt"
	"gitee.com/unitedrhino/share/interceptors"
	"gitee.com/unitedrhino/share/services"

	"gitee.com/unitedrhino/protocol/modbus/internal/config"
	modbusServer "gitee.com/unitedrhino/protocol/modbus/internal/server/modbus"
	"gitee.com/unitedrhino/protocol/modbus/internal/startup"
	"gitee.com/unitedrhino/protocol/modbus/internal/svc"
	"gitee.com/unitedrhino/protocol/modbus/pb/modbus"

	"gitee.com/unitedrhino/share/utils"
	"github.com/zeromicro/go-zero/core/service"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	defer utils.Recover(context.Background())
	var c config.Config
	utils.ConfMustLoad("etc/modbus.yaml", &c)
	svcCtx := svc.NewServiceContext(c)
	startup.Init(svcCtx)
	s := services.MustNewServer(c.RpcServerConf, func(grpcServer *grpc.Server) {
		modbus.RegisterModbusServer(grpcServer, modbusServer.NewModbusServer(svcCtx))

		if c.Mode == service.DevMode || c.Mode == service.TestMode {
			reflection.Register(grpcServer)
		}
	})
	defer s.Stop()
	s.AddUnaryInterceptors(interceptors.Ctxs, interceptors.Error)

	fmt.Printf("Starting rpc server at %s...\n", c.ListenOn)
	s.Start()
}
