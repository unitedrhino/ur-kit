// 本文件在本机 NATS 与内存 Redis 上验证协议平台配置、RPC 注册及设备上下行完整接线。
package platformcore

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"testing"
	"time"

	"gitee.com/unitedrhino/share/conf"
	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/share/events"
	"gitee.com/unitedrhino/things/share/devices"
	"github.com/alicebob/miniredis/v2"
	paho "github.com/eclipse/paho.mqtt.golang"
	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"github.com/stretchr/testify/require"
	"gitee.com/unitedrhino/core/service/timedsvr/pb/timed"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
)

// protocolRuntimeServer 只实现本次独立协议接线实际需要的 Things RPC。
type protocolRuntimeServer struct {
	dm.UnimplementedProtocolManageServer
	configJSON string
	info       chan *dm.ProtocolInfo
	service    chan *dm.ProtocolService
}

// timerRuntimeServer 记录通过本仓 protobuf 注册到 timedsvr 的任务。
type timerRuntimeServer struct {
	timed.UnimplementedTaskGroupManageServer
	timed.UnimplementedTaskInfoManageServer
	group chan *timed.TaskGroup
	task  chan *timed.TaskInfo
}

// TaskGroupCreate 记录周期任务分组。
func (server *timerRuntimeServer) TaskGroupCreate(_ context.Context, group *timed.TaskGroup) (*timed.TaskGroupWithID, error) {
	server.group <- group
	return &timed.TaskGroupWithID{}, nil
}

// TaskInfoCreate 记录周期任务代码、Cron 和事件主题。
func (server *timerRuntimeServer) TaskInfoCreate(_ context.Context, task *timed.TaskInfo) (*timed.TaskInfoWithID, error) {
	server.task <- task
	return &timed.TaskInfoWithID{}, nil
}

// ProtocolRuntimeConfigGetOne 返回本机隔离 NATS 和 Redis 的运行配置。
func (server *protocolRuntimeServer) ProtocolRuntimeConfigGetOne(_ context.Context, request *dm.ProtocolRuntimeConfigGetReq) (*dm.ProtocolRuntimeConfigResp, error) {
	return &dm.ProtocolRuntimeConfigResp{ProtocolCode: request.ProtocolCode, ConfigJson: server.configJSON}, nil
}

// ProtocolInfoCreate 记录协议注册。
func (server *protocolRuntimeServer) ProtocolInfoCreate(_ context.Context, info *dm.ProtocolInfo) (*dm.ProtocolManageWithID, error) {
	server.info <- info
	return &dm.ProtocolManageWithID{}, nil
}

// ProtocolServiceUpdate 记录协议心跳与 Web 配置页端口。
func (server *protocolRuntimeServer) ProtocolServiceUpdate(_ context.Context, service *dm.ProtocolService) (*dm.ProtocolManageEmpty, error) {
	server.service <- service
	return &dm.ProtocolManageEmpty{}, nil
}

