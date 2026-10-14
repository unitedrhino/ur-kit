// 本文件以本机 Redis 模拟服务验证旧平台 KV 的会话键与接替行为。
package gozero

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// TestLegacyStoreSessionLifecycle 验证双向映射、迟到断连及退出清理。
func TestLegacyStoreSessionLifecycle(t *testing.T) {
	server := miniredis.RunT(t)
	store := kv.NewStore(cache.ClusterConf{{RedisConf: redis.RedisConf{Host: server.Addr(), Type: redis.NodeType}, Weight: 100}})
	tracker, err := NewTracker(store)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	device := tracking.Device{ProductID: "p1", DeviceName: "d1"}
	first := tracking.Connection{ProductID: device.ProductID, DeviceName: device.DeviceName, ClientID: "old", Action: "connected"}
	if err := tracker.Sync(ctx, first, time.UnixMilli(9007199254740993)); err != nil {
		t.Fatal(err)
	}
	raw, err := store.HgetCtx(ctx, tracking.DeviceKey, tracking.TopicKey(device))
	if err != nil {
		t.Fatal(err)
	}
	var saved tracking.Connection
	if err := json.Unmarshal([]byte(raw), &saved); err != nil || saved.ClientID != "old" {
		t.Fatalf("旧会话格式不匹配: %+v %v", saved, err)
	}
	second := first
	second.ClientID = "new"
	if err := tracker.Sync(ctx, second, time.Now()); err != nil {
		t.Fatal(err)
	}
	if err := tracker.ClearClient(ctx, "old"); err != nil {
		t.Fatal(err)
	}
	connected, err := tracker.IsConnected(ctx, device)
	if err != nil || !connected {
		t.Fatalf("迟到断连清除了新会话: %v %v", connected, err)
	}
	if err := tracker.Reconcile(ctx, map[string]struct{}{}); err != nil {
		t.Fatal(err)
	}
	connected, err = tracker.IsConnected(ctx, device)
	if err != nil || connected {
		t.Fatalf("清理后设备仍在线: %v %v", connected, err)
	}
}

// TestDeviceByClient 验证旧反向映射的命中、缺失与损坏数据行为。
func TestDeviceByClient(t *testing.T) {
	server := miniredis.RunT(t)
	store := kv.NewStore(cache.ClusterConf{{RedisConf: redis.RedisConf{Host: server.Addr(), Type: redis.NodeType}, Weight: 100}})
	tracker, err := NewTracker(store)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	device, found, err := tracker.DeviceByClient(ctx, "missing")
	if err != nil || found || device != (tracking.Device{}) {
		t.Fatalf("缺失映射返回错误结果: %+v %v %v", device, found, err)
	}
	connection := tracking.Connection{ProductID: "p1", DeviceName: "d1", ClientID: "client-1"}
	if err := tracker.Sync(ctx, connection, time.Now()); err != nil {
		t.Fatal(err)
	}
	device, found, err = tracker.DeviceByClient(ctx, connection.ClientID)
	if err != nil || !found || device.ProductID != connection.ProductID || device.DeviceName != connection.DeviceName {
		t.Fatalf("会话反向映射不匹配: %+v %v %v", device, found, err)
	}
	if err := store.HsetCtx(ctx, tracking.ClientKey, connection.ClientID, "{"); err != nil {
		t.Fatal(err)
	}
	if _, _, err := tracker.DeviceByClient(ctx, connection.ClientID); err == nil {
		t.Fatal("损坏的反向映射未返回错误")
	}
}
