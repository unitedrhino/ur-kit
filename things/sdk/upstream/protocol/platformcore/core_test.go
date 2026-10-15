// 本文件验证 SaaS 旧协议入口经公开核心仍保持原设备消息线缆。
package platformcore

import (
	"context"
	"encoding/json"
	"testing"

	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/things/share/devices"
	"github.com/stretchr/testify/require"
	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	publiccore "github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

// recordingRegistry 保存公开核心注册和心跳的协议信息。
type recordingRegistry struct {
	info    *dm.ProtocolInfo
	service *dm.ProtocolService
}

// Register 记录首次协议登记。
func (registry *recordingRegistry) Register(_ context.Context, info *dm.ProtocolInfo) error {
	registry.info = info
	return nil
}

// Heartbeat 记录首次服务地址回写。
func (registry *recordingRegistry) Heartbeat(_ context.Context, service *dm.ProtocolService) error {
	registry.service = service
	return nil
}

// recordingBus 保存公开核心发布的原始消息和下行订阅。
type recordingBus struct {
	topic   string
	payload []byte
	down    func(context.Context, []byte) error
}

// Publish 保留上行和在线状态事件的原始字节。
func (bus *recordingBus) Publish(_ context.Context, topic string, payload []byte) error {
	bus.topic, bus.payload = topic, append([]byte(nil), payload...)
	return nil
}

// QueueSubscribe 记录下行主题和回调。
func (bus *recordingBus) QueueSubscribe(topic string, handle func(context.Context, []byte) error) error {
	bus.topic, bus.down = topic, handle
	return nil
}

// newCoreForTest 使用可控注册器和事件总线创建已启动的协议适配器。
func newCoreForTest(t *testing.T) (*CoreProtocol, *recordingBus) {
	t.Helper()
	registry, bus := &recordingRegistry{}, &recordingBus{}
	info := &dm.ProtocolInfo{Code: "modbus", Name: "回环协议"}
	base, err := publiccore.NewProtocol(publiccore.Options{
		Info: info, Registry: registry, Bus: bus, RegisterIP: "127.0.0.1",
	})
	require.NoError(t, err)
	require.NoError(t, base.Start(context.Background()))
	t.Cleanup(base.Stop)
	require.Equal(t, "modbus", registry.info.Code)
	require.Equal(t, "modbus", registry.service.Code)
	return &CoreProtocol{Pi: info, core: base}, bus
}

// TestDeviceMessageWire 验证时间戳、协议代码和大整数产品 ID 保持旧信封格式。
func TestDeviceMessageWire(t *testing.T) {
	protocol, bus := newCoreForTest(t)
	message := &devices.DevPublish{
		Handle: devices.Thing, Type: "property", ProductID: "9007199254740993",
		DeviceName: "device-one", Payload: []byte(`{"method":"report"}`),
	}
	require.NoError(t, protocol.DevPubMsg(context.Background(), message))
	require.Equal(t, "device.up.thing.9007199254740993.device-one", bus.topic)
	require.Equal(t, "modbus", message.ProtocolCode)
	require.Positive(t, message.ReceivedTime)
	require.Positive(t, message.Timestamp)
	var wire devices.DevPublish
	require.NoError(t, json.Unmarshal(bus.payload, &wire))
	require.Equal(t, message.ProductID, wire.ProductID)
	require.Equal(t, message.ReceivedTime, wire.ReceivedTime)
	require.Equal(t, message.Payload, wire.Payload)
}

// TestDeviceConnectionAndDownlinkWire 验证非 MQTT 状态主题和下行身份上下文。
func TestDeviceConnectionAndDownlinkWire(t *testing.T) {
	protocol, bus := newCoreForTest(t)
	connection := devices.DevConn{Action: devices.ActionConnected, ProductID: "product", DeviceName: "device", ClientID: "original"}
	require.NoError(t, protocol.ReportDevConn(context.Background(), connection))
	require.Equal(t, "device.up.status.connected", bus.topic)
	var sent devices.DevConn
	require.NoError(t, json.Unmarshal(bus.payload, &sent))
	require.Equal(t, "original", sent.ClientID)
	require.Positive(t, sent.Timestamp)

	var received *devices.InnerPublish
	require.NoError(t, protocol.RegisterDeviceMsgDownHandler(func(ctx context.Context, message *devices.InnerPublish) error {
		require.NoError(t, ctxs.IsRoot(ctx))
		received = message
		return nil
	}))
	require.Equal(t, "device.down.modbus.>", bus.topic)
	wire, err := json.Marshal(devices.InnerPublish{Handle: devices.Thing, ProductID: "product", DeviceName: "device", Payload: []byte("command")})
	require.NoError(t, err)
	require.NoError(t, bus.down(context.Background(), wire))
	require.Equal(t, "product", received.ProductID)
	require.Equal(t, []byte("command"), received.Payload)
}

// TestProductProtocolSelection 验证公开规则在主协议和子协议之间选择原配置。
func TestProductProtocolSelection(t *testing.T) {
	protocol := &CoreProtocol{Pi: &dm.ProtocolInfo{Code: "modbus"}}
	product := &dm.ProductInfo{
		ProtocolConf:    map[string]string{"source": "primary"},
		SubProtocolCode: wrapperspb.String("modbus"),
		SubProtocolConf: map[string]string{"source": "secondary"},
	}
	require.Equal(t, "secondary", protocol.GetProtocolConf(product)["source"])
	protocol.Pi.Code = "other"
	require.Equal(t, "primary", protocol.GetProtocolConf(product)["source"])
}

// TestDeviceProtocolSelection 验证设备配置使用产品的子协议归属，且查询错误继续返回。
func TestDeviceProtocolSelection(t *testing.T) {
	product := &dm.ProductInfo{SubProtocolCode: wrapperspb.String("modbus")}
	protocol := &CoreProtocol{Pi: &dm.ProtocolInfo{Code: "modbus"}, ProductCache: fixedProductReader{product}}
	device := &dm.DeviceInfo{
		ProductID: "product", ProtocolConf: map[string]string{"source": "primary"},
		SubProtocolConf: map[string]string{"source": "secondary"},
	}
	selected, err := protocol.GetDevProtocolConf(context.Background(), device)
	require.NoError(t, err)
	require.Equal(t, "secondary", selected["source"])
}

// fixedProductReader 为协议配置测试提供固定的产品资料。
type fixedProductReader struct{ product *dm.ProductInfo }

// GetData 返回用于测试的产品资料。
func (reader fixedProductReader) GetData(context.Context, string) (*dm.ProductInfo, error) {
	return reader.product, nil
}
