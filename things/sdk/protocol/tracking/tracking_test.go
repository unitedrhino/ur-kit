// 本文件验证 MQTT 会话双向映射、接替保护、大整数毫秒时间和旧键兼容。
package tracking

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// TestTrackerSessionLifecycle 验证设备接替、客户端复用和迟到断连不会误删现有会话。
func TestTrackerSessionLifecycle(t *testing.T) {
	server := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: server.Addr()})
	tracker, err := NewTracker(client)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	first := Connection{ClientID: "client-old", ProductID: "product-a", DeviceName: "sensor-a", Action: "connected"}
	if err := tracker.Sync(ctx, first, time.UnixMilli(9007199254740993)); err != nil {
		t.Fatal(err)
	}
	activity, err := client.ZScore(ctx, activityKey("product-a"), "product-a:sensor-a").Result()
	if err != nil || activity == 0 {
		t.Fatalf("未保存旧版活动集合: %v %v", activity, err)
	}
	raw, err := client.HGet(ctx, DeviceKey, "product-a:sensor-a").Result()
	if err != nil {
		t.Fatal(err)
	}
	var compatible Connection
	if err := json.Unmarshal([]byte(raw), &compatible); err != nil || compatible.ClientID != "client-old" {
		t.Fatalf("旧会话格式不可读: %+v %v", compatible, err)
	}
	second := first
	second.ClientID = "client-new"
	if err := tracker.Sync(ctx, second, time.Now()); err != nil {
		t.Fatal(err)
	}
	if exists := client.HExists(ctx, ClientKey, "client-old").Val(); exists {
		t.Fatal("新会话未清理旧客户端反向映射")
	}
	if err := tracker.ClearClient(ctx, "client-old"); err != nil {
		t.Fatal(err)
	}
	connected, err := tracker.IsConnected(ctx, Device{ProductID: "product-a", DeviceName: "sensor-a"})
	if err != nil || !connected {
		t.Fatalf("迟到断连误删新会话: %v %v", connected, err)
	}
	third := Connection{ClientID: "client-new", ProductID: "product-b", DeviceName: "sensor-b"}
	if err := tracker.Sync(ctx, third, time.Now()); err != nil {
		t.Fatal(err)
	}
	connected, err = tracker.IsConnected(ctx, Device{ProductID: "product-a", DeviceName: "sensor-a"})
	if err != nil || connected {
		t.Fatalf("客户端复用后旧设备仍在线: %v %v", connected, err)
	}
	if err := tracker.ClearClient(ctx, "client-new"); err != nil {
		t.Fatal(err)
	}
	connected, err = tracker.IsConnected(ctx, Device{ProductID: "product-b", DeviceName: "sensor-b"})
	if err != nil || connected {
		t.Fatalf("断连后设备仍在线: %v %v", connected, err)
	}
}

// TestTrackerReconcile 验证只保留活动会话并清理孤立的设备映射。
func TestTrackerReconcile(t *testing.T) {
	server := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: server.Addr()})
	tracker, err := NewTracker(client)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	for _, connection := range []Connection{{ClientID: "keep", ProductID: "p", DeviceName: "a"}, {ClientID: "stale", ProductID: "p", DeviceName: "b"}} {
		if err := tracker.Sync(ctx, connection, time.Now()); err != nil {
			t.Fatal(err)
		}
	}
	if err := client.HSet(ctx, DeviceKey, "p:orphan", `{"clientID":"orphan","productID":"p","deviceName":"orphan"}`).Err(); err != nil {
		t.Fatal(err)
	}
	if err := tracker.Reconcile(ctx, map[string]struct{}{"keep": {}}); err != nil {
		t.Fatal(err)
	}
	if client.HLen(ctx, DeviceKey).Val() != 1 || client.HLen(ctx, ClientKey).Val() != 1 {
		t.Fatalf("会话清理不正确: devices=%d clients=%d", client.HLen(ctx, DeviceKey).Val(), client.HLen(ctx, ClientKey).Val())
	}
}
