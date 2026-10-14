// 本文件在本机 NATS 上验证协议核心的消息主题与云配置变更订阅。
package natsbus

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
)

// localRegistry 接受本机协议注册与心跳，不访问真实平台。
type localRegistry struct{}

// Register 接收协议元信息。
func (localRegistry) Register(context.Context, *dm.ProtocolInfo) error { return nil }

// Heartbeat 接收协议地址与端口。
func (localRegistry) Heartbeat(context.Context, *dm.ProtocolService) error { return nil }

// TestNATSProtocolRoundTrip 验证公开协议核心可经 NATS 收发并撤销配置订阅。
func TestNATSProtocolRoundTrip(t *testing.T) {
	url := os.Getenv("UR_KIT_TEST_NATS_URL")
	if url == "" {
		t.Skip("设置 UR_KIT_TEST_NATS_URL 运行本机 NATS 集成测试")
	}
	conn, err := nats.Connect(url, nats.Timeout(3*time.Second))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(conn.Close)
	code := fmt.Sprintf("urkit-%d", time.Now().UnixNano())
	bus, err := New(Options{Conn: conn, Queue: code})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(bus.Close)
	base, err := core.NewProtocol(core.Options{Info: &dm.ProtocolInfo{Code: code}, Registry: localRegistry{}, Bus: bus, RegisterIP: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	if err := base.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(base.Stop)
	down := make(chan core.Message, 1)
	if err := base.SubscribeDownlink(func(_ context.Context, message *core.Message) error {
		down <- *message
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	changes := make(chan struct{}, 1)
	unsubscribe, err := bus.SubscribeUpdates(context.Background(), "server.things.dm.protocol."+code+".update", func(context.Context) error {
		changes <- struct{}{}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	defer unsubscribe()
	up := make(chan core.Message, 1)
	upSub, err := conn.Subscribe("device.up.thing.p1.d1", func(message *nats.Msg) {
		var event core.Message
		if json.Unmarshal(message.Data, &event) == nil {
			up <- event
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	defer upSub.Unsubscribe()
	if err := conn.FlushTimeout(3 * time.Second); err != nil {
		t.Fatal(err)
	}
	if err := base.Publish(context.Background(), &core.Message{Handle: "thing", ProductID: "p1", DeviceName: "d1", Payload: []byte(`{"value":42}`)}); err != nil {
		t.Fatal(err)
	}
	if err := conn.Publish("device.down."+code+".p1.d1", []byte(`{"deviceName":"d1"}`)); err != nil {
		t.Fatal(err)
	}
	if err := conn.Publish("server.things.dm.protocol."+code+".update", nil); err != nil {
		t.Fatal(err)
	}
	gotUp, gotDown, gotChange := false, false, false
	for !gotUp || !gotDown || !gotChange {
		select {
		case event := <-up:
			if event.ProtocolCode != code || event.ReceivedTime == 0 || event.DeviceName != "d1" {
				t.Fatalf("上行信封错误: %+v", event)
			}
			gotUp = true
		case event := <-down:
			if event.DeviceName != "d1" {
				t.Fatalf("下行消息错误: %+v", event)
			}
			gotDown = true
		case <-changes:
			gotChange = true
		case <-time.After(3 * time.Second):
			t.Fatal("未收到协议上行、下行或配置事件")
		}
	}
	unsubscribe()
	bus.Close()
	if err := bus.Publish(context.Background(), "device.up.test", nil); err == nil {
		t.Fatal("关闭后的总线仍接受发布")
	}
	if conn.IsClosed() {
		t.Fatal("适配器关闭了调用方的 NATS 连接")
	}
}
