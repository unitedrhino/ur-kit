// 本文件提供独立协议服务的注册、心跳、Web 配置页及设备消息生命周期。
package core

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
)

// Message 与现行 Things DevPublish/InnerPublish 的 JSON 消息字段保持一致。
type Message struct {
	ReceivedTime int64  `json:"receivedTime,omitempty"`
	Topic        string `json:"topic"`
	Handle       string `json:"handle"`
	Type         string `json:"type"`
	Payload      []byte `json:"payload"`
	Timestamp    int64  `json:"timestamp"`
	ProductID    string `json:"productID"`
	DeviceName   string `json:"deviceName"`
	Explain      string `json:"explain"`
	ProtocolCode string `json:"protocolCode"`
}

const (
	// ConnectedTopic 保留非 MQTT 设备上线事件的既有主题。
	ConnectedTopic = "device.up.status.connected"
	// DisconnectedTopic 保留非 MQTT 设备下线事件的既有主题。
	DisconnectedTopic = "device.up.status.disconnected"
)

// Registry 由平台适配层实现协议登记与心跳，不暴露 SaaS 内部服务类型。
type Registry interface {
	Register(context.Context, *dm.ProtocolInfo) error
	Heartbeat(context.Context, *dm.ProtocolService) error
}

// GRPCRegistry 使用公开 protobuf 客户端对接 Things 协议管理 RPC。
type GRPCRegistry struct{ Client dm.ProtocolManageClient }

// Register 调用协议创建 RPC；已经存在的协议按幂等注册处理。
func (registry GRPCRegistry) Register(ctx context.Context, info *dm.ProtocolInfo) error {
	if registry.Client == nil {
		return errors.New("protocol RPC client is required")
	}
	_, err := registry.Client.ProtocolInfoCreate(ctx, info, grpc.WaitForReady(true))
	if status.Code(err) == codes.AlreadyExists {
		return nil
	}
	return err
}

// Heartbeat 更新 Things 协议服务发现信息。
func (registry GRPCRegistry) Heartbeat(ctx context.Context, service *dm.ProtocolService) error {
	if registry.Client == nil {
		return errors.New("protocol RPC client is required")
	}
	_, err := registry.Client.ProtocolServiceUpdate(ctx, service, grpc.WaitForReady(true))
	return err
}

// Bus 对接调用方的事件总线，保持既有上行和下行主题格式。
type Bus interface {
	Publish(context.Context, string, []byte) error
	QueueSubscribe(string, func(context.Context, []byte) error) error
}

// Activity 记录设备最后活动时间；Redis 不可用时不阻断设备上行。
type Activity interface {
	Touch(context.Context, tracking.Device, time.Time) error
}

// Options 保存协议外部依赖与运行配置；WebHandler 优先于 WebDir。
type Options struct {
	Info          *dm.ProtocolInfo
	Registry      Registry
	Bus           Bus
	Activity      Activity
	RegisterIP    string
	WebDir        string
	WebHandler    http.Handler
	WebListenAddr string
	// RPCListenAddr 是自注册 gRPC 服务的监听地址；有服务注册器时必填。
	RPCListenAddr string
	// RPCRegistrars 负责注册协议自己的 gRPC 服务，例如 ProtocolSync。
	RPCRegistrars []func(*grpc.Server)
	// RPCServerOptions 由接入方注入认证、权限、日志等 gRPC 服务选项。
	RPCServerOptions []grpc.ServerOption
	// RPCReflection 仅在明确开启时暴露服务反射。
	RPCReflection     bool
	HeartbeatInterval time.Duration
	Logger            *slog.Logger
}

// Protocol 管理一个独立协议实例；Stop 可重复调用。
type Protocol struct {
	options   Options
	mu        sync.RWMutex
	started   bool
	stopped   bool
	webPort   int64
	rpcPort   int64
	server    *http.Server
	rpcServer *grpc.Server
	cancel    context.CancelFunc
	stopHooks []func()
	wait      sync.WaitGroup
}

// NewProtocol 验证必要的平台适配器与协议代码。
func NewProtocol(options Options) (*Protocol, error) {
	if options.Info == nil || options.Info.Code == "" || options.Registry == nil || options.Bus == nil || options.RegisterIP == "" {
		return nil, errors.New("protocol info, registry, bus and register IP are required")
	}
	if len(options.RPCRegistrars) > 0 && options.RPCListenAddr == "" {
		return nil, errors.New("RPC listen address is required when registering RPC services")
	}
	if len(options.RPCRegistrars) == 0 && options.RPCListenAddr != "" {
		return nil, errors.New("RPC service registrar is required when setting RPC listen address")
	}
	if options.HeartbeatInterval <= 0 {
		options.HeartbeatInterval = time.Minute
	}
	if options.WebListenAddr == "" {
		options.WebListenAddr = ":0"
	}
	return &Protocol{options: options}, nil
}

