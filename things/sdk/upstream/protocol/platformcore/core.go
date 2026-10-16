// 本文件将 SaaS 协议服务的设备缓存和旧调用入口适配到 ur-kit 公开协议核心。
package platformcore

import (
	"context"
	"net/http"
	"sync"
	"time"

	"gitee.com/unitedrhino/share/conf"
	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/share/eventBus"
	"gitee.com/unitedrhino/share/interceptors"
	"gitee.com/unitedrhino/share/services"

	"gitee.com/unitedrhino/things/share/devices"
	"gitee.com/unitedrhino/things/share/domain/schema"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/configselect"
	publiccore "github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/share/rpcs/protocolSync/pb/protocolSync"
)

// Options 保存协议配置、公开 RPC 接口和 Web 配置页；显式注入的接口优先于 DmClient。
type Options struct {
	Info           *dm.ProtocolInfo
	ServerName     string
	DmClient       zrpc.Client
	ProtocolM      dm.ProtocolManageClient
	ProductM       dm.ProductManageClient
	DeviceM        dm.DeviceManageClient
	DeviceMsg      dm.DeviceMsgClient
	DeviceInteract dm.DeviceInteractClient
	NodeID         int64
	FastEvent      *eventBus.FastEvent
	Event          conf.EventConf
	CacheRedis     cache.ClusterConf
	DevLink        conf.DevLinkConf   // 本地 MQTT Broker 配置，平台运行配置可覆盖。
	TimedJobRpc    conf.RpcClientConf // 本地 timedsvr 连接配置，平台运行配置可覆盖。
	WebDir         string
	WebHandler     http.Handler
}

// CoreProtocol 保留现有协议服务所需的调用入口，实际生命周期和消息编码交给公开核心。
type CoreProtocol struct {
	Pi             *dm.ProtocolInfo
	DeviceM        dm.DeviceManageClient
	DeviceInteract dm.DeviceInteractClient
	DeviceMsg      dm.DeviceMsgClient
	ProductM       dm.ProductManageClient
	ProtocolM      dm.ProtocolManageClient
	DeviceCache    DeviceReader
	ProductCache   ProductReader
	SchemaCache    SchemaReader
	Store          kv.Store            // 按平台运行配置创建的兼容 Redis 存储。
	NodeID         int64               // 平台消息令牌使用的节点编号。
	ServerName     string              // 共享订阅组和平台服务标识。
	DevLink        conf.DevLinkConf    // 已合并的平台设备链路配置。
	FastEvent      *eventBus.FastEvent // 原协议服务直接发布平台事件时使用的总线。
	core           *publiccore.Protocol
	fastEvent      *eventBus.FastEvent
	timedJobRpc    conf.RpcClientConf
	timerMu        sync.Mutex
	timer          *publiccore.Timer
	timerClient    zrpc.Client
	timerStarted   bool
	rpcMu          sync.Mutex
	rpcConf        zrpc.RpcServerConf
	rpcRegisters   []func(*grpc.Server)
}

// DeviceReader 提供协议接入所需的设备资料查询。
type DeviceReader interface {
	GetData(context.Context, devices.Core) (*dm.DeviceInfo, error)
}

// ProductReader 提供设备协议配置归属所需的产品查询。
type ProductReader interface {
	GetData(context.Context, string) (*dm.ProductInfo, error)
}

// SchemaReader 提供设备物模型读取。
type SchemaReader interface {
	GetData(context.Context, devices.Core) (*schema.Model, error)
}

// Start 启动平台事件总线和公开协议核心；平台注册使用服务身份。
func (protocol *CoreProtocol) Start() error {
	if err := protocol.fastEvent.Start(); err != nil {
		return err
	}
	if err := protocol.core.Start(ctxs.WithRoot(context.Background())); err != nil {
		return err
	}
	protocol.rpcMu.Lock()
	defer protocol.rpcMu.Unlock()
	if len(protocol.rpcRegisters) > 0 {
		server := services.MustNewServer(protocol.rpcConf, func(grpcServer *grpc.Server) {
			for _, register := range protocol.rpcRegisters {
				register(grpcServer)
			}
		})
		server.AddUnaryInterceptors(interceptors.Ctxs, interceptors.Error)
		go server.Start()
	}
	return nil
}

// Stop 停止公开协议核心和定时处理器，等待在途定时回调退出。
func (protocol *CoreProtocol) Stop() {
	protocol.timerMu.Lock()
	timer := protocol.timer
	protocol.timerMu.Unlock()
	if timer != nil {
		timer.Stop()
	}
	protocol.core.Stop()
}

