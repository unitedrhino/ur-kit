// 本文件验证平台运行配置覆盖、缺省回退及低代码服务直接注入客户端。
package platformcore

import (
	"context"
	"testing"

	shareerrors "gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/eventBus"
	"gitee.com/unitedrhino/things/service/dmsvr/client/deviceinteract"
	"gitee.com/unitedrhino/things/service/dmsvr/client/devicemanage"
	"gitee.com/unitedrhino/things/service/dmsvr/client/devicemsg"
	"gitee.com/unitedrhino/things/service/dmsvr/client/productmanage"
	"gitee.com/unitedrhino/things/service/dmsvr/client/protocolmanage"
	"github.com/stretchr/testify/require"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// recordingRuntimeReader 记录目标协议代码并返回平台运行配置。
type recordingRuntimeReader struct {
	code     string
	response *dm.ProtocolRuntimeConfigResp
	err      error
}

// directProtocolClient 模拟 lowcodesvr 注入的本地协议客户端，只覆盖构造时的运行配置查询。
type directProtocolClient struct {
	protocolmanage.ProtocolManage
	code string
}

// ProtocolRuntimeConfigGetOne 记录协议代码并返回空配置，验证保留调用方的本地配置。
func (client *directProtocolClient) ProtocolRuntimeConfigGetOne(_ context.Context, request *dm.ProtocolRuntimeConfigGetReq, _ ...grpc.CallOption) (*dm.ProtocolRuntimeConfigResp, error) {
	client.code = request.ProtocolCode
	return &dm.ProtocolRuntimeConfigResp{}, nil
}

// TestDirectClientConstruction 验证 lowcodesvr 无 DmClient 时可复用已装配的本地客户端和事件总线。
func TestDirectClientConstruction(t *testing.T) {
	protocolM := &directProtocolClient{}
	productM := productmanage.NewProductManageMock()
	deviceM := devicemanage.NewDeviceManageMock()
	deviceMsg := devicemsg.NewDeviceMsgMock()
	deviceInteract := deviceinteract.NewDeviceInteractMock()
	event := eventBus.NewNoopFastEvent("lowcode-test")
	protocol, err := NewCoreProtocol(Options{
		Info: &dm.ProtocolInfo{Code: "lowcode-test", Name: "低代码测试协议"}, ServerName: "lowcode-test",
		ProtocolM: protocolM, ProductM: productM, DeviceM: deviceM, DeviceMsg: deviceMsg,
		DeviceInteract: deviceInteract, FastEvent: event, NodeID: 123,
	})
	require.NoError(t, err)
	require.Equal(t, "lowcode-test", protocolM.code)
	require.Equal(t, int64(123), protocol.NodeID)
	require.Same(t, event, protocol.FastEvent)
	require.Same(t, protocolM, protocol.ProtocolM)
	require.Same(t, productM, protocol.ProductM)
	require.Same(t, deviceM, protocol.DeviceM)
	require.Same(t, deviceMsg, protocol.DeviceMsg)
	require.Same(t, deviceInteract, protocol.DeviceInteract)
	protocol.Stop()
}

// ProtocolRuntimeConfigGetOne 返回测试提供的运行配置 JSON。
func (reader *recordingRuntimeReader) ProtocolRuntimeConfigGetOne(_ context.Context, request *dm.ProtocolRuntimeConfigGetReq, _ ...grpc.CallOption) (*dm.ProtocolRuntimeConfigResp, error) {
	reader.code = request.ProtocolCode
	return reader.response, reader.err
}

// TestRuntimeConfiguration 验证平台 NATS 与 Redis 覆盖、空配置回退及非法 JSON 拒绝。
func TestRuntimeConfiguration(t *testing.T) {
	reader := &recordingRuntimeReader{response: &dm.ProtocolRuntimeConfigResp{ConfigJson: `{"event":{"mode":"nats","nats":{"url":"nats://platform:4222"}},"cacheRedis":[{"host":"redis:6379","type":"node","weight":100}],"devLink":{"mqtt":{"brokers":["tcp://mqtt:1883"],"clientID":"protocol"}}}`}}
	resolved, err := resolveRuntime(context.Background(), "modbus", runtimeOptions{}, reader)
	require.NoError(t, err)
	require.Equal(t, "modbus", reader.code)
	require.Equal(t, "nats", resolved.Event.Mode)
	require.Equal(t, "nats://platform:4222", resolved.Event.Nats.Url)
	require.Len(t, resolved.CacheRedis, 1)
	require.Equal(t, "tcp://mqtt:1883", resolved.DevLink.Mqtt.Brokers[0])

	reader.response = &dm.ProtocolRuntimeConfigResp{}
	base := runtimeOptions{Event: resolved.Event}
	resolved, err = resolveRuntime(context.Background(), "modbus", base, reader)
	require.NoError(t, err)
	require.Equal(t, base.Event, resolved.Event)
	reader.err = shareerrors.NotFind
	resolved, err = resolveRuntime(context.Background(), "modbus", base, reader)
	require.NoError(t, err)
	require.Equal(t, base.Event, resolved.Event)
	reader.err = nil
	reader.response.ConfigJson = `[]`
	_, err = resolveRuntime(context.Background(), "modbus", base, reader)
	require.Error(t, err)
}
