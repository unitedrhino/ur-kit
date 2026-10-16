// 本文件装配 Things 平台运行配置、RPC、事件总线和公开协议核心。
package platformcore

import (
	"context"
	"errors"
	"strings"
	"time"

	"gitee.com/unitedrhino/share/caches"
	"gitee.com/unitedrhino/share/conf"
	"gitee.com/unitedrhino/share/ctxs"
	shareerrors "gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/eventBus"
	"gitee.com/unitedrhino/share/utils"

	"gitee.com/unitedrhino/things/share/rpccache"
	publiccore "github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/runtimeconfig"
	trackinggozero "github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking/gozero"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"google.golang.org/grpc"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
)

// runtimeOptions 保持原协议服务的运行时配置 JSON 字段。
type runtimeOptions struct {
	TimedJobRpc conf.RpcClientConf `json:"timedJobRpc,omitempty"`
	Event       conf.EventConf     `json:"event,omitempty"`
	CacheRedis  cache.ClusterConf  `json:"cacheRedis,omitempty"`
	DevLink     conf.DevLinkConf   `json:"devLink,omitempty"`
}

// runtimeReader 只要求协议运行配置查询 RPC。
type runtimeReader interface {
	ProtocolRuntimeConfigGetOne(context.Context, *dm.ProtocolRuntimeConfigGetReq, ...grpc.CallOption) (*dm.ProtocolRuntimeConfigResp, error)
}

// resolveRuntime 从 Things 读取配置覆盖；没有记录时保留调用方的本地基础配置。
func resolveRuntime(ctx context.Context, code string, base runtimeOptions, reader runtimeReader) (runtimeOptions, error) {
	response, err := reader.ProtocolRuntimeConfigGetOne(ctx, &dm.ProtocolRuntimeConfigGetReq{ProtocolCode: code})
	if err != nil {
		if shareerrors.Cmp(shareerrors.Fmt(err), shareerrors.NotFind) {
			return base, nil
		}
		return runtimeOptions{}, err
	}
	if response == nil || strings.TrimSpace(response.ConfigJson) == "" {
		return base, nil
	}
	return runtimeconfig.MergeConfigJSON(base, response.ConfigJson)
}

// platformRegistry 使用现有 Things 服务身份登记协议并上报心跳。
type platformRegistry struct{ client dm.ProtocolManageClient }

// Register 将重复登记当作成功，保持协议进程重启幂等。
func (registry platformRegistry) Register(ctx context.Context, info *dm.ProtocolInfo) error {
	_, err := registry.client.ProtocolInfoCreate(ctxs.WithRoot(ctx), info)
	if err != nil && shareerrors.Cmp(shareerrors.Fmt(err), shareerrors.Duplicate) {
		return nil
	}
	return err
}

// Heartbeat 记录平台暂时不可达的错误并继续运行，等待下一轮心跳。
func (registry platformRegistry) Heartbeat(ctx context.Context, service *dm.ProtocolService) error {
	_, err := registry.client.ProtocolServiceUpdate(ctxs.WithRoot(ctx), service)
	if err != nil {
		logx.WithContext(ctx).Error(err)
	}
	return nil
}

// platformBus 将公开核心的字节消息交给现有事件总线。
type platformBus struct{ event *eventBus.FastEvent }

// Publish 使用原主题发布 JSON 字节，事件总线负责下游投递。
func (bus platformBus) Publish(ctx context.Context, topic string, payload []byte) error {
	return bus.event.Publish(ctx, topic, string(payload))
}

// QueueSubscribe 保持原协议进程的队列组和消息字节格式。
func (bus platformBus) QueueSubscribe(topic string, handle func(context.Context, []byte) error) error {
	return bus.event.QueueSubscribe(topic, func(ctx context.Context, _ time.Time, payload []byte) error {
		return handle(ctx, payload)
	})
}

// NewCoreProtocol 将平台缓存和客户端留在 SaaS 适配层，协议生命周期交给公开 SDK。
func NewCoreProtocol(options Options) (*CoreProtocol, error) {
	if options.Info == nil || options.Info.Code == "" {
		return nil, errors.New("protocol info and code are required")
	}
	protocolClient := options.ProtocolM
	if protocolClient == nil && options.DmClient != nil {
		protocolClient = dm.NewProtocolManageClient(options.DmClient.Conn())
	}
	productM, deviceM, deviceMsg, deviceInteract := options.ProductM, options.DeviceM, options.DeviceMsg, options.DeviceInteract
	if options.DmClient != nil {
		if productM == nil {
			productM = dm.NewProductManageClient(options.DmClient.Conn())
		}
		if deviceM == nil {
			deviceM = dm.NewDeviceManageClient(options.DmClient.Conn())
		}
		if deviceMsg == nil {
			deviceMsg = dm.NewDeviceMsgClient(options.DmClient.Conn())
		}
		if deviceInteract == nil {
			deviceInteract = dm.NewDeviceInteractClient(options.DmClient.Conn())
		}
	}
	if protocolClient == nil || productM == nil || deviceM == nil || deviceMsg == nil || deviceInteract == nil {
		return nil, errors.New("Things protocol, product, device, message and interaction clients are required")
	}
	runtime, err := resolveRuntime(ctxs.WithRoot(context.Background()), options.Info.Code, runtimeOptions{
		Event: options.Event, CacheRedis: options.CacheRedis, DevLink: options.DevLink,
		TimedJobRpc: options.TimedJobRpc,
	}, protocolClient)
	if err != nil {
		return nil, err
	}
	nodeID := options.NodeID
	var store kv.Store
	if len(runtime.CacheRedis) > 0 {
		caches.InitStore(runtime.CacheRedis)
		if nodeID == 0 {
			nodeID = utils.GetNodeID(runtime.CacheRedis, options.ServerName)
		}
		store = kv.NewStore(runtime.CacheRedis)
	}
	event := options.FastEvent
	if event == nil {
		event, err = eventBus.NewFastEvent(runtime.Event, options.ServerName, nodeID)
		if err != nil {
			return nil, err
		}
	}
	productCache, err := rpccache.NewProductInfoCache(productM, event)
	if err != nil {
		return nil, err
	}
	deviceCache, err := rpccache.NewDeviceInfoCache(deviceM, event)
	if err != nil {
		return nil, err
	}
	productSchema, err := rpccache.NewProductSchemaCache(productM, event)
	if err != nil {
		return nil, err
	}
	deviceSchema, err := rpccache.NewDeviceSchemaCache(deviceM, productSchema, event)
	if err != nil {
		return nil, err
	}
	var activity publiccore.Activity
	if store := caches.GetStore(); store != nil {
		tracker, err := trackinggozero.NewTracker(store)
		if err != nil {
			return nil, err
		}
		activity = tracker
	}
	core, err := publiccore.NewProtocol(publiccore.Options{
		Info: options.Info, Registry: platformRegistry{client: protocolClient},
		Bus: platformBus{event: event}, Activity: activity,
		RegisterIP: utils.GetRegisterIP(), WebDir: options.WebDir, WebHandler: options.WebHandler,
	})
	if err != nil {
		return nil, err
	}
	return &CoreProtocol{
		Pi: options.Info, DeviceM: deviceM, DeviceInteract: deviceInteract, DeviceMsg: deviceMsg, ProductM: productM, ProtocolM: protocolClient,
		DeviceCache: deviceCache, ProductCache: productCache, SchemaCache: deviceSchema,
		Store: store, NodeID: nodeID, ServerName: options.ServerName, DevLink: runtime.DevLink,
		FastEvent: event, core: core, fastEvent: event, timedJobRpc: runtime.TimedJobRpc,
	}, nil
}
