package protocol

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"sync"
	"time"

	timedSDK "gitee.com/unitedrhino/core/share/domain/timed"
	"gitee.com/unitedrhino/share/caches"
	"gitee.com/unitedrhino/share/conf"
	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/share/def"
	"gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/eventBus"
	"gitee.com/unitedrhino/share/events/topics"
	"gitee.com/unitedrhino/share/interceptors"
	"gitee.com/unitedrhino/share/services"
	"gitee.com/unitedrhino/share/utils"
	thingsruntimeconfig "gitee.com/unitedrhino/things/sdk/protocol/runtimeconfig"
	"gitee.com/unitedrhino/things/service/dmsvr/client/deviceinteract"
	"gitee.com/unitedrhino/things/service/dmsvr/client/devicemanage"
	"gitee.com/unitedrhino/things/service/dmsvr/client/devicemsg"
	"gitee.com/unitedrhino/things/service/dmsvr/client/productmanage"
	"gitee.com/unitedrhino/things/service/dmsvr/client/protocolmanage"
	"gitee.com/unitedrhino/things/service/dmsvr/dmExport"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"gitee.com/unitedrhino/things/share/devices"
	"gitee.com/unitedrhino/things/share/rpcs/protocolSync/pb/protocolSync"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/service"
	storecache "github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type CoreSvrClient struct {
	ProtocolM    protocolmanage.ProtocolManage
	ProductM     productmanage.ProductManage
	ProductCache dmExport.ProductCacheT
	DeviceCache  dmExport.DeviceCacheT
	SchemaCache  dmExport.DeviceSchemaCacheT
	DeviceM      devicemanage.DeviceManage
	DeviceMsg    devicemsg.DeviceMsg

	DeviceInteract deviceinteract.DeviceInteract
	TimedSDK       *timedSDK.TimedSDK
	TimerHandles   []func(ctx context.Context, t time.Time) error
}

type CoreProtocol struct {
	FastEvent             *eventBus.FastEvent
	Pi                    *dm.ProtocolInfo
	ServerName            string
	ProductIDMap          map[string]string //key 是外部的产品ID,value是内部的产品ID
	UnitedRhinoProductIDs []string          //iThings 的产品ID列表
	ProductIDMapMutex     sync.RWMutex
	CoreSvrClient
	RuntimeConfig           thingsruntimeconfig.Config
	NodeID                  int64
	Store                   kv.Store
	ThirdProductIDFieldName devices.ProtocolKey
	taskCreateOnce          sync.Once
	rpcServer               *zrpc.RpcServer
	rpcRegisters            []func(grpcServer *grpc.Server)
	rpcConf                 zrpc.RpcServerConf
	webDir                  string       // 协议配置页静态文件目录,为空表示不提供配置页
	webHandler              http.Handler // 自定义配置页处理器,非空时优先于 webDir 静态服务
	webPort                 int64        // 配置页 web 服务实际监听端口(随机分配),为0表示未启动
	ctx                     context.Context
	cancels                 []func()
}

type CoreProtocolConf struct {
	ServerName     string
	DmClient       zrpc.Client
	TimedSDK       *timedSDK.TimedSDK
	TimedJobRpc    conf.RpcClientConf
	Event          conf.EventConf
	CacheRedis     storecache.ClusterConf
	DevLink        conf.DevLinkConf
	ProductM       productmanage.ProductManage
	DeviceM        devicemanage.DeviceManage
	ProtocolM      protocolmanage.ProtocolManage
	DeviceMsg      devicemsg.DeviceMsg
	DeviceInteract deviceinteract.DeviceInteract
	NodeID         int64
	Port           int64
	// WebDir 协议配置页静态文件目录(如 modbus/web),非空且目录存在时
	// Start() 会用随机端口启动静态文件服务,端口随心跳上报到 dm_protocol_service.web_port
	WebDir string
	// WebHandler 自定义配置页 HTTP 处理器(可选)。非空时优先于 WebDir 生效,
	// 协议可在其中自行分发:默认 serve 静态文件,特定 query(如 __action)走协议自有 HTTP 接口
	// (apisvr 反代只注册固定 GET/POST 路径,协议侧接口经 query 分发)。
	WebHandler http.Handler
}

