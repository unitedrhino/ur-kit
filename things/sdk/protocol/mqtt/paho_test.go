// 本文件验证 Paho 适配器对连接、消息回调、Token 错误与取消的处理。
package mqtt

import (
	"context"
	"errors"
	"testing"
	"time"

	paho "github.com/eclipse/paho.mqtt.golang"
)

// fakeToken 模拟已完成或待取消的 Paho 操作。
type fakeToken struct {
	done chan struct{}
	err  error
}

// Wait 等待模拟操作完成。
func (token fakeToken) Wait() bool { <-token.done; return true }

// WaitTimeout 在限定时间内等待模拟操作完成。
func (token fakeToken) WaitTimeout(delay time.Duration) bool {
	select {
	case <-token.done:
		return true
	case <-time.After(delay):
		return false
	}
}

// Done 返回模拟操作完成信号。
func (token fakeToken) Done() <-chan struct{} { return token.done }

// Error 返回模拟操作错误。
func (token fakeToken) Error() error { return token.err }

// completedToken 创建一个已完成的模拟 Broker 操作。
func completedToken(err error) fakeToken {
	done := make(chan struct{})
	close(done)
	return fakeToken{done: done, err: err}
}

// fakePahoClient 保存 Paho 发布和订阅参数。
type fakePahoClient struct {
	paho.Client
	connectToken   paho.Token
	publishToken   paho.Token
	subscribeToken paho.Token
	callback       paho.MessageHandler
	topic          string
	qos            byte
	retained       bool
	payload        []byte
	disconnected   bool
}

// Connect 返回模拟连接结果。
func (client *fakePahoClient) Connect() paho.Token { return client.connectToken }

// Disconnect 记录客户端断连。
func (client *fakePahoClient) Disconnect(uint) { client.disconnected = true }

// Publish 保存消息参数并返回模拟确认。
func (client *fakePahoClient) Publish(topic string, qos byte, retained bool, payload interface{}) paho.Token {
	client.topic, client.qos, client.retained, client.payload = topic, qos, retained, payload.([]byte)
	return client.publishToken
}

// Subscribe 保存主题与回调并返回模拟确认。
func (client *fakePahoClient) Subscribe(topic string, qos byte, callback paho.MessageHandler) paho.Token {
	client.topic, client.qos, client.callback = topic, qos, callback
	return client.subscribeToken
}

// fakePahoMessage 提供回调中读取的主题和字节消息。
type fakePahoMessage struct {
	paho.Message
	topic   string
	payload []byte
}

// Topic 返回模拟设备主题。
func (message fakePahoMessage) Topic() string { return message.topic }

// Payload 返回模拟设备消息。
func (message fakePahoMessage) Payload() []byte { return message.payload }

// TestPahoTransport 验证适配器连接、QoS 发布和订阅回调。
func TestPahoTransport(t *testing.T) {
	client := &fakePahoClient{connectToken: completedToken(nil), publishToken: completedToken(nil), subscribeToken: completedToken(nil)}
	transport, err := WrapPahoClient(client, nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := transport.Connect(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := transport.Publish(context.Background(), "device/p/d", 1, false, []byte("value")); err != nil {
		t.Fatal(err)
	}
	if client.topic != "device/p/d" || client.qos != 1 || client.retained || string(client.payload) != "value" {
		t.Fatalf("发布参数错误: %+v", client)
	}
	called := false
	if err := transport.Subscribe(context.Background(), "device/+/+", 1, func(_ context.Context, topic string, payload []byte) error {
		called = topic == "device/p/d" && string(payload) == "value"
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	client.callback(client, fakePahoMessage{topic: "device/p/d", payload: []byte("value")})
	if !called || client.topic != "device/+/+" {
		t.Fatal("消息回调未保留主题和内容")
	}
	transport.Close()
	if !client.disconnected {
		t.Fatal("关闭未断开 MQTT 客户端")
	}
}

// TestPahoTokenErrors 验证 Broker 错误和上下文取消不会被吞掉。
func TestPahoTokenErrors(t *testing.T) {
	brokerErr := errors.New("broker refused")
	client := &fakePahoClient{connectToken: completedToken(brokerErr)}
	transport, _ := WrapPahoClient(client, nil)
	if err := transport.Connect(context.Background()); !errors.Is(err, brokerErr) {
		t.Fatalf("连接错误丢失: %v", err)
	}
	client.connectToken = fakeToken{done: make(chan struct{})}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := transport.Connect(ctx); !errors.Is(err, context.Canceled) || !client.disconnected {
		t.Fatalf("取消未终止连接: %v", err)
	}
}
