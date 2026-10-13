// 本文件提供可注入 MQTT 传输层的独立协议收发、设备连接事件与会话跟踪。
package mqtt

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
)

const (
	// ConnectedTopic 保留 Things 设备上线事件的既有主题。
	ConnectedTopic = "device.up.status.connected"
	// DisconnectedTopic 保留 Things 设备下线事件的既有主题。
	DisconnectedTopic = "device.up.status.disconnected"
	// ClientEventFilter 订阅 EMQX 客户端上下线事件。
	ClientEventFilter = "$SYS/brokers/+/clients/#"
)

// Transport 将 MQTT 实现限定为发布、订阅接口，允许接入 EMQX 客户端或测试传输。
type Transport interface {
	Publish(context.Context, string, byte, bool, []byte) error
	Subscribe(context.Context, string, byte, func(context.Context, string, []byte) error) error
}

// SessionTracker 维护 MQTT 在线映射，调用方可注入 Redis 跟踪器。
type SessionTracker interface {
	Sync(context.Context, tracking.Connection, time.Time) error
	ClearClient(context.Context, string) error
}

// ConnectionHandler 将 EMQX 原始会话映射到已验证的产品和设备。
type ConnectionHandler func(context.Context, tracking.Connection) (tracking.Connection, error)

// Protocol 组合公开协议核心与 MQTT 传输，保持原设备上下行主题。
type Protocol struct {
	Core         *core.Protocol
	Transport    Transport
	Bus          core.Bus
	Tracker      SessionTracker
	SharedPrefix string
}

// NewProtocol 校验协议核心、MQTT 传输及事件总线。
func NewProtocol(base *core.Protocol, transport Transport, bus core.Bus, tracker SessionTracker, sharedPrefix string) (*Protocol, error) {
	if base == nil || transport == nil || bus == nil {
		return nil, errors.New("protocol core, MQTT transport and bus are required")
	}
	return &Protocol{Core: base, Transport: transport, Bus: bus, Tracker: tracker, SharedPrefix: sharedPrefix}, nil
}

// SubscribeDevMsg 订阅设备消息；共享前缀由调用方按所用 Broker 的规则配置。
func (protocol *Protocol) SubscribeDevMsg(ctx context.Context, topic string, handle func(context.Context, string, []byte) error) error {
	if topic == "" || handle == nil {
		return errors.New("MQTT topic and handler are required")
	}
	return protocol.Transport.Subscribe(ctx, protocol.SharedPrefix+topic, 1, handle)
}

// PublishToDev 向设备发布 QoS 1、非保留的消息；对象按 JSON 编码。
func (protocol *Protocol) PublishToDev(ctx context.Context, topic string, payload any) error {
	if topic == "" {
		return errors.New("MQTT topic is required")
	}
	var body []byte
	switch value := payload.(type) {
	case []byte:
		body = value
	case string:
		body = []byte(value)
	default:
		var err error
		body, err = json.Marshal(value)
		if err != nil {
			return err
		}
	}
	return protocol.Transport.Publish(ctx, topic, 1, false, body)
}

// SubscribeDevConn 订阅 EMQX 客户端事件；只有处理器验证的设备才进入在线映射和事件总线。
func (protocol *Protocol) SubscribeDevConn(ctx context.Context, handle ConnectionHandler) error {
	if handle == nil {
		return errors.New("connection handler is required")
	}
	return protocol.SubscribeDevMsg(ctx, ClientEventFilter, func(ctx context.Context, topic string, payload []byte) error {
		var event struct {
			UserName  string `json:"username"`
			Timestamp int64  `json:"ts"`
			Address   string `json:"ipaddress"`
			ClientID  string `json:"clientid"`
			Reason    string `json:"reason"`
		}
		if err := json.Unmarshal(payload, &event); err != nil {
			return err
		}
		connection := tracking.Connection{UserName: event.UserName, Timestamp: event.Timestamp, Address: event.Address, ClientID: event.ClientID, Reason: event.Reason, Action: "connected"}
		if strings.HasSuffix(topic, "/disconnected") {
			connection.Action = "disconnected"
		}
		verified, err := handle(ctx, connection)
		if err != nil {
			return nil // 非本协议设备由处理器排除。
		}
		return protocol.ReportDevConn(ctx, verified)
	})
}

// ReportDevConn 保持旧版连接事件格式，并维护兼容 Redis 在线映射。
func (protocol *Protocol) ReportDevConn(ctx context.Context, connection tracking.Connection) error {
	if connection.ProductID == "" || connection.DeviceName == "" || connection.ClientID == "" {
		return errors.New("product, device and client ID are required")
	}
	var topic string
	switch connection.Action {
	case "connected":
		topic = ConnectedTopic
		if protocol.Tracker != nil {
			if err := protocol.Tracker.Sync(ctx, connection, time.Now()); err != nil {
				return err
			}
		}
	case "disconnected":
		topic = DisconnectedTopic
		if protocol.Tracker != nil {
			if err := protocol.Tracker.ClearClient(ctx, connection.ClientID); err != nil {
				return err
			}
		}
	default:
		return errors.New("unsupported connection action")
	}
	connection.ClientID = fmt.Sprintf("%s&%s", connection.ProductID, connection.DeviceName)
	data, err := json.Marshal(connection)
	if err != nil {
		return err
	}
	return protocol.Bus.Publish(ctx, topic, data)
}