func NewCoreProtocol(pi *dm.ProtocolInfo, pc *CoreProtocolConf) (*CoreProtocol, error) {
	if pc.ProductM == nil {
		pc.ProductM = productmanage.NewProductManage(pc.DmClient)
	}
	if pc.DeviceM == nil {
		pc.DeviceM = devicemanage.NewDeviceManage(pc.DmClient)
	}
	if pc.ProtocolM == nil {
		pc.ProtocolM = protocolmanage.NewProtocolManage(pc.DmClient)
	}
	if pc.DeviceMsg == nil {
		pc.DeviceMsg = devicemsg.NewDeviceMsg(pc.DmClient)
	}
	if pc.DeviceInteract == nil {
		pc.DeviceInteract = deviceinteract.NewDeviceInteract(pc.DmClient)
	}
	resolvedRuntime, err := resolveRuntimeConfig(context.Background(), pi.Code, pc.ProtocolM, thingsruntimeconfig.Config{
		TimedJobRpc: pc.TimedJobRpc,
		Event:       pc.Event,
		CacheRedis:  pc.CacheRedis,
		DevLink:     pc.DevLink,
	})
	if err != nil {
		return nil, err
	}
	if len(resolvedRuntime.CacheRedis) > 0 {
		caches.InitStore(resolvedRuntime.CacheRedis)
	}
	nodeID := pc.NodeID
	if nodeID == 0 && len(resolvedRuntime.CacheRedis) > 0 {
		nodeID = utils.GetNodeID(resolvedRuntime.CacheRedis, pc.ServerName)
	}
	eventConf := resolvedRuntime.Event
	e, err := eventBus.NewFastEvent(eventConf, pc.ServerName, nodeID)
	if err != nil {
		return nil, err
	}
	if pc.TimedSDK == nil {
		pc.TimedSDK = initTimedSDKFromConfig(resolvedRuntime.TimedJobRpc, e)
	}
	ps, err := dmExport.NewProductSchemaCache(pc.ProductM, e)
	if err != nil {
		return nil, err
	}
	var store kv.Store
	if len(resolvedRuntime.CacheRedis) > 0 {
		store = kv.NewStore(resolvedRuntime.CacheRedis)
	}
	sc, err := dmExport.NewDeviceSchemaCache(pc.DeviceM, ps, e)
	if err != nil {
		return nil, err
	}
	dc, err := dmExport.NewDeviceInfoCache(pc.DeviceM, e)
	if err != nil {
		return nil, err
	}
	pic, err := dmExport.NewProductInfoCache(pc.ProductM, e)
	if err != nil {
		return nil, err
	}

	return &CoreProtocol{
		FastEvent:     e,
		Pi:            pi,
		ServerName:    pc.ServerName,
		RuntimeConfig: resolvedRuntime,
		NodeID:        nodeID,
		Store:         store,
		webDir:        pc.WebDir,
		webHandler:    pc.WebHandler,
		CoreSvrClient: CoreSvrClient{
			ProtocolM:      pc.ProtocolM,
			ProductM:       pc.ProductM,
			SchemaCache:    sc,
			DeviceCache:    dc,
			ProductCache:   pic,
			DeviceM:        pc.DeviceM,
			TimedSDK:       pc.TimedSDK,
			DeviceMsg:      pc.DeviceMsg,
			DeviceInteract: pc.DeviceInteract,
		},
	}, nil
}

func (p *CoreProtocol) Start() error {
	ctx := ctxs.WithRoot(context.Background())
	_, err := p.ProtocolM.ProtocolInfoCreate(ctx, p.Pi) //初始化协议
	if err != nil && !errors.Cmp(errors.Fmt(err), errors.Duplicate) {
		logx.Must(err)
	}
	p.startWebServer()
	ctx, cancel := context.WithCancel(ctxs.WithRoot(nil))
	p.ctx = ctx
	p.cancels = append(p.cancels, cancel)
	utils.Go(ctx, func() {
		run := func() {
			_, err := p.ProtocolM.ProtocolServiceUpdate(ctx, &dm.ProtocolService{
				Code:    p.Pi.Code,
				Ip:      utils.GetRegisterIP(),
				Port:    0,
				Status:  def.True,
				WebPort: p.webPort,
			})
			if err != nil {
				logx.WithContext(ctx).Error(err)
			}
		}
		run()
		tick := time.Tick(time.Minute)
		for {
			select {
			case <-tick:
				run()
			case <-p.ctx.Done():
				return
			}
		}
	})
	err = p.FastEvent.Start()
	if err != nil {
		return err
	}
	if len(p.rpcRegisters) != 0 {
		utils.Go(context.Background(), func() {
			s := services.MustNewServer(p.rpcConf, func(grpcServer *grpc.Server) {
				for _, f := range p.rpcRegisters {
					f(grpcServer)
				}
				if p.rpcConf.Mode == service.DevMode || p.rpcConf.Mode == service.TestMode {
					reflection.Register(grpcServer)
				}
			})
			defer s.Stop()
			p.cancels = append(p.cancels, s.Stop)
			s.AddUnaryInterceptors(interceptors.Ctxs, interceptors.Error)
			p.rpcServer = s
			s.Start()
		})
	}
	return nil
}
func (p *CoreProtocol) AddStopHandle(h ...func()) {
	p.cancels = append(p.cancels, h...)
}

