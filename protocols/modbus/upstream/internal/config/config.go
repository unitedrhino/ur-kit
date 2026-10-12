package config

import (
	"gitee.com/unitedrhino/share/conf"
	"github.com/zeromicro/go-zero/zrpc"
)

type Config struct {
	DmRpc conf.RpcClientConf `json:",optional"`
	zrpc.RpcServerConf
}
