// 本文件为仍使用 go-zero 分片 KV 的服务提供兼容 MQTT 会话跟踪。
package gozero

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// Store 描述兼容旧平台 KV 所需的最小 Redis 操作。
type Store interface {
	HgetCtx(context.Context, string, string) (string, error)
	HsetCtx(context.Context, string, string, string) error
	HdelCtx(context.Context, string, string) (bool, error)
	HgetallCtx(context.Context, string) (map[string]string, error)
	ZaddCtx(context.Context, string, int64, string) (bool, error)
	ZremCtx(context.Context, string, ...any) (int, error)
	ZrangeCtx(context.Context, string, int64, int64) ([]string, error)
	ZcardCtx(context.Context, string) (int, error)
	ZrevrangebyscoreWithScoresAndLimitCtx(context.Context, string, int64, int64, int, int) ([]redis.Pair, error)
	ExpireCtx(context.Context, string, int) error
}

// Tracker 在调用方的旧 KV 存储上维护 MQTT 会话映射。
type Tracker struct{ Store Store }

// NewTracker 注入平台现有 KV 存储，不创建额外 Redis 连接。
func NewTracker(store Store) (*Tracker, error) {
	if store == nil {
		return nil, errors.New("go-zero KV store is required")
	}
	return &Tracker{Store: store}, nil
}

// activitySmallSetThreshold 限制旧 KV 大集合单次扫描数量。
const activitySmallSetThreshold = 1000

// activityKey 返回与原协议一致的产品活动集合键。
func activityKey(productID string) string { return tracking.ActivityPrefix + ":" + productID }

// Sync 写入设备到客户端的双向映射与活动时间。
func (tracker *Tracker) Sync(ctx context.Context, connection tracking.Connection, received time.Time) error {
	return syncDeviceMqttTracking(ctx, tracker.Store, connection, received.UnixMilli())
}

// ClearClient 清理仍属于目标客户端的设备映射。
func (tracker *Tracker) ClearClient(ctx context.Context, clientID string) error {
	return clearDeviceMqttTrackingByClientID(ctx, tracker.Store, clientID)
}

// Reconcile 清理不在活动客户端集合中的旧会话与孤立活动。
func (tracker *Tracker) Reconcile(ctx context.Context, active map[string]struct{}) error {
	return pruneStaleDeviceMqttTracking(ctx, tracker.Store, active)
}

// IsConnected 根据当前设备会话映射判断 MQTT 连接状态。
func (tracker *Tracker) IsConnected(ctx context.Context, device tracking.Device) (bool, error) {
	return isDeviceMqttConnected(ctx, tracker.Store, device)
}

// DeviceByClient 读取旧客户端反向映射；未命中返回 false，损坏数据返回错误。
func (tracker *Tracker) DeviceByClient(ctx context.Context, clientID string) (tracking.Device, bool, error) {
	var device tracking.Device
	if clientID == "" {
		return device, false, nil
	}
	raw, err := tracker.Store.HgetCtx(ctx, tracking.ClientKey, clientID)
	if errors.Is(err, redis.Nil) || raw == "" {
		return device, false, nil
	}
	if err != nil {
		return device, false, err
	}
	if err := json.Unmarshal([]byte(raw), &device); err != nil {
		return tracking.Device{}, false, err
	}
	if device.ProductID == "" || device.DeviceName == "" {
		return tracking.Device{}, false, errors.New("client device mapping is incomplete")
	}
	return device, true, nil
}