// Start 完成平台注册与首次心跳后启动可选配置页和定期心跳。
func (protocol *Protocol) Start(ctx context.Context) error {
	protocol.mu.Lock()
	defer protocol.mu.Unlock()
	if protocol.started || protocol.stopped {
		return errors.New("protocol already started or stopped")
	}
	if err := protocol.options.Registry.Register(ctx, protocol.options.Info); err != nil {
		return fmt.Errorf("register protocol: %w", err)
	}
	handler := protocol.options.WebHandler
	if handler == nil && protocol.options.WebDir != "" {
		info, err := os.Stat(protocol.options.WebDir)
		if err != nil || !info.IsDir() {
			return errors.New("protocol web directory does not exist")
		}
		handler = http.FileServer(http.Dir(protocol.options.WebDir))
	}
	var listener net.Listener
	if handler != nil {
		var err error
		listener, err = net.Listen("tcp", protocol.options.WebListenAddr)
		if err != nil {
			return fmt.Errorf("listen protocol web: %w", err)
		}
		protocol.webPort = int64(listener.Addr().(*net.TCPAddr).Port)
	}
	var rpcListener net.Listener
	if len(protocol.options.RPCRegistrars) > 0 {
		var err error
		rpcListener, err = net.Listen("tcp", protocol.options.RPCListenAddr)
		if err != nil {
			if listener != nil {
				_ = listener.Close()
			}
			protocol.webPort = 0
			return fmt.Errorf("listen protocol RPC: %w", err)
		}
		protocol.rpcPort = int64(rpcListener.Addr().(*net.TCPAddr).Port)
	}
	if err := protocol.heartbeat(ctx); err != nil {
		if listener != nil {
			_ = listener.Close()
		}
		if rpcListener != nil {
			_ = rpcListener.Close()
		}
		protocol.webPort = 0
		protocol.rpcPort = 0
		return fmt.Errorf("initial protocol heartbeat: %w", err)
	}
	runCtx, cancel := context.WithCancel(ctx)
	protocol.cancel = cancel
	protocol.started = true
	if listener != nil {
		protocol.server = &http.Server{Handler: handler, ReadHeaderTimeout: 10 * time.Second}
		protocol.wait.Add(1)
		go func() {
			defer protocol.wait.Done()
			if err := protocol.server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) && protocol.options.Logger != nil {
				protocol.options.Logger.Error("protocol web server stopped", "error", err)
			}
		}()
	}
	if rpcListener != nil {
		protocol.rpcServer = grpc.NewServer(protocol.options.RPCServerOptions...)
		for _, register := range protocol.options.RPCRegistrars {
			register(protocol.rpcServer)
		}
		if protocol.options.RPCReflection {
			reflection.Register(protocol.rpcServer)
		}
		protocol.wait.Add(1)
		go func() {
			defer protocol.wait.Done()
			if err := protocol.rpcServer.Serve(rpcListener); err != nil && protocol.options.Logger != nil {
				protocol.options.Logger.Error("protocol RPC server stopped", "error", err)
			}
		}()
	}
	protocol.wait.Add(1)
	go protocol.runHeartbeat(runCtx)
	return nil
}

// heartbeat 向平台注册地址与可选配置页端口。
func (protocol *Protocol) heartbeat(ctx context.Context) error {
	return protocol.options.Registry.Heartbeat(ctx, &dm.ProtocolService{
		Code: protocol.options.Info.Code, Ip: protocol.options.RegisterIP,
		Status: 1, Port: protocol.rpcPort, WebPort: protocol.webPort,
	})
}

// runHeartbeat 定期更新协议状态，取消上下文后退出。
func (protocol *Protocol) runHeartbeat(ctx context.Context) {
	defer protocol.wait.Done()
	ticker := time.NewTicker(protocol.options.HeartbeatInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := protocol.heartbeat(ctx); err != nil && protocol.options.Logger != nil {
				protocol.options.Logger.Error("protocol heartbeat failed", "error", err)
			}
		}
	}
}

