// 本文件把 SaaS 的 MQTT 运行配置、设备结构与公开 ur-kit 传输层接线。
package platformcore

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"gitee.com/unitedrhino/share/conf"
	"gitee.com/unitedrhino/things/share/devices"
	"github.com/eclipse/paho.mqtt.golang"
	"github.com/google/uuid"
	publicmqtt "github.com/unitedrhino/ur-kit/things/sdk/protocol/mqtt"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	trackinggozero "github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking/gozero"
	"github.com/zeromicro/go-zero/core/logx"
)

// mqttSubscription 保存启动后交给 Broker 的设备主题处理器。
type mqttSubscription struct {
	topic  string
	handle func(context.Context, string, []byte) error
}

// MqttProtocol 保留现有协议服务入口，并委托公开 MQTT 协议执行收发和连接事件。
type MqttProtocol struct {
	*CoreProtocol
	MqttClient    *publicmqtt.Admin // 设备客户端的 EMQX 动态订阅管理接口。
	protocol      *publicmqtt.Protocol
	transport     *publicmqtt.PahoTransport
	subscriptions []mqttSubscription
	connHandle    func(context.Context, devices.DevConn) (devices.DevConn, error)
	mu            sync.Mutex
	started       bool
}

// mqttSessionTracker 保留平台原有的会话存储故障仅记日志语义。
type mqttSessionTracker struct{ tracker *trackinggozero.Tracker }

// Sync 写入兼容会话键，存储故障只记录，不阻断设备状态事件。
func (tracker mqttSessionTracker) Sync(ctx context.Context, connection tracking.Connection, at time.Time) error {
	if tracker.tracker != nil {
		if err := tracker.tracker.Sync(ctx, connection, at); err != nil {
			logx.WithContext(ctx).Error(err)
		}
	}
	return nil
}

// ClearClient 按客户端 ID 清除旧会话，存储故障只记录。
func (tracker mqttSessionTracker) ClearClient(ctx context.Context, clientID string) error {
	if tracker.tracker != nil {
		if err := tracker.tracker.ClearClient(ctx, clientID); err != nil {
			logx.WithContext(ctx).Error(err)
		}
	}
	return nil
}

// NewMqttProtocol 从 Things 运行配置装配公开协议核心、MQTT 传输和会话跟踪。
func NewMqttProtocol(options Options, devLink conf.DevLinkConf) (*MqttProtocol, error) {
	options.DevLink = devLink
	base, err := NewCoreProtocol(options)
	if err != nil {
		return nil, err
	}
	if base.DevLink.Mqtt == nil || len(base.DevLink.Mqtt.Brokers) == 0 {
		return nil, errors.New("MQTT broker configuration is required")
	}
	config := base.DevLink.Mqtt
	if config.ConnNum > 1 {
		return nil, errors.New("the public MQTT transport currently supports one broker connection")
	}
	clientOptions := mqtt.NewClientOptions().SetClientID(config.ClientID + "_" + uuid.NewString()).
		SetUsername(config.User).SetPassword(config.Pass).
		SetConnectRetry(true).SetConnectRetryInterval(5 * time.Second).SetMaxReconnectInterval(30 * time.Second)
	for _, broker := range config.Brokers {
		clientOptions.AddBroker(broker)
	}
	transport, err := publicmqtt.NewPahoTransport(clientOptions, slog.Default())
	if err != nil {
		return nil, err
	}
	var tracker *trackinggozero.Tracker
	if base.Store != nil {
		tracker, err = trackinggozero.NewTracker(base.Store)
		if err != nil {
			return nil, err
		}
	}
	protocol, err := publicmqtt.NewProtocol(base.core, transport, platformBus{event: base.fastEvent}, mqttSessionTracker{tracker}, config.SharedSubscriptionPrefix(options.ServerName))
	if err != nil {
		return nil, err
	}
	admin := &publicmqtt.Admin{}
	if config.OpenApi != nil {
		admin.BaseURL = config.OpenApi.Host
		admin.APIKey = config.OpenApi.ApiKey
		admin.Secret = config.OpenApi.SecretKey
	}
	return &MqttProtocol{CoreProtocol: base, MqttClient: admin, protocol: protocol, transport: transport}, nil
}

// SubscribeDevMsg 登记设备消息主题，Start 连接 Broker 后再实际订阅。
func (protocol *MqttProtocol) SubscribeDevMsg(topic string, handle func(context.Context, string, []byte) error) error {
	if topic == "" || handle == nil {
		return errors.New("MQTT topic and handler are required")
	}
	protocol.mu.Lock()
	defer protocol.mu.Unlock()
	if protocol.started {
		return errors.New("MQTT protocol is already started")
	}
	protocol.subscriptions = append(protocol.subscriptions, mqttSubscription{topic: topic, handle: handle})
	return nil
}

// SubscribeDevConn 登记设备连接验证器，执行顺序与旧协议入口一致。
func (protocol *MqttProtocol) SubscribeDevConn(handle func(context.Context, devices.DevConn) (devices.DevConn, error)) error {
	if handle == nil {
		return errors.New("MQTT connection handler is required")
	}
	protocol.mu.Lock()
	defer protocol.mu.Unlock()
	if protocol.started {
		return errors.New("MQTT protocol is already started")
	}
	protocol.connHandle = handle
	return nil
}

// PublishToDev 使用公开协议的 QoS 1 发布路径，保持原设备主题与 JSON 载荷。
func (protocol *MqttProtocol) PublishToDev(ctx context.Context, topic string, payload any) error {
	return protocol.protocol.PublishToDev(ctx, topic, payload)
}

// Start 先建立 Broker 订阅，再登记 Things 协议和启动平台事件总线。
func (protocol *MqttProtocol) Start() error {
	protocol.mu.Lock()
	if protocol.started {
		protocol.mu.Unlock()
		return errors.New("MQTT protocol is already started")
	}
	protocol.started = true
	subscriptions := append([]mqttSubscription(nil), protocol.subscriptions...)
	connHandle := protocol.connHandle
	protocol.mu.Unlock()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := protocol.transport.Connect(ctx); err != nil {
		return err
	}
	for _, subscription := range subscriptions {
		if err := protocol.protocol.SubscribeDevMsg(ctx, subscription.topic, subscription.handle); err != nil {
			protocol.transport.Close()
			return err
		}
	}
	if connHandle != nil {
		if err := protocol.protocol.SubscribeDevConn(ctx, func(ctx context.Context, connection tracking.Connection) (tracking.Connection, error) {
			verified, err := connHandle(ctx, devices.DevConn{
				UserName: connection.UserName, Timestamp: connection.Timestamp, Address: connection.Address,
				ClientID: connection.ClientID, Reason: connection.Reason, Action: connection.Action,
				ProductID: connection.ProductID, DeviceName: connection.DeviceName,
			})
			if err != nil {
				return tracking.Connection{}, err
			}
			return tracking.Connection{
				UserName: verified.UserName, Timestamp: verified.Timestamp, Address: verified.Address,
				ClientID: verified.ClientID, Reason: verified.Reason, Action: verified.Action,
				ProductID: verified.ProductID, DeviceName: verified.DeviceName,
			}, nil
		}); err != nil {
			protocol.transport.Close()
			return err
		}
	}
	if err := protocol.CoreProtocol.Start(); err != nil {
		protocol.transport.Close()
		return err
	}
	return nil
}

// Stop 关闭 Things 协议生命周期和本进程的 MQTT Broker 连接。
func (protocol *MqttProtocol) Stop() {
	protocol.CoreProtocol.Stop()
	protocol.transport.Close()
}