// TestPlatformCoreLocalRoundTrip 验证从平台取配置到上下行 NATS、Web 心跳的真实本机链路。
func TestPlatformCoreLocalRoundTrip(t *testing.T) {
	natsURL := os.Getenv("UR_KIT_TEST_NATS_URL")
	if natsURL == "" {
		t.Skip("设置 UR_KIT_TEST_NATS_URL 运行本机 NATS 接线测试")
	}
	redisServer := miniredis.RunT(t)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	runtimeJSON, err := json.Marshal(runtimeOptions{
		TimedJobRpc: conf.RpcClientConf{Mode: conf.ClientModeGrpc, Conf: zrpc.RpcClientConf{Target: listener.Addr().String()}},
		Event:       conf.EventConf{Mode: conf.EventModeNats, Nats: conf.NatsConf{Url: natsURL}},
		CacheRedis:  cache.ClusterConf{{RedisConf: redis.RedisConf{Host: redisServer.Addr(), Type: redis.NodeType}, Weight: 100}},
		DevLink:     conf.DevLinkConf{Mqtt: &conf.MqttConf{Brokers: []string{os.Getenv("UR_KIT_TEST_MQTT_BROKER")}, ClientID: "task148-platformcore"}},
	})
	require.NoError(t, err)
	server := &protocolRuntimeServer{configJSON: string(runtimeJSON), info: make(chan *dm.ProtocolInfo, 1), service: make(chan *dm.ProtocolService, 2)}
	timerServer := &timerRuntimeServer{group: make(chan *timed.TaskGroup, 1), task: make(chan *timed.TaskInfo, 1)}
	grpcServer := grpc.NewServer()
	dm.RegisterProtocolManageServer(grpcServer, server)
	timed.RegisterTaskGroupManageServer(grpcServer, timerServer)
	timed.RegisterTaskInfoManageServer(grpcServer, timerServer)
	go func() { _ = grpcServer.Serve(listener) }()
	t.Cleanup(func() { grpcServer.Stop(); _ = listener.Close() })
	client := zrpc.MustNewClient(zrpc.RpcClientConf{Target: listener.Addr().String()})
	protocol, err := NewCoreProtocol(Options{
		Info:       &dm.ProtocolInfo{Code: "task148-modbus", Name: "本机回环协议"},
		ServerName: "task148-platformcore", DmClient: client,
		WebHandler: http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) { _, _ = writer.Write([]byte(request.URL.Path)) }),
	})
	require.NoError(t, err)
	require.NoError(t, protocol.Start())
	t.Cleanup(protocol.Stop)
	select {
	case info := <-server.info:
		require.Equal(t, "task148-modbus", info.Code)
	case <-time.After(3 * time.Second):
		t.Fatal("协议登记超时")
	}
	var heartbeat *dm.ProtocolService
	select {
	case heartbeat = <-server.service:
	case <-time.After(3 * time.Second):
		t.Fatal("协议心跳超时")
	}
	require.Positive(t, heartbeat.WebPort)
	response, err := http.Get(fmt.Sprintf("http://127.0.0.1:%d/config", heartbeat.WebPort))
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, response.StatusCode)
	require.NoError(t, response.Body.Close())

	natsClient, err := nats.Connect(natsURL)
	require.NoError(t, err)
	t.Cleanup(natsClient.Close)
	upstream, err := natsClient.SubscribeSync("device.up.thing.9007199254740993.device")
	require.NoError(t, err)
	require.NoError(t, natsClient.Flush())
	require.NoError(t, protocol.DevPubMsg(context.Background(), &devices.DevPublish{
		Handle: devices.Thing, Type: "property", ProductID: "9007199254740993", DeviceName: "device", Payload: []byte("payload"),
	}))
	message, err := upstream.NextMsg(3 * time.Second)
	require.NoError(t, err)
	var received devices.DevPublish
	envelope := events.GetEventMsg(message.Data)
	require.NotNil(t, envelope)
	require.NoError(t, json.Unmarshal(envelope.GetData(), &received))
	require.Equal(t, "9007199254740993", received.ProductID)
	require.Equal(t, "task148-modbus", received.ProtocolCode)

	downstream := make(chan *devices.InnerPublish, 1)
	require.NoError(t, protocol.RegisterDeviceMsgDownHandler(func(_ context.Context, publish *devices.InnerPublish) error {
		select {
		case downstream <- publish:
		default:
		}
		return nil
	}))
	command, err := json.Marshal(devices.InnerPublish{Handle: devices.Thing, ProductID: "9007199254740993", DeviceName: "device", Payload: []byte("control")})
	require.NoError(t, err)
	require.Eventually(t, func() bool {
		require.NoError(t, natsClient.Publish("device.down.task148-modbus.thing.9007199254740993.device", events.NewEventMsg(context.Background(), command)))
		require.NoError(t, natsClient.Flush())
		select {
		case incoming := <-downstream:
			return string(incoming.Payload) == "control"
		default:
			return false
		}
	}, 3*time.Second, 50*time.Millisecond, "协议下行超时")
	verifyTimerRoundTrip(t, protocol, natsClient, timerServer)
	if os.Getenv("UR_KIT_TEST_MQTT_BROKER") != "" {
		verifyMQTTRoundTrip(t, client, server)
	}
}

