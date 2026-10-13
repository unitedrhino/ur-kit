// 本文件验证独立协议核心的注册、消息信封、Web 配置页与关闭生命周期。
package core

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// fakeRegistry 记录注册与心跳，并允许测试启动失败后的资源清理。
type fakeRegistry struct {
	mu       sync.Mutex
	infos    []*dm.ProtocolInfo
	services []*dm.ProtocolService
	err      error
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
