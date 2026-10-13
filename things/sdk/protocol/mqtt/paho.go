// 本文件将 Paho MQTT 客户端适配到公开协议的传输接口，管理连接和 Token 结果。
package mqtt

import (
	"context"
	"errors"
	"log/slog"
	"time"

	paho "github.com/eclipse/paho.mqtt.golang"
)

// PahoTransport 使用现有 Paho MQTT 客户端提供可重连的消息收发。
type PahoTransport struct {
	Client paho.Client
	Logger *slog.Logger
}

// NewPahoTransport 创建客户端并启用自动重连、订阅恢复和独立回调。
func NewPahoTransport(options *paho.ClientOptions, logger *slog.Logger) (*PahoTransport, error) {
	if options == nil {
		return nil, errors.New("MQTT client options are required")
	}
	options.SetAutoReconnect(true).SetResumeSubs(true).SetOrderMatters(false)
	return &PahoTransport{Client: paho.NewClient(options), Logger: logger}, nil
}

// WrapPahoClient 复用调用方已配置的 Paho 客户端；自动重连策略由调用方保证。
func WrapPahoClient(client paho.Client, logger *slog.Logger) (*PahoTransport, error) {
	if client == nil {
		return nil, errors.New("MQTT client is required")
	}
	return &PahoTransport{Client: client, Logger: logger}, nil
}

// waitToken 等待 Broker 操作结束，同时响应调用方的取消信号。
func waitToken(ctx context.Context, token paho.Token) error {
	if token == nil {
		return errors.New("MQTT client returned no token")
	}
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-token.Done():
		return token.Error()
	}
}

// Connect 连接 Broker；上下文取消时关闭尚在连接中的客户端。
func (transport *PahoTransport) Connect(ctx context.Context) error {
	if transport == nil || transport.Client == nil {
		return errors.New("MQTT client is required")
	}
	if err := waitToken(ctx, transport.Client.Connect()); err != nil {
		if ctx.Err() != nil {
			transport.Client.Disconnect(100)
		}
		return err
	}
	return nil
}

// Publish 等待 QoS 对应的发送结果，保留调用方指定的主题与保留标记。
func (transport *PahoTransport) Publish(ctx context.Context, topic string, qos byte, retained bool, payload []byte) error {
	if transport == nil || transport.Client == nil || topic == "" {
		return errors.New("MQTT client and topic are required")
	}
	return waitToken(ctx, transport.Client.Publish(topic, qos, retained, payload))
}

// Subscribe 为每条消息提供有界处理上下文；回调错误写日志供接入服务排查。
func (transport *PahoTransport) Subscribe(ctx context.Context, topic string, qos byte, handler func(context.Context, string, []byte) error) error {
	if transport == nil || transport.Client == nil || topic == "" || handler == nil {
		return errors.New("MQTT client, topic and handler are required")
	}
	callback := func(_ paho.Client, message paho.Message) {
		messageCtx, cancel := context.WithTimeout(context.Background(), 50*time.Second)
		defer cancel()
		if err := handler(messageCtx, message.Topic(), message.Payload()); err != nil && transport.Logger != nil {
			transport.Logger.Error("MQTT message handler failed", "topic", message.Topic(), "error", err)
		}
	}
	return waitToken(ctx, transport.Client.Subscribe(topic, qos, callback))
}

// Close 断开 Broker 连接并等待在途消息短暂完成。
func (transport *PahoTransport) Close() {
	if transport != nil && transport.Client != nil {
		transport.Client.Disconnect(250)
	}
}