// verifyTimerRoundTrip 验证任务登记、立即执行和 NATS 定时事件消费。
func verifyTimerRoundTrip(t *testing.T, protocol *CoreProtocol, natsClient *nats.Conn, server *timerRuntimeServer) {
	t.Helper()
	runs := make(chan time.Time, 2)
	require.NoError(t, protocol.RegisterTimerHandler(func(ctx context.Context, at time.Time) error {
		if err := ctxs.IsRoot(ctx); err != nil {
			return err
		}
		select {
		case runs <- at:
		default:
		}
		return nil
	}))
	select {
	case group := <-server.group:
		require.Equal(t, "unitedRhino-queue", group.Code)
	case <-time.After(3 * time.Second):
		t.Fatal("定时任务分组登记超时")
	}
	select {
	case task := <-server.task:
		require.Equal(t, "protocol-task148-modbus-timer", task.Code)
		require.Equal(t, "@every 10m", task.CronExpr)
		require.Contains(t, task.Params, "server.things.task148-platformcore.protocol.timer")
	case <-time.After(3 * time.Second):
		t.Fatal("定时任务登记超时")
	}
	protocol.RunTimerHandles()
	select {
	case <-runs:
	case <-time.After(3 * time.Second):
		t.Fatal("定时任务立即执行超时")
	}
	require.Eventually(t, func() bool {
		body := events.NewEventMsg(context.Background(), []byte(`{"params":{}}`))
		require.NoError(t, natsClient.Publish("server.timed.unitedRhino-queue.protocol-task148-modbus-timer", body))
		require.NoError(t, natsClient.Flush())
		select {
		case <-runs:
			return true
		default:
			return false
		}
	}, 3*time.Second, 50*time.Millisecond, "定时任务事件超时")
}

// verifyMQTTRoundTrip 使用本机 Broker 验证公开 MQTT 收发与 SaaS 运行配置接线。
func verifyMQTTRoundTrip(t *testing.T, client zrpc.Client, server *protocolRuntimeServer) {
	t.Helper()
	broker := os.Getenv("UR_KIT_TEST_MQTT_BROKER")
	protocol, err := NewMqttProtocol(Options{
		Info:       &dm.ProtocolInfo{Code: "task148-wumei", Name: "本机 MQTT 协议"},
		ServerName: "task148-platformcore", DmClient: client,
	}, conf.DevLinkConf{})
	require.NoError(t, err)
	incoming := make(chan []byte, 1)
	require.NoError(t, protocol.SubscribeDevMsg("task148/in", func(_ context.Context, _ string, body []byte) error {
		incoming <- append([]byte(nil), body...)
		return nil
	}))
	require.NoError(t, protocol.SubscribeDevConn(func(_ context.Context, connection devices.DevConn) (devices.DevConn, error) {
		connection.ProductID, connection.DeviceName = "product", "device"
		return connection, nil
	}))
	require.NoError(t, protocol.Start())
	t.Cleanup(protocol.Stop)
	select {
	case info := <-server.info:
		require.Equal(t, "task148-wumei", info.Code)
	case <-time.After(3 * time.Second):
		t.Fatal("MQTT 协议登记超时")
	}
	select {
	case service := <-server.service:
		require.Equal(t, "task148-wumei", service.Code)
	case <-time.After(3 * time.Second):
		t.Fatal("MQTT 协议心跳超时")
	}
	peer := paho.NewClient(paho.NewClientOptions().AddBroker(broker).SetClientID("task148-peer-" + uuid.NewString()))
	connect := peer.Connect()
	require.True(t, connect.WaitTimeout(3*time.Second))
	require.NoError(t, connect.Error())
	t.Cleanup(func() { peer.Disconnect(100) })
	peerMessages := make(chan []byte, 1)
	subscribe := peer.Subscribe("task148/out", 1, func(_ paho.Client, message paho.Message) {
		peerMessages <- append([]byte(nil), message.Payload()...)
	})
	require.True(t, subscribe.WaitTimeout(3*time.Second))
	require.NoError(t, subscribe.Error())
	require.NoError(t, protocol.PublishToDev(context.Background(), "task148/out", map[string]string{"value": "ok"}))
	select {
	case body := <-peerMessages:
		require.JSONEq(t, `{"value":"ok"}`, string(body))
	case <-time.After(3 * time.Second):
		t.Fatal("MQTT 发布超时")
	}
	publish := peer.Publish("task148/in", 1, false, []byte("device-up"))
	require.True(t, publish.WaitTimeout(3*time.Second))
	require.NoError(t, publish.Error())
	select {
	case body := <-incoming:
		require.Equal(t, []byte("device-up"), body)
	case <-time.After(3 * time.Second):
		t.Fatal("MQTT 共享订阅超时")
	}
}

