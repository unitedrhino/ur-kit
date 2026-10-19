// 本文件装配 Modbus 协议平台适配器及设备连接表。
package svc

import (
	"gitee.com/unitedrhino/protocol/modbus/internal/config"
	"gitee.com/unitedrhino/protocol/modbus/internal/domain"
	modbusweb "gitee.com/unitedrhino/protocol/modbus/internal/web"
	"gitee.com/unitedrhino/things/sdk/protocol/platformcore"
	"gitee.com/unitedrhino/things/share/devices"
	"gitee.com/unitedrhino/things/share/domain/protocols"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/zrpc"
	"sync"
	"sync/atomic"
)

type ServiceContext struct {
	MsgToken    atomic.Int64
	Config      config.Config
	Protocol    *platformcore.CoreProtocol
	DevCliMutex sync.RWMutex
	DevCli      map[devices.Core]*domain.DevInfo
}

var DeviceFields = []*dm.ProtocolConfigField{
	{Id: 1, Key: "address", Label: "地址：例如：127.0.0.1:502", IsRequired: true},
	{Id: 2, Key: "mode", Label: "连接模式：rtuovertcp,rtuoverudp,rtu,tcp,tcp+tls,udp", IsRequired: true},
	{Id: 3, Key: "baudRate", Label: "波特率（仅串口模式）", IsRequired: false},
	{Id: 4, Key: "dataBits", Label: "数据位（仅串口模式）", IsRequired: false},
	{Id: 5, Key: "stopBits", Label: "停止位（仅串口模式）", IsRequired: false},
	{Id: 6, Key: "parity", Label: "奇偶性校验（仅串口模式）", IsRequired: false},
	{Id: 7, Key: "timeout", Label: "请求超时,单位毫秒,默认1秒", IsRequired: false},
}

func NewServiceContext(c config.Config) *ServiceContext {
	Protocol, err := platformcore.NewCoreProtocol(platformcore.Options{Info: &dm.ProtocolInfo{
		Name:          "modbus协议",
		Code:          protocols.ProtocolCodeModbus,
		TransProtocol: protocols.ProtocolOther,
		EtcdKey:       c.Etcd.Key,
		DeviceFields:  DeviceFields,
	},
		ServerName: c.Name,
		DmClient:   zrpc.MustNewClient(c.DmRpc.Conf),
		// WebDir:配置页静态文件目录(web/),SDK 启动时以随机端口自托管,端口随心跳上报,
		// apisvr 经 /things/protocol/web/{device|product}/modbus 反代展示
		WebDir: "web",
		// WebHandler:自定义配置页处理器,优先于 WebDir 静态服务生效;
		// 默认回落 FileServer 托管 web/ 目录,?__action=ping 时执行 Modbus 连通测试
		WebHandler: modbusweb.NewWebHandler("web"),
	})
	logx.Must(err)
	return &ServiceContext{
		Config:   c,
		Protocol: Protocol,
		DevCli:   map[devices.Core]*domain.DevInfo{},
	}
}