// startWebServer 启动协议配置页 web 服务。
// WebHandler 非空时直接使用(协议自行分发静态文件与自有接口);
// 否则要求 WebDir 目录存在,以静态文件服务 serve。
// 监听 :0 由系统分配端口,实际端口存入 p.webPort 随心跳上报,
// apisvr 通过 /things/protocol/web/{scope}/{code} 反代访问。
func (p *CoreProtocol) startWebServer() {
	handler := p.webHandler
	if handler == nil {
		if p.webDir == "" {
			return
		}
		if st, err := os.Stat(p.webDir); err != nil || !st.IsDir() {
			logx.Errorf("protocol web dir not found, skip web server: dir=%s err=%v", p.webDir, err)
			return
		}
		handler = http.FileServer(http.Dir(p.webDir))
	}
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		logx.Errorf("protocol web server listen err: %v", err)
		return
	}
	p.webPort = int64(listener.Addr().(*net.TCPAddr).Port)
	svr := &http.Server{Handler: handler}
	utils.Go(context.Background(), func() {
		if err := svr.Serve(listener); err != nil && err != http.ErrServerClosed {
			logx.Errorf("protocol web server serve err: %v", err)
		}
	})
	p.cancels = append(p.cancels, func() { _ = svr.Close() })
	logx.Infof("protocol web server started: code=%s dir=%s port=%d", p.Pi.Code, p.webDir, p.webPort)
}

func (p *CoreProtocol) Stop() {
	for _, f := range p.cancels {
		if f != nil {
			f()
		}
	}
}

func (p *CoreProtocol) RunTimerHandles() {
	for _, f := range p.TimerHandles {
		err := f(ctxs.WithRoot(context.Background()), time.Now())
		if err != nil {
			logx.Error(err)
		}
	}
}

func (p *CoreProtocol) RegisterDeviceMsgDownHandler(
	handle func(ctx context.Context, info *devices.InnerPublish) error) error {
	err := p.FastEvent.QueueSubscribe(fmt.Sprintf(topics.DeviceDownAll, p.Pi.Code),
		func(ctx context.Context, t time.Time, body []byte) error {
			info := devices.GetPublish(body)
			logx.WithContext(ctx).Infof("mqtt.SubDevMsg protocolCode:%v Handle:%s Type:%v Payload:%v",
				info.ProtocolCode, info.Handle, info.Type, string(info.Payload))
			err := handle(ctxs.WithRoot(ctx), info)
			if err != nil {
				logx.WithContext(ctx).Errorf("mqtt.SubDevMsg protocolCode:%v Handle:%s Type:%v Payload:%v err:%v",
					info.ProtocolCode, info.Handle, info.Type, string(info.Payload), err)
			}

			return err
		})
	return err
}

// DevPubMsg 在协议入队前固定接收时间，重试复用同一消息信封。
func (p *CoreProtocol) DevPubMsg(ctx context.Context, publishMsg *devices.DevPublish) error {
	if publishMsg.ReceivedTime == 0 {
		publishMsg.ReceivedTime = time.Now().UnixMilli()
	}
	publishMsg.ProtocolCode = p.Pi.Code
	UpdateDeviceActivity(ctx, devices.Core{
		ProductID:  publishMsg.ProductID,
		DeviceName: publishMsg.DeviceName,
	})
	if publishMsg.Timestamp == 0 {
		publishMsg.Timestamp = time.Now().UnixMilli()
	}
	err := p.FastEvent.Publish(ctx, fmt.Sprintf(topics.DeviceUpMsg, publishMsg.Handle, publishMsg.ProductID, publishMsg.DeviceName), utils.MarshalNoErr(publishMsg))
	if err != nil {
		logx.WithContext(ctx).Errorf("devPublishToCloud  err:%v", err)
		return err
	} else {
		logx.WithContext(ctx).Infof("devPublishToCloud msg:%v", publishMsg)
	}

	return nil
}

func (p *CoreProtocol) genCode() string {
	return fmt.Sprintf("protocol-%s-timer", p.Pi.Code)
}

func (p *CoreProtocol) genTimerTopic() string {
	return fmt.Sprintf("server.things.%s.protocol.timer", p.ServerName)
}

