// 本文件验证 MQTT 独立适配层的共享订阅、事件解析、设备上下行与兼容会话。
package mqtt

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
)

// testRegistry 为协议核心提供无副作用的平台注册。
type testRegistry struct{}

// Register 模拟平台注册。
func (testRegistry) Register(context.Context, *dm.ProtocolInfo) error { return nil }

// Heartbeat 模拟平台心跳。
func (testRegistry) Heartbeat(context.Context, *dm.ProtocolService) error { return nil }

// testBus 保存连接事件的主题和数据。
type testBus struct {
	topic string
	body  []byte
}

// Publish 保存上行事件。
func (bus *testBus) Publish(_ context.Context, topic string, data []byte) error {
	bus.topic, bus.body = topic, data
	return nil
}

// QueueSubscribe 模拟下行订阅。
func (*testBus) QueueSubscribe(string, func(context.Context, []byte) error) error { return nil }

// testTransport 模拟 MQTT Broker 的消息订阅和发布。
type testTransport struct {
	topic    string
	qos      byte
	retained bool
	body     []byte
	handler  func(context.Context, string, []byte) error
}

// Publish 保存设备下行参数。
func (transport *testTransport) Publish(_ context.Context, topic string, qos byte, retained bool, body []byte) error {
	transport.topic, transport.qos, transport.retained, transport.body = topic, qos, retained, body
	return nil
}

// Subscribe 保存 Broker 上行回调。
func (transport *testTransport) Subscribe(_ context.Context, topic string, qos byte, handler func(context.Context, string, []byte) error) error {
	transport.topic, transport.qos, transport.handler = topic, qos, handler
	return nil
}

// testTracker 保存设备会话操作。
type testTracker struct {
	connected tracking.Connection
	removed   string
}

// Sync 保存上线会话。
func (tracker *testTracker) Sync(_ context.Context, connection tracking.Connection, _ time.Time) error {
	tracker.connected = connection
	return nil
}

// ClearClient 保存下线客户端。
func (tracker *testTracker) ClearClient(_ context.Context, clientID string) error {
	tracker.removed = clientID
	return nil
}

// TestMQTTConnectionLifecycle 验证旧主题和事件 JSON 格式。
func TestMQTTConnectionLifecycle(t *testing.T) {
	bus, transport, tracker := &testBus{}, &testTransport{}, &testTracker{}
	base, err := core.NewProtocol(core.Options{Info: &dm.ProtocolInfo{Code: "mqtt"}, Registry: testRegistry{}, Bus: bus, RegisterIP: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	protocol, err := NewProtocol(base, transport, bus, tracker, "$share/ur/")
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	if err := protocol.SubscribeDevConn(ctx, func(_ context.Context, connection tracking.Connection) (tracking.Connection, error) {
		connection.ProductID, connection.DeviceName = "p", "d"
		return connection, nil
	}); err != nil {
		t.Fatal(err)
	}
	if transport.topic != "$share/ur/"+ClientEventFilter || transport.qos != 1 {
		t.Fatalf("共享订阅错误: %s", transport.topic)
	}
	payload := []byte(`{"username":"user","ts":1700000000123,"ipaddress":"127.0.0.1","clientid":"client"}`)
	if err := transport.handler(ctx, "$SYS/brokers/b/clients/client/connected", payload); err != nil {
		t.Fatal(err)
	}
	if tracker.connected.ClientID != "client" || bus.topic != ConnectedTopic {
		t.Fatalf("上线事件错误: %+v %s", tracker.connected, bus.topic)
	}
	var published tracking.Connection
	if err := json.Unmarshal(bus.body, &published); err != nil {
		t.Fatal(err)
	}
	if published.ClientID != "p&d" || published.Timestamp != 1700000000123 {
		t.Fatalf("旧版事件信封错误: %+v", published)
	}
	if err := transport.handler(ctx, "$SYS/brokers/b/clients/client/disconnected", payload); err != nil {
		t.Fatal(err)
	}
	if tracker.removed != "client" || bus.topic != DisconnectedTopic {
		t.Fatalf("下线事件错误: %s %s", tracker.removed, bus.topic)
	}
	if err := protocol.PublishToDev(ctx, "device/p/d", map[string]any{"value": 42}); err != nil {
		t.Fatal(err)
	}
	if transport.topic != "device/p/d" || transport.qos != 1 || transport.retained || string(transport.body) != `{"value":42}` {
		t.Fatalf("下行发布错误: %s %s", transport.topic, transport.body)
	}
}

// TestMQTTRejectsInvalidEvents 验证非本协议客户端和无效动作不会进入事件总线。
func TestMQTTRejectsInvalidEvents(t *testing.T) {
	bus, transport := &testBus{}, &testTransport{}
	base, _ := core.NewProtocol(core.Options{Info: &dm.ProtocolInfo{Code: "mqtt"}, Registry: testRegistry{}, Bus: bus, RegisterIP: "127.0.0.1"})
	protocol, _ := NewProtocol(base, transport, bus, nil, "")
	if err := protocol.SubscribeDevConn(context.Background(), func(context.Context, tracking.Connection) (tracking.Connection, error) {
		return tracking.Connection{}, errors.New("unknown device")
	}); err != nil {
		t.Fatal(err)
	}
	if err := transport.handler(context.Background(), "x/connected", []byte(`{"clientid":"x"}`)); err != nil || bus.topic != "" {
		t.Fatalf("未知设备被发布: %s %v", bus.topic, err)
	}
	if err := protocol.ReportDevConn(context.Background(), tracking.Connection{ProductID: "p", DeviceName: "d", ClientID: "x", Action: "broken"}); err == nil {
		t.Fatal("无效动作未拒绝")
	}
}
