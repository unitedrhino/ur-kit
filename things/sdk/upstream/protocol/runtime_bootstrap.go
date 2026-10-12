package protocol

import (
	"context"
	"strings"

	taskgroupmanage "gitee.com/unitedrhino/core/service/timedsvr/client/taskgroupmanage"
	taskinfomanage "gitee.com/unitedrhino/core/service/timedsvr/client/taskinfomanage"
	"gitee.com/unitedrhino/core/service/timedsvr/timedsvrdirect"
	timedSDK "gitee.com/unitedrhino/core/share/domain/timed"
	"gitee.com/unitedrhino/share/conf"
	"gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/eventBus"
	thingsruntimeconfig "gitee.com/unitedrhino/things/sdk/protocol/runtimeconfig"
	"gitee.com/unitedrhino/things/service/dmsvr/client/protocolmanage"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/zrpc"
)

func resolveRuntimeConfig(ctx context.Context, protocolCode string, protocolM protocolmanage.ProtocolManage,
	base thingsruntimeconfig.Config) (thingsruntimeconfig.Config, error) {
	if protocolM == nil {
		return base, nil
	}

	resp, err := protocolM.ProtocolRuntimeConfigGetOne(ctx, &protocolmanage.ProtocolRuntimeConfigGetReq{
		ProtocolCode: protocolCode,
	})
	if err != nil {
		if errors.Cmp(err, errors.NotFind) {
			return base, nil
		}
		return thingsruntimeconfig.Config{}, err
	}
	if strings.TrimSpace(resp.ConfigJson) == "" {
		return base, nil
	}
	return thingsruntimeconfig.MergeConfigJSON(base, resp.ConfigJson)
}

func initTimedSDKFromConfig(cfg conf.RpcClientConf, fastEvent *eventBus.FastEvent) *timedSDK.TimedSDK {
	if !hasRpcClientConf(cfg) {
		return nil
	}
	if cfg.Mode == conf.ClientModeDirect {
		// 协议容器内不内嵌 timedsvr，timed.yaml 不存在时回退到 grpc 模式
		if timedsvrdirect.ConfigExists() {
			return timedSDK.NewTimedSDK(timedsvrdirect.NewTimedClient(), fastEvent)
		}
		// timed.yaml 不存在但有 etcd 连接信息，回退 grpc 模式连接远端 timedsvr
		if len(cfg.Conf.Etcd.Hosts) > 0 || len(cfg.Conf.Endpoints) > 0 || len(cfg.Conf.Target) > 0 {
			logx.Infof("timedsvrdirect: timed.yaml 不存在，回退 grpc 模式连接 timedsvr")
		} else {
			logx.Infof("timedsvrdirect: timed.yaml 不存在且无 grpc 连接信息，跳过 timed 初始化")
			return nil
		}
	}

	timedConn := zrpc.MustNewClient(cfg.Conf)
	timedClient := timedsvrdirect.NewTimedClientFromClients(
		taskgroupmanage.NewTaskGroupManage(timedConn),
		taskinfomanage.NewTaskInfoManage(timedConn),
	)
	return timedSDK.NewTimedSDK(timedClient, fastEvent)
}

func hasRpcClientConf(cfg conf.RpcClientConf) bool {
	if cfg.Mode == conf.ClientModeDirect {
		return true
	}
	return len(cfg.Conf.Target) > 0 || len(cfg.Conf.Endpoints) > 0 || len(cfg.Conf.Etcd.Hosts) > 0
}