// TestPlatformCoreTimerBeforeStart 验证 GLSB 的先注册定时任务、后启动总线顺序。
func TestPlatformCoreTimerBeforeStart(t *testing.T) {
	natsURL := os.Getenv("UR_KIT_TEST_NATS_URL")
	if natsURL == "" {
		t.Skip("设置 UR_KIT_TEST_NATS_URL 运行本机 timedsvr 接线测试")
	}
	redisServer := miniredis.RunT(t)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	runtimeJSON, err := json.Marshal(runtimeOptions{
		TimedJobRpc: conf.RpcClientConf{Mode: conf.ClientModeGrpc, Conf: zrpc.RpcClientConf{Target: listener.Addr().String()}},
		Event:       conf.EventConf{Mode: conf.EventModeNats, Nats: conf.NatsConf{Url: natsURL}},
		CacheRedis:  cache.ClusterConf{{RedisConf: redis.RedisConf{Host: redisServer.Addr(), Type: redis.NodeType}, Weight: 100}},
	})
	require.NoError(t, err)
	platform := &protocolRuntimeServer{configJSON: string(runtimeJSON), info: make(chan *dm.ProtocolInfo, 1), service: make(chan *dm.ProtocolService, 1)}
	timers := &timerRuntimeServer{group: make(chan *timed.TaskGroup, 1), task: make(chan *timed.TaskInfo, 1)}
	grpcServer := grpc.NewServer()
	dm.RegisterProtocolManageServer(grpcServer, platform)
	timed.RegisterTaskGroupManageServer(grpcServer, timers)
	timed.RegisterTaskInfoManageServer(grpcServer, timers)
	go func() { _ = grpcServer.Serve(listener) }()
	t.Cleanup(func() { grpcServer.Stop(); _ = listener.Close() })
	client := zrpc.MustNewClient(zrpc.RpcClientConf{Target: listener.Addr().String()})
	protocol, err := NewCoreProtocol(Options{Info: &dm.ProtocolInfo{Code: "task148-glsb", Name: "本机网关"},
		ServerName: "task148-before-start", DmClient: client})
	require.NoError(t, err)
	runs := make(chan struct{}, 1)
	require.NoError(t, protocol.RegisterTimerHandler(func(ctx context.Context, _ time.Time) error {
		if err := ctxs.IsRoot(ctx); err != nil {
			return err
		}
		select {
		case runs <- struct{}{}:
		default:
		}
		return nil
	}))
	select {
	case task := <-timers.task:
		require.Equal(t, "protocol-task148-glsb-timer", task.Code)
	case <-time.After(3 * time.Second):
		t.Fatal("启动前定时任务登记超时")
	}
	require.NoError(t, protocol.Start())
	t.Cleanup(protocol.Stop)
	select {
	case <-platform.service:
	case <-time.After(3 * time.Second):
		t.Fatal("协议启动心跳超时")
	}
	publisher, err := nats.Connect(natsURL)
	require.NoError(t, err)
	t.Cleanup(publisher.Close)
	require.Eventually(t, func() bool {
		body := events.NewEventMsg(context.Background(), []byte(`{"params":{}}`))
		require.NoError(t, publisher.Publish("server.timed.unitedRhino-queue.protocol-task148-glsb-timer", body))
		require.NoError(t, publisher.Flush())
		select {
		case <-runs:
			return true
		default:
			return false
		}
	}, 3*time.Second, 50*time.Millisecond, "启动前注册的定时任务未收到事件")
}
