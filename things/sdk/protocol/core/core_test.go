// 本文件验证独立协议核心的注册、消息信封、Web 配置页与关闭生命周期。
package core

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"strconv"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	protocolsync "github.com/unitedrhino/ur-kit/sdks/go/pb/things/share/rpcs/protocolSync/pb/protocolSync"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
)

// fakeRegistry 记录注册与心跳，并允许测试启动失败后的资源清理。
type fakeRegistry struct {
	mu           sync.Mutex
	infos        []*dm.ProtocolInfo
	services     []*dm.ProtocolService
	err          error
	heartbeatErr error
}

// Register 保存协议登记请求。
func (registry *fakeRegistry) Register(_ context.Context, info *dm.ProtocolInfo) error {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	registry.infos = append(registry.infos, info)
	return registry.err
}

// Heartbeat 保存协议发现请求。
func (registry *fakeRegistry) Heartbeat(_ context.Context, service *dm.ProtocolService) error {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	registry.services = append(registry.services, service)
	if registry.heartbeatErr != nil {
		return registry.heartbeatErr
	}
	return registry.err
}

// fakeBus 保存上行消息与下行回调。
type fakeBus struct {
	topic     string
	payload   []byte
	handler   func(context.Context, []byte) error
	downTopic string
}

// Publish 保存设备上行主题和信封。
func (bus *fakeBus) Publish(_ context.Context, topic string, payload []byte) error {
	bus.topic, bus.payload = topic, payload
	return nil
}

// QueueSubscribe 保存设备下行主题和回调。
func (bus *fakeBus) QueueSubscribe(topic string, handler func(context.Context, []byte) error) error {
	bus.downTopic, bus.handler = topic, handler
	return nil
}

// fakeActivity 保存最后活动设备和时间。
type fakeActivity struct {
	device   tracking.Device
	received time.Time
}

// Touch 保存设备上行活动记录。
func (activity *fakeActivity) Touch(_ context.Context, device tracking.Device, received time.Time) error {
	activity.device, activity.received = device, received
	return nil
}

