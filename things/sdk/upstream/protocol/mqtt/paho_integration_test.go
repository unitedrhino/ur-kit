// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件在可用的本地 MQTT Broker 上验证协议传输的真实订阅与 QoS 1 发布。
package mqtt

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	paho "github.com/eclipse/paho.mqtt.golang"
)

// TestPahoBrokerRoundTrip 验证独立客户端可经 Broker 收发消息，未指定地址时跳过。
func TestPahoBrokerRoundTrip(t *testing.T) {
	broker := os.Getenv("UR_KIT_TEST_MQTT_BROKER")
	if broker == "" {
		t.Skip("设置 UR_KIT_TEST_MQTT_BROKER 后运行真实 Broker 集成测试")
	}
	if !strings.HasPrefix(broker, "tcp://") && !strings.HasPrefix(broker, "ssl://") {
		t.Fatal("Broker 地址必须使用 tcp:// 或 ssl://")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	topic := fmt.Sprintf("ur-kit/test/%d", time.Now().UnixNano())
	received := make(chan string, 1)

	subscriberOptions := paho.NewClientOptions().AddBroker(broker).SetClientID(fmt.Sprintf("ur-kit-sub-%d", time.Now().UnixNano()))
	subscriber, err := NewPahoTransport(subscriberOptions, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer subscriber.Close()
	if err := subscriber.Connect(ctx); err != nil {
		t.Fatal(err)
	}
	if err := subscriber.Subscribe(ctx, topic, 1, func(_ context.Context, actualTopic string, payload []byte) error {
		if actualTopic == topic {
			received <- string(payload)
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}

	publisherOptions := paho.NewClientOptions().AddBroker(broker).SetClientID(fmt.Sprintf("ur-kit-pub-%d", time.Now().UnixNano()))
	publisher, err := NewPahoTransport(publisherOptions, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer publisher.Close()
	if err := publisher.Connect(ctx); err != nil {
		t.Fatal(err)
	}
	if err := publisher.Publish(ctx, topic, 1, false, []byte("hello")); err != nil {
		t.Fatal(err)
	}
	select {
	case message := <-received:
		if message != "hello" {
			t.Fatalf("收到错误消息: %q", message)
		}
	case <-ctx.Done():
		t.Fatal("等待 Broker 消息超时")
	}
}
