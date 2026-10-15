// 本文件保留 Things 原 MQTT 会话入口，并委托公开 SDK 兼容现有分片 KV。
package protocol

import (
	"context"
	"time"

	"gitee.com/unitedrhino/share/caches"
	"gitee.com/unitedrhino/things/share/devices"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	trackinggozero "github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking/gozero"
)

// mqttTrackingOps 是原平台分片 KV 会话操作的最小接口。
type mqttTrackingOps = trackinggozero.Store

// SyncDeviceMqttTracking 将已验证 MQTT 设备连接写入双向映射。
func SyncDeviceMqttTracking(ctx context.Context, connection devices.DevConn) error {
	return syncDeviceMqttTracking(ctx, caches.GetStore(), connection, time.Now().UnixMilli())
}

// ClearDeviceMqttTrackingByClientID 避免迟到断连清除已接替的新会话。
func ClearDeviceMqttTrackingByClientID(ctx context.Context, clientID string) error {
	return clearDeviceMqttTrackingByClientID(ctx, caches.GetStore(), clientID)
}

// ReconcileDeviceMqttTracking 清理不在当前活动客户端集合的旧会话。
func ReconcileDeviceMqttTracking(ctx context.Context, active map[string]struct{}) error {
	return pruneStaleDeviceMqttTracking(ctx, caches.GetStore(), active)
}

// IsDeviceMqttConnected 根据兼容会话映射判断设备是否真实连接。
func IsDeviceMqttConnected(ctx context.Context, device devices.Core) (bool, error) {
	return isDeviceMqttConnected(ctx, caches.GetStore(), device)
}

// isDeviceMqttConnected 将旧设备标识传给公开协议跟踪器。
func isDeviceMqttConnected(ctx context.Context, store mqttTrackingOps, device devices.Core) (bool, error) {
	if store == nil {
		return false, nil
	}
	tracker, err := trackinggozero.NewTracker(store)
	if err != nil {
		return false, err
	}
	return tracker.IsConnected(ctx, tracking.Device{ProductID: device.ProductID, DeviceName: device.DeviceName})
}

// syncDeviceMqttTracking 保留旧测试可注入的 KV 入口和毫秒时间参数。
func syncDeviceMqttTracking(ctx context.Context, store mqttTrackingOps, connection devices.DevConn, timestamp int64) error {
	if store == nil {
		return nil
	}
	tracker, err := trackinggozero.NewTracker(store)
	if err != nil {
		return err
	}
	return tracker.Sync(ctx, tracking.Connection{
		UserName: connection.UserName, Timestamp: connection.Timestamp, Address: connection.Address,
		ClientID: connection.ClientID, Reason: connection.Reason, Action: connection.Action,
		ProductID: connection.ProductID, DeviceName: connection.DeviceName,
	}, time.UnixMilli(timestamp))
}

// clearDeviceMqttTrackingByClientID 保留旧测试可注入的 KV 入口。
func clearDeviceMqttTrackingByClientID(ctx context.Context, store mqttTrackingOps, clientID string) error {
	if store == nil {
		return nil
	}
	tracker, err := trackinggozero.NewTracker(store)
	if err != nil {
		return err
	}
	return tracker.ClearClient(ctx, clientID)
}

// pruneStaleDeviceMqttTracking 保留旧测试可注入的 KV 入口。
func pruneStaleDeviceMqttTracking(ctx context.Context, store mqttTrackingOps, active map[string]struct{}) error {
	if store == nil {
		return nil
	}
	tracker, err := trackinggozero.NewTracker(store)
	if err != nil {
		return err
	}
	return tracker.Reconcile(ctx, active)
}