// TestProtocolStopHandles 验证启动前后均可注册资源退出回调，停止后不得遗留新回调。
func TestProtocolStopHandles(t *testing.T) {
	protocol, err := NewProtocol(Options{Info: &dm.ProtocolInfo{Code: "cleanup"}, Registry: &fakeRegistry{}, Bus: &fakeBus{}, RegisterIP: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	var order []int
	if err := protocol.AddStopHandle(func() { order = append(order, 1) }, nil); err != nil {
		t.Fatal(err)
	}
	if err := protocol.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := protocol.AddStopHandle(func() {
		_ = protocol.WebPort()
		order = append(order, 2)
	}); err != nil {
		t.Fatal(err)
	}
	protocol.Stop()
	protocol.Stop()
	if len(order) != 2 || order[0] != 1 || order[1] != 2 {
		t.Fatalf("退出回调未按注册顺序且仅执行一次: %v", order)
	}
	if err := protocol.AddStopHandle(func() { order = append(order, 3) }); err == nil {
		t.Fatal("已停止协议仍接受退出回调")
	}
}

// TestProtocolLifecycle 验证配置页心跳、旧消息格式和下行主题。
func TestProtocolLifecycle(t *testing.T) {
	registry, bus, activity := &fakeRegistry{}, &fakeBus{}, &fakeActivity{}
	protocol, err := NewProtocol(Options{Info: &dm.ProtocolInfo{Code: "modbus"}, Registry: registry, Bus: bus, Activity: activity, RegisterIP: "127.0.0.1", WebListenAddr: "127.0.0.1:0", WebHandler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { _, _ = io.WriteString(w, "web-ok") }), HeartbeatInterval: 10 * time.Millisecond})
	if err != nil {
		t.Fatal(err)
	}
	if err := protocol.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(protocol.Stop)
	if protocol.WebPort() == 0 {
		t.Fatal("配置页未分配端口")
	}
	response, err := http.Get("http://127.0.0.1:" + strconv.FormatInt(protocol.WebPort(), 10))
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(response.Body)
	_ = response.Body.Close()
	if string(body) != "web-ok" {
		t.Fatalf("配置页响应错误: %q", body)
	}
	message := &Message{Handle: "thing", Type: "property", ProductID: "product", DeviceName: "sensor", Payload: []byte(`{"temp":23}`)}
	if err := protocol.Publish(context.Background(), message); err != nil {
		t.Fatal(err)
	}
	if bus.topic != "device.up.thing.product.sensor" {
		t.Fatalf("上行主题错误: %s", bus.topic)
	}
	var saved Message
	if err := json.Unmarshal(bus.payload, &saved); err != nil {
		t.Fatal(err)
	}
	if saved.ReceivedTime == 0 || saved.Timestamp == 0 || saved.ProtocolCode != "modbus" || activity.device.DeviceName != "sensor" {
		t.Fatalf("消息信封错误: %+v", saved)
	}
	if err := protocol.SubscribeDownlink(func(_ context.Context, received *Message) error {
		if received.DeviceName != "sensor" {
			return errors.New("wrong device")
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if bus.downTopic != "device.down.modbus.>" {
		t.Fatalf("下行主题错误: %s", bus.downTopic)
	}
	if err := bus.handler(context.Background(), bus.payload); err != nil {
		t.Fatal(err)
	}
	registry.mu.Lock()
	serviceCount, webPort := len(registry.services), registry.services[0].WebPort
	registry.mu.Unlock()
	if serviceCount == 0 || webPort != protocol.WebPort() {
		t.Fatalf("心跳端口错误: %d/%d", serviceCount, webPort)
	}
	protocol.Stop()
	protocol.Stop()
	if err := protocol.Publish(context.Background(), message); err == nil {
		t.Fatal("关闭后允许发布")
	}
}

// TestProtocolRejectsMissingDependencies 验证启动前拒绝无效依赖。
func TestProtocolRejectsMissingDependencies(t *testing.T) {
	if _, err := NewProtocol(Options{Info: &dm.ProtocolInfo{Code: "modbus"}}); err == nil {
		t.Fatal("缺失依赖未拒绝")
	}
	if err := (GRPCRegistry{}).Register(context.Background(), &dm.ProtocolInfo{}); err == nil {
		t.Fatal("缺失 RPC 客户端未拒绝")
	}
}

// fakeProtocolClient 验证公开 protobuf RPC 适配器的注册与心跳。
type fakeProtocolClient struct {
	dm.ProtocolManageClient
	info        *dm.ProtocolInfo
	service     *dm.ProtocolService
	registerErr error
}

// ProtocolInfoCreate 保存协议登记请求并返回可控错误。
func (client *fakeProtocolClient) ProtocolInfoCreate(_ context.Context, info *dm.ProtocolInfo, _ ...grpc.CallOption) (*dm.ProtocolManageWithID, error) {
	client.info = info
	return &dm.ProtocolManageWithID{}, client.registerErr
}

// ProtocolServiceUpdate 保存心跳请求。
func (client *fakeProtocolClient) ProtocolServiceUpdate(_ context.Context, service *dm.ProtocolService, _ ...grpc.CallOption) (*dm.ProtocolManageEmpty, error) {
	client.service = service
	return &dm.ProtocolManageEmpty{}, nil
}

// TestGRPCRegistry 验证重复注册幂等与端口心跳使用已生成客户端。
func TestGRPCRegistry(t *testing.T) {
	client := &fakeProtocolClient{registerErr: status.Error(codes.AlreadyExists, "registered")}
	registry := GRPCRegistry{Client: client}
	info := &dm.ProtocolInfo{Code: "modbus"}
	if err := registry.Register(context.Background(), info); err != nil || client.info != info {
		t.Fatalf("重复注册未幂等: %v", err)
	}
	service := &dm.ProtocolService{Code: "modbus", WebPort: 8081}
	if err := registry.Heartbeat(context.Background(), service); err != nil || client.service != service {
		t.Fatalf("心跳 RPC 错误: %v", err)
	}
}

// syncServer 实现原 Things 协议同步 RPC，验证生成代码可由独立协议核心注册。
type syncServer struct {
	protocolsync.UnimplementedProtocolSyncServer
}

// SyncProduct 返回成功，表示产品同步请求已抵达协议服务。
func (syncServer) SyncProduct(context.Context, *protocolsync.Empty) (*protocolsync.Empty, error) {
	return &protocolsync.Empty{}, nil
}

// TestProtocolRPCServer 验证原协议同步服务可调用、发现端口正确且停止后关闭连接。
func TestProtocolRPCServer(t *testing.T) {
	registry := &fakeRegistry{}
	var intercepted atomic.Bool
	protocol, err := NewProtocol(Options{
		Info: &dm.ProtocolInfo{Code: "modbus"}, Registry: registry, Bus: &fakeBus{}, RegisterIP: "127.0.0.1",
		RPCListenAddr: "127.0.0.1:0", RPCRegistrars: []func(*grpc.Server){func(server *grpc.Server) {
			protocolsync.RegisterProtocolSyncServer(server, syncServer{})
		}},
		RPCServerOptions: []grpc.ServerOption{grpc.UnaryInterceptor(func(ctx context.Context, request any, _ *grpc.UnaryServerInfo, next grpc.UnaryHandler) (any, error) {
			intercepted.Store(true)
			return next(ctx, request)
		})},
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := protocol.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(protocol.Stop)
	if protocol.RPCPort() == 0 {
		t.Fatal("RPC 服务未分配端口")
	}
	registry.mu.Lock()
	advertised := registry.services[0].Port
	registry.mu.Unlock()
	if advertised != protocol.RPCPort() {
		t.Fatalf("平台注册端口错误: %d/%d", advertised, protocol.RPCPort())
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	address := "127.0.0.1:" + strconv.FormatInt(protocol.RPCPort(), 10)
	connection, err := grpc.NewClient(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	if _, err := protocolsync.NewProtocolSyncClient(connection).SyncProduct(ctx, &protocolsync.Empty{}); err != nil {
		t.Fatalf("协议 RPC 调用失败: %v", err)
	}
	if !intercepted.Load() {
		t.Fatal("协议 RPC 调用未经过接入方中间件")
	}
	protocol.Stop()
	stoppedCtx, stoppedCancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer stoppedCancel()
	if _, err := protocolsync.NewProtocolSyncClient(connection).SyncProduct(stoppedCtx, &protocolsync.Empty{}); err == nil {
		t.Fatal("协议停止后 RPC 仍可调用")
	}
}

// TestProtocolRPCHeartbeatFailure 验证平台注册失败时释放已监听的 RPC 端口。
func TestProtocolRPCHeartbeatFailure(t *testing.T) {
	registry := &fakeRegistry{heartbeatErr: errors.New("platform unavailable")}
	protocol, err := NewProtocol(Options{
		Info: &dm.ProtocolInfo{Code: "modbus"}, Registry: registry, Bus: &fakeBus{}, RegisterIP: "127.0.0.1",
		RPCListenAddr: "127.0.0.1:0", RPCRegistrars: []func(*grpc.Server){func(server *grpc.Server) {
			protocolsync.RegisterProtocolSyncServer(server, syncServer{})
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := protocol.Start(context.Background()); err == nil {
		t.Fatal("平台注册失败后协议仍启动")
	}
	registry.mu.Lock()
	port := registry.services[0].Port
	registry.mu.Unlock()
	if port == 0 || protocol.RPCPort() != 0 {
		t.Fatalf("启动失败后的端口状态错误: %d/%d", port, protocol.RPCPort())
	}
	connection, err := net.DialTimeout("tcp", "127.0.0.1:"+strconv.FormatInt(port, 10), 100*time.Millisecond)
	if err == nil {
		_ = connection.Close()
		t.Fatal("平台注册失败后 RPC 端口仍在监听")
	}
}

// TestProtocolReportConnection 验证非 MQTT 上下线沿用平台事件主题和毫秒时间戳。
func TestProtocolReportConnection(t *testing.T) {
	bus := &fakeBus{}
	protocol, err := NewProtocol(Options{
		Info: &dm.ProtocolInfo{Code: "modbus"}, Registry: &fakeRegistry{}, Bus: bus, RegisterIP: "127.0.0.1",
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := protocol.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(protocol.Stop)
	connection := tracking.Connection{ProductID: "product", DeviceName: "sensor", Action: "connected"}
	if err := protocol.ReportConnection(context.Background(), connection); err != nil {
		t.Fatal(err)
	}
	if bus.topic != "device.up.status.connected" {
		t.Fatalf("上线主题错误: %s", bus.topic)
	}
	var published tracking.Connection
	if err := json.Unmarshal(bus.payload, &published); err != nil || published.Timestamp == 0 || published.ClientID != "" {
		t.Fatalf("连接事件格式错误: %+v %v", published, err)
	}
	connection.Action = "disconnected"
	if err := protocol.ReportConnection(context.Background(), connection); err != nil || bus.topic != "device.up.status.disconnected" {
		t.Fatalf("下线主题错误: %s %v", bus.topic, err)
	}
	if err := protocol.ReportConnection(context.Background(), tracking.Connection{ProductID: "product", DeviceName: "sensor", Action: "unknown"}); err == nil {
		t.Fatal("未知连接状态未拒绝")
	}
}