// 定时同步设备信息,产品信息 如果不需要可以不注册
func (p *CoreProtocol) RegisterTimerHandler(f func(ctx context.Context, t time.Time) error) error {
	if p.TimedSDK == nil {
		return errors.Panic.AddMsg("timed not init")
	}
	ctx := context.Background()
	p.taskCreateOnce.Do(func() {
		err := p.TimedSDK.RegisterCron(ctx, timedSDK.CronTask{
			GroupCode: def.TimedUnitedRhinoQueueGroupCode,
			Code:      p.genCode(),
			Name:      fmt.Sprintf("自定义协议-%s-定时任务-数据同步", p.Pi.Name),
			CronExpr:  "@every 10m",
			Params: map[string]string{
				"topic":   p.genTimerTopic(),
				"payload": "",
			},
			Priority: 3,
			Handler: func(ctx context.Context, params map[string]string) error {
				return f(ctxs.WithRoot(ctx), time.Now())
			},
		})
		if err != nil {
			logx.WithContext(ctx).Errorf("RegisterTimerHandler RegisterCron err: %v", err)
		}
	})
	p.TimerHandles = append(p.TimerHandles, f)
	return nil
}
func (p *CoreProtocol) RegisterProductIDSync() error {
	p.ThirdProductIDFieldName = devices.ProtocolKeyProductID
	err := p.RegisterTimerHandler(func(ctx context.Context, t time.Time) error {
		pis, err := p.ProductM.ProductInfoGetList(ctx, &dm.ProductInfoGetListReq{
			ProtocolCode: p.Pi.Code,
		})
		if err != nil {
			return err
		}
		p.ProductIDMapMutex.Lock()
		defer p.ProductIDMapMutex.Unlock()
		p.ProductIDMap = map[string]string{}
		p.UnitedRhinoProductIDs = nil
		for _, pi := range pis.List {
			pc := p.GetProtocolConf(pi)
			id := pc[p.ThirdProductIDFieldName]
			if id == "" {
				continue
			}
			p.UnitedRhinoProductIDs = append(p.UnitedRhinoProductIDs, pi.ProductID)
			p.ProductIDMap[id] = pi.ProductID
		}
		return nil
	})
	return err
}

// 通过外部的产品iD查询联犀的产品iD
func (p *CoreProtocol) GetProductID(productID string) string {
	p.ProductIDMapMutex.RLock()
	defer p.ProductIDMapMutex.RUnlock()
	return p.ProductIDMap[productID]
}

func (p *CoreProtocol) GetUnitedRhinoProductIDs() []string {
	p.ProductIDMapMutex.RLock()
	defer p.ProductIDMapMutex.RUnlock()
	return p.UnitedRhinoProductIDs
}

func (p *CoreProtocol) GetProtocolConf(pi *dm.ProductInfo) map[string]string {
	if pi.SubProtocolCode != nil && pi.SubProtocolCode.GetValue() == p.Pi.Code {
		return pi.SubProtocolConf
	}
	return pi.ProtocolConf
}

func (p *CoreProtocol) GetDevProtocolConf(ctx context.Context, di *dm.DeviceInfo) (map[string]string, error) {
	pi, err := p.ProductCache.GetData(ctx, di.ProductID)
	if err != nil {
		return nil, err
	}
	if pi.SubProtocolCode != nil && pi.SubProtocolCode.GetValue() == p.Pi.Code {
		return di.SubProtocolConf, nil
	}
	return di.ProtocolConf, nil
}

func (p *CoreProtocol) ReportDevConn(ctx context.Context, conn devices.DevConn) (err error) {
	logx.WithContext(ctx).Infof("ReportDevConn msg:%v", conn)
	if conn.Timestamp == 0 {
		conn.Timestamp = time.Now().UnixMilli()
	}
	switch conn.Action {
	case devices.ActionConnected:
		err = p.FastEvent.Publish(ctx, topics.DeviceUpStatusConnected, conn)
	case devices.ActionDisconnected:
		err = p.FastEvent.Publish(ctx, topics.DeviceUpStatusDisconnected, conn)
	default:
		panic("not support conn type")
	}
	if err != nil {
		logx.Errorf("%s.publish  err:%v", utils.FuncName(), err)
		return err
	}
	return err
}

func (m *CoreProtocol) RegisterRpcServer(c zrpc.RpcServerConf, f func(grpcServer *grpc.Server)) {
	m.rpcRegisters = append(m.rpcRegisters, f)
	m.rpcConf = c
}

// RegisterSync 主动同步产品或设备,支持才需填写
func (m *CoreProtocol) RegisterSync(c zrpc.RpcServerConf, handle protocolSync.ProtocolSyncServer) {
	m.RegisterRpcServer(c, func(grpcServer *grpc.Server) {
		protocolSync.RegisterProtocolSyncServer(grpcServer, handle)
	})
}