// WebPort 返回已启动配置页的监听端口；没有配置页时返回零。
func (protocol *Protocol) WebPort() int64 {
	protocol.mu.RLock()
	defer protocol.mu.RUnlock()
	return protocol.webPort
}

// RPCPort 返回协议自注册 gRPC 服务的监听端口；未配置时为零。
func (protocol *Protocol) RPCPort() int64 {
	protocol.mu.RLock()
	defer protocol.mu.RUnlock()
	return protocol.rpcPort
}

// Publish 在上行前固定接收时间与协议代码，并发送兼容的设备主题。
func (protocol *Protocol) Publish(ctx context.Context, message *Message) error {
	protocol.mu.RLock()
	started := protocol.started && !protocol.stopped
	code := protocol.options.Info.Code
	protocol.mu.RUnlock()
	if !started || message == nil || message.Handle == "" || message.ProductID == "" || message.DeviceName == "" {
		return errors.New("protocol not running or device message invalid")
	}
	now := time.Now()
	if message.ReceivedTime == 0 {
		message.ReceivedTime = now.UnixMilli()
	}
	if message.Timestamp == 0 {
		message.Timestamp = now.UnixMilli()
	}
	message.ProtocolCode = code
	if protocol.options.Activity != nil {
		if err := protocol.options.Activity.Touch(ctx, tracking.Device{ProductID: message.ProductID, DeviceName: message.DeviceName}, now); err != nil && protocol.options.Logger != nil {
			protocol.options.Logger.Warn("device activity update failed", "error", err)
		}
	}
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}
	topic := fmt.Sprintf("device.up.%s.%s.%s", message.Handle, message.ProductID, message.DeviceName)
	return protocol.options.Bus.Publish(ctx, topic, data)
}

// ReportConnection 发布非 MQTT 设备上下线事件，不创建 MQTT 会话映射。
func (protocol *Protocol) ReportConnection(ctx context.Context, connection tracking.Connection) error {
	protocol.mu.RLock()
	started := protocol.started && !protocol.stopped
	protocol.mu.RUnlock()
	if !started || connection.ProductID == "" || connection.DeviceName == "" {
		return errors.New("protocol not running or device connection invalid")
	}
	var topic string
	switch connection.Action {
	case "connected":
		topic = ConnectedTopic
	case "disconnected":
		topic = DisconnectedTopic
	default:
		return errors.New("unsupported connection action")
	}
	if connection.Timestamp == 0 {
		connection.Timestamp = time.Now().UnixMilli()
	}
	data, err := json.Marshal(connection)
	if err != nil {
		return err
	}
	return protocol.options.Bus.Publish(ctx, topic, data)
}

// SubscribeDownlink 将当前协议的下行通配主题注册到调用方事件总线。
func (protocol *Protocol) SubscribeDownlink(handler func(context.Context, *Message) error) error {
	if handler == nil {
		return errors.New("downlink handler is required")
	}
	topic := fmt.Sprintf("device.down.%s.>", protocol.options.Info.Code)
	return protocol.options.Bus.QueueSubscribe(topic, func(ctx context.Context, raw []byte) error {
		var message Message
		if err := json.Unmarshal(raw, &message); err != nil {
			return err
		}
		return handler(ctx, &message)
	})
}

// AddStopHandle 注册调用方资源的退出回调；服务已停止时拒绝新增，避免资源无法释放。
func (protocol *Protocol) AddStopHandle(handles ...func()) error {
	if protocol == nil {
		return errors.New("protocol is required")
	}
	protocol.mu.Lock()
	defer protocol.mu.Unlock()
	if protocol.stopped {
		return errors.New("protocol already stopped")
	}
	for _, handle := range handles {
		if handle != nil {
			protocol.stopHooks = append(protocol.stopHooks, handle)
		}
	}
	return nil
}

// Stop 停止心跳、配置页及调用方资源；重复调用不重复执行退出回调。
func (protocol *Protocol) Stop() {
	if protocol == nil {
		return
	}
	protocol.mu.Lock()
	if protocol.stopped {
		protocol.mu.Unlock()
		return
	}
	protocol.stopped = true
	cancel := protocol.cancel
	server := protocol.server
	rpcServer := protocol.rpcServer
	hooks := protocol.stopHooks
	protocol.stopHooks = nil
	protocol.mu.Unlock()
	if cancel != nil {
		cancel()
	}
	if server != nil {
		_ = server.Close()
	}
	if rpcServer != nil {
		rpcServer.Stop()
	}
	protocol.wait.Wait()
	for _, handle := range hooks {
		handle()
	}
}