// isDeviceMqttConnected 从旧设备哈希读取当前客户端映射。
func isDeviceMqttConnected(
	ctx context.Context,
	store Store,
	dev tracking.Device,
) (bool, error) {
	if store == nil || dev.ProductID == "" || dev.DeviceName == "" {
		return false, nil
	}
	raw, err := store.HgetCtx(ctx, tracking.DeviceKey, tracking.TopicKey(dev))
	if errors.Is(err, redis.Nil) || raw == "" {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	var connection tracking.Connection
	if err := json.Unmarshal([]byte(raw), &connection); err != nil {
		return false, err
	}
	return connection.ClientID != "" &&
		connection.ProductID == dev.ProductID &&
		connection.DeviceName == dev.DeviceName, nil
}

// syncDeviceMqttTracking 按旧分键顺序写入会话映射和活动时间。
func syncDeviceMqttTracking(ctx context.Context, store Store, do tracking.Connection, ts int64) error {
	if store == nil || do.ClientID == "" || do.ProductID == "" || do.DeviceName == "" {
		return nil
	}
	dev := tracking.Device{ProductID: do.ProductID, DeviceName: do.DeviceName}
	devKey := tracking.TopicKey(dev)

	currentRaw, err := store.HgetCtx(ctx, tracking.DeviceKey, devKey)
	if err != nil && !errors.Is(err, redis.Nil) {
		return err
	}
	if currentRaw != "" {
		var current tracking.Connection
		if json.Unmarshal([]byte(currentRaw), &current) == nil && current.ClientID != "" && current.ClientID != do.ClientID {
			if _, err = store.HdelCtx(ctx, tracking.ClientKey, current.ClientID); err != nil {
				return err
			}
		}
	}

	devRaw, err := json.Marshal(dev)
	if err != nil {
		return err
	}
	doRaw, err := json.Marshal(do)
	if err != nil {
		return err
	}
	if err = store.HsetCtx(ctx, tracking.DeviceKey, devKey, string(doRaw)); err != nil {
		return err
	}
	if err = store.HsetCtx(ctx, tracking.ClientKey, do.ClientID, string(devRaw)); err != nil {
		return err
	}
	activityKey := activityKey(dev.ProductID)
	_, err = store.ZaddCtx(ctx, activityKey, ts, devKey)
	if err != nil {
		return err
	}
	err = store.ExpireCtx(ctx, activityKey, int(tracking.ActivityTTL.Seconds()))
	return err
}

// clearDeviceMqttTrackingByClientID 避免迟到断连清除接替会话。
func clearDeviceMqttTrackingByClientID(ctx context.Context, store Store, clientID string) error {
	if store == nil || clientID == "" {
		return nil
	}
	devRaw, err := store.HgetCtx(ctx, tracking.ClientKey, clientID)
	if err != nil && !errors.Is(err, redis.Nil) {
		return err
	}
	if _, err = store.HdelCtx(ctx, tracking.ClientKey, clientID); err != nil {
		return err
	}
	if devRaw == "" {
		return nil
	}

	var dev tracking.Device
	if err = json.Unmarshal([]byte(devRaw), &dev); err != nil {
		return nil
	}
	devKey := tracking.TopicKey(dev)
	currentRaw, err := store.HgetCtx(ctx, tracking.DeviceKey, devKey)
	if err != nil && !errors.Is(err, redis.Nil) {
		return err
	}
	activityKey := activityKey(dev.ProductID)
	if currentRaw == "" {
		if _, err = store.ZremCtx(ctx, activityKey, devKey); err != nil {
			return err
		}
		return nil
	}

	var current tracking.Connection
	if err = json.Unmarshal([]byte(currentRaw), &current); err != nil || current.ClientID == "" {
		if _, err = store.HdelCtx(ctx, tracking.DeviceKey, devKey); err != nil {
			return err
		}
		_, err = store.ZremCtx(ctx, activityKey, devKey)
		return err
	}
	if current.ClientID != clientID {
		return nil
	}

	if _, err = store.HdelCtx(ctx, tracking.DeviceKey, devKey); err != nil {
		return err
	}
	_, err = store.ZremCtx(ctx, activityKey, devKey)
	return err
}

// pruneStaleDeviceMqttTracking 保留活动客户端并清理孤立设备与活动索引。
func pruneStaleDeviceMqttTracking(ctx context.Context, store Store, activeClientIDs map[string]struct{}) error {
	if store == nil {
		return nil
	}
	if activeClientIDs == nil {
		activeClientIDs = map[string]struct{}{}
	}

	clientMap, err := store.HgetallCtx(ctx, tracking.ClientKey)
	if err != nil {
		return err
	}
	for clientID := range clientMap {
		if _, ok := activeClientIDs[clientID]; ok {
			continue
		}
		if err = clearDeviceMqttTrackingByClientID(ctx, store, clientID); err != nil {
			return err
		}
	}

	deviceMap, err := store.HgetallCtx(ctx, tracking.DeviceKey)
	if err != nil {
		return err
	}
	for devKey, raw := range deviceMap {
		var current tracking.Connection
		if json.Unmarshal([]byte(raw), &current) != nil || current.ClientID == "" {
			if _, err = store.HdelCtx(ctx, tracking.DeviceKey, devKey); err != nil {
				return err
			}
			ps := strings.Split(devKey, ":")
			if len(ps) > 0 {
				if _, err = store.ZremCtx(ctx, activityKey(ps[0]), devKey); err != nil {
					return err
				}
			}
			continue
		}
		if _, ok := activeClientIDs[current.ClientID]; ok {
			continue
		}
		if _, err = store.HdelCtx(ctx, tracking.DeviceKey, devKey); err != nil {
			return err
		}
		ps := strings.Split(devKey, ":")
		if len(ps) > 0 {
			if _, err = store.ZremCtx(ctx, activityKey(ps[0]), devKey); err != nil {
				return err
			}
		}
	}

	// 清理孤儿 activity：从 deviceMap 提取 productID 集合，逐个产品 Key 查询
	pidSet := make(map[string]struct{})
	for devKey := range deviceMap {
		ps := strings.Split(devKey, ":")
		if len(ps) > 0 {
			pidSet[ps[0]] = struct{}{}
		}
	}
	for pid := range pidSet {
		activityKey := activityKey(pid)
		card, err := store.ZcardCtx(ctx, activityKey)
		if err != nil {
			return err
		}
		var activityKeys []string
		if card < activitySmallSetThreshold {
			activityKeys, err = store.ZrangeCtx(ctx, activityKey, 0, -1)
			if err != nil {
				return err
			}
		} else {
			minScore := time.Now().Add(-30 * 24 * time.Hour).UnixMilli()
			maxScore := time.Now().UnixMilli()
			for {
				pairs, err := store.ZrevrangebyscoreWithScoresAndLimitCtx(ctx, activityKey, minScore, maxScore, 0, activitySmallSetThreshold)
				if err != nil {
					return err
				}
				for _, p := range pairs {
					activityKeys = append(activityKeys, p.Key)
				}
				if len(pairs) < activitySmallSetThreshold {
					break
				}
				maxScore = int64(pairs[len(pairs)-1].Score) - 1
				if maxScore < minScore {
					break
				}
			}
		}
		for _, devKey := range activityKeys {
			if _, ok := deviceMap[devKey]; ok {
				continue
			}
			if _, err = store.ZremCtx(ctx, activityKey, devKey); err != nil {
				return err
			}
		}
	}
	return nil
}
