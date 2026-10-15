// 本文件在本机 Redis 模拟服务验证 Things 旧入口接入公开会话 SDK 后的键与接替语义。
package protocol

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"gitee.com/unitedrhino/share/caches"
	"gitee.com/unitedrhino/things/share/devices"
	"github.com/alicebob/miniredis/v2"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// TestMqttTrackingPublicSDKIntegration 验证原入口与公开 SDK 写出相同会话线缆。
func TestMqttTrackingPublicSDKIntegration(t *testing.T) {
	server := miniredis.RunT(t)
	store := kv.NewStore(cache.ClusterConf{{RedisConf: redis.RedisConf{Host: server.Addr(), Type: redis.NodeType}, Weight: 100}})
	ctx := context.Background()
	device := devices.Core{ProductID: "product-a", DeviceName: "device-a"}
	first := devices.DevConn{ProductID: device.ProductID, DeviceName: device.DeviceName, ClientID: "old", Action: devices.ActionConnected}
	if err := syncDeviceMqttTracking(ctx, store, first, time.Now().UnixMilli()); err != nil {
		t.Fatal(err)
	}
	raw, err := store.HgetCtx(ctx, DeviceMqttDevice, GenDeviceTopicKey(device))
	if err != nil {
		t.Fatal(err)
	}
	var saved devices.DevConn
	if err := json.Unmarshal([]byte(raw), &saved); err != nil || saved.ClientID != first.ClientID || saved.ProductID != device.ProductID || saved.DeviceName != device.DeviceName {
		t.Fatalf("MQTT 会话线缆不兼容: %+v %v", saved, err)
	}
	second := first
	second.ClientID = "new"
	if err := syncDeviceMqttTracking(ctx, store, second, time.Now().UnixMilli()); err != nil {
		t.Fatal(err)
	}
	if err := clearDeviceMqttTrackingByClientID(ctx, store, first.ClientID); err != nil {
		t.Fatal(err)
	}
	connected, err := isDeviceMqttConnected(ctx, store, device)
	if err != nil || !connected {
		t.Fatalf("迟到断连清除了新会话: %v %v", connected, err)
	}
	if err := pruneStaleDeviceMqttTracking(ctx, store, map[string]struct{}{}); err != nil {
		t.Fatal(err)
	}
	connected, err = isDeviceMqttConnected(ctx, store, device)
	if err != nil || connected {
		t.Fatalf("清理后设备仍在线: %v %v", connected, err)
	}
}

// TestMqttActivityPublicSDKIntegration 验证旧活动入口读写公开 SDK 的 ZSET。
func TestMqttActivityPublicSDKIntegration(t *testing.T) {
	server := miniredis.RunT(t)
	store := kv.NewStore(cache.ClusterConf{{RedisConf: redis.RedisConf{Host: server.Addr(), Type: redis.NodeType}, Weight: 100}})
	previous := caches.GetStore()
	caches.SetStoreForTest(store)
	t.Cleanup(func() { caches.SetStoreForTest(previous) })
	ctx := context.Background()
	first := devices.Core{ProductID: "product-a", DeviceName: "device-a"}
	second := devices.Core{ProductID: "product-a", DeviceName: "device-b"}
	UpdateDeviceActivity(ctx, first)
	UpdatesDeviceActivity(ctx, []devices.Core{second})
	active, err := GetActivityDevicesByProduct(ctx, first.ProductID, time.Minute)
	if err != nil || len(active) != 2 {
		t.Fatalf("活动索引查询不匹配: %d %v", len(active), err)
	}
	if _, ok := active[first]; !ok {
		t.Fatal("单台活动记录缺失")
	}
	if err := SyncDeviceMqttTracking(ctx, devices.DevConn{ProductID: first.ProductID, DeviceName: first.DeviceName, ClientID: "client-1"}); err != nil {
		t.Fatal(err)
	}
	all, err := GetActivityDevices(ctx)
	if err != nil || len(all) != 2 {
		t.Fatalf("旧会话汇总不匹配: %d %v", len(all), err)
	}
	DeleteDeviceActivity(ctx, second)
	active, err = GetActivityDevicesByProduct(ctx, first.ProductID, time.Minute)
	if err != nil || len(active) != 1 {
		t.Fatalf("删除后活动索引不匹配: %d %v", len(active), err)
	}
}