// RegisterRpcServer 在协议启动前登记同一个 go-zero RPC 服务的处理器。
func (protocol *CoreProtocol) RegisterRpcServer(config zrpc.RpcServerConf, register func(*grpc.Server)) {
	protocol.rpcMu.Lock()
	defer protocol.rpcMu.Unlock()
	protocol.rpcConf = config
	protocol.rpcRegisters = append(protocol.rpcRegisters, register)
}

// RegisterSync 为协议登记主动同步 RPC，并保留原 go-zero 服务身份。
func (protocol *CoreProtocol) RegisterSync(config zrpc.RpcServerConf, handler protocolSync.ProtocolSyncServer) {
	protocol.RegisterRpcServer(config, func(server *grpc.Server) {
		protocolSync.RegisterProtocolSyncServer(server, handler)
	})
}

// RunTimerHandles 按原协议入口立即执行一次已登记的定时处理器。
func (protocol *CoreProtocol) RunTimerHandles() {
	protocol.timerMu.Lock()
	timer := protocol.timer
	protocol.timerMu.Unlock()
	if timer != nil {
		if err := timer.RunOnce(ctxs.WithRoot(context.Background()), time.Now()); err != nil {
			logTimerError(err)
		}
	}
}

// AddStopHandle 将现有协议服务的资源释放回调交给公开核心。
func (protocol *CoreProtocol) AddStopHandle(handles ...func()) {
	_ = protocol.core.AddStopHandle(handles...)
}

// DevPubMsg 保留原设备上行结构体和时间戳写回行为。
func (protocol *CoreProtocol) DevPubMsg(ctx context.Context, publish *devices.DevPublish) error {
	message := &publiccore.Message{
		ReceivedTime: publish.ReceivedTime, Topic: publish.Topic,
		Handle: publish.Handle, Type: publish.Type, Payload: publish.Payload,
		Timestamp: publish.Timestamp, ProductID: publish.ProductID, DeviceName: publish.DeviceName,
		Explain: publish.Explain, ProtocolCode: publish.ProtocolCode,
	}
	err := protocol.core.Publish(ctx, message)
	publish.ReceivedTime, publish.Timestamp, publish.ProtocolCode = message.ReceivedTime, message.Timestamp, message.ProtocolCode
	return err
}

// ReportDevConn 将非 MQTT 设备连接事件按原 JSON 字段发布到平台。
func (protocol *CoreProtocol) ReportDevConn(ctx context.Context, connection devices.DevConn) error {
	return protocol.core.ReportConnection(ctx, tracking.Connection{
		UserName: connection.UserName, Timestamp: connection.Timestamp, Address: connection.Address,
		ClientID: connection.ClientID, Reason: connection.Reason, Action: connection.Action,
		ProductID: connection.ProductID, DeviceName: connection.DeviceName,
	})
}

// RegisterDeviceMsgDownHandler 订阅本协议的下行主题并恢复原设备消息结构体。
func (protocol *CoreProtocol) RegisterDeviceMsgDownHandler(handle func(context.Context, *devices.InnerPublish) error) error {
	return protocol.core.SubscribeDownlink(func(ctx context.Context, message *publiccore.Message) error {
		return handle(ctxs.WithRoot(ctx), &devices.InnerPublish{
			ReceivedTime: message.ReceivedTime, Topic: message.Topic,
			Handle: message.Handle, Type: message.Type, Payload: message.Payload,
			Timestamp: message.Timestamp, ProductID: message.ProductID, DeviceName: message.DeviceName,
			Explain: message.Explain, ProtocolCode: message.ProtocolCode,
		})
	})
}

// GetProtocolConf 按公开主子协议选择规则返回产品配置。
func (protocol *CoreProtocol) GetProtocolConf(product *dm.ProductInfo) map[string]string {
	var subCode *string
	if product.SubProtocolCode != nil {
		value := product.SubProtocolCode.GetValue()
		subCode = &value
	}
	return configselect.Select(protocol.Pi.Code, subCode, product.ProtocolConf, product.SubProtocolConf)
}

// GetDevProtocolConf 查询设备所属产品后选择主协议或子协议设备配置。
func (protocol *CoreProtocol) GetDevProtocolConf(ctx context.Context, device *dm.DeviceInfo) (map[string]string, error) {
	product, err := protocol.ProductCache.GetData(ctx, device.ProductID)
	if err != nil {
		return nil, err
	}
	var subCode *string
	if product.SubProtocolCode != nil {
		value := product.SubProtocolCode.GetValue()
		subCode = &value
	}
	return configselect.Select(protocol.Pi.Code, subCode, device.ProtocolConf, device.SubProtocolConf), nil
}
