package protocol

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"gitee.com/unitedrhino/share/caches"
	"gitee.com/unitedrhino/things/share/devices"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

type mqttTrackingOps interface {
	HgetCtx(ctx context.Context, key, field string) (string, error)
	HsetCtx(ctx context.Context, key, field, value string) error
	HdelCtx(ctx context.Context, key, field string) (bool, error)
	HgetallCtx(ctx context.Context, key string) (map[string]string, error)
	ZaddCtx(ctx context.Context, key string, score int64, value string) (bool, error)
	ZremCtx(ctx context.Context, key string, values ...any) (int, error)
	ZrangeCtx(ctx context.Context, key string, start, stop int64) ([]string, error)
	ZcardCtx(ctx context.Context, key string) (int, error)
	ZrevrangebyscoreWithScoresAndLimitCtx(ctx context.Context, key string, start, stop int64, page, size int) ([]redis.Pair, error)
	ExpireCtx(ctx context.Context, key string, seconds int) error
}

func SyncDeviceMqttTracking(ctx context.Context, do devices.DevConn) error {
	return syncDeviceMqttTracking(ctx, caches.GetStore(), do, time.Now().UnixMilli())
}

func ClearDeviceMqttTrackingByClientID(ctx context.Context, clientID string) error {
	return clearDeviceMqttTrackingByClientID(ctx, caches.GetStore(), clientID)
}

func ReconcileDeviceMqttTracking(ctx context.Context, activeClientIDs map[string]struct{}) error {
	return pruneStaleDeviceMqttTracking(ctx, caches.GetStore(), activeClientIDs)
}

// IsDeviceMqttConnected 根据 MQTT 当前会话映射判断设备是否真实连接。
func IsDeviceMqttConnected(ctx context.Context, dev devices.Core) (bool, error) {
	return isDeviceMqttConnected(ctx, caches.GetStore(), dev)
}

// isDeviceMqttConnected 从指定存储读取会话，便于行为下发和单元测试复用同一语义。
func isDeviceMqttConnected(
	ctx context.Context,
	store mqttTrackingOps,
	dev devices.Core,
) (bool, error) {
	if store == nil || dev.ProductID == "" || dev.DeviceName == "" {
		return false, nil
	}
	raw, err := store.HgetCtx(ctx, DeviceMqttDevice, GenDeviceTopicKey(dev))
	if errors.Is(err, redis.Nil) || raw == "" {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	var connection devices.DevConn
	if err := json.Unmarshal([]byte(raw), &connection); err != nil {
		return false, err
	}
	return connection.ClientID != "" &&
		connection.ProductID == dev.ProductID &&
		connection.DeviceName == dev.DeviceName, nil
}

func syncDeviceMqttTracking(ctx context.Context, store mqttTrackingOps, do devices.DevConn, ts int64) error {
	if store == nil || do.ClientID == "" || do.ProductID == "" || do.DeviceName == "" {
		return nil
	}
	dev := devices.Core{ProductID: do.ProductID, DeviceName: do.DeviceName}
	devKey := GenDeviceTopicKey(dev)

	currentRaw, err := store.HgetCtx(ctx, DeviceMqttDevice, devKey)
	if err != nil && !errors.Is(err, redis.Nil) {
		return err
	}
	if currentRaw != "" {
		var current devices.DevConn
		if json.Unmarshal([]byte(currentRaw), &current) == nil && current.ClientID != "" && current.ClientID != do.ClientID {
			if _, err = store.HdelCtx(ctx, DeviceMqttClientID, current.ClientID); err != nil {
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
	if err = store.HsetCtx(ctx, DeviceMqttDevice, devKey, string(doRaw)); err != nil {
		return err
	}
	if err = store.HsetCtx(ctx, DeviceMqttClientID, do.ClientID, string(devRaw)); err != nil {
		return err
	}
	activityKey := genDeviceLastActivityKey(dev.ProductID)
	_, err = store.ZaddCtx(ctx, activityKey, ts, devKey)
	if err != nil {
		return err
	}
	err = store.ExpireCtx(ctx, activityKey, ActivityKeyTTL)
	return err
}

func clearDeviceMqttTrackingByClientID(ctx context.Context, store mqttTrackingOps, clientID string) error {
	if store == nil || clientID == "" {
		return nil
	}
	devRaw, err := store.HgetCtx(ctx, DeviceMqttClientID, clientID)
	if err != nil && !errors.Is(err, redis.Nil) {
		return err
	}
	if _, err = store.HdelCtx(ctx, DeviceMqttClientID, clientID); err != nil {
		return err
	}
	if devRaw == "" {
		return nil
	}

	var dev devices.Core
	if err = json.Unmarshal([]byte(devRaw), &dev); err != nil {
		return nil
	}
	devKey := GenDeviceTopicKey(dev)
	currentRaw, err := store.HgetCtx(ctx, DeviceMqttDevice, devKey)
	if err != nil && !errors.Is(err, redis.Nil) {
		return err
	}
	activityKey := genDeviceLastActivityKey(dev.ProductID)
	if currentRaw == "" {
		if _, err = store.ZremCtx(ctx, activityKey, devKey); err != nil {
			return err
		}
		return nil
	}

	var current devices.DevConn
	if err = json.Unmarshal([]byte(currentRaw), &current); err != nil || current.ClientID == "" {
		if _, err = store.HdelCtx(ctx, DeviceMqttDevice, devKey); err != nil {
			return err
		}
		_, err = store.ZremCtx(ctx, activityKey, devKey)
		return err
	}
	if current.ClientID != clientID {
		return nil
	}

	if _, err = store.HdelCtx(ctx, DeviceMqttDevice, devKey); err != nil {
		return err
	}
	_, err = store.ZremCtx(ctx, activityKey, devKey)
	return err
}

func pruneStaleDeviceMqttTracking(ctx context.Context, store mqttTrackingOps, activeClientIDs map[string]struct{}) error {
	if store == nil {
		return nil
	}
	if activeClientIDs == nil {
		activeClientIDs = map[string]struct{}{}
	}

	clientMap, err := store.HgetallCtx(ctx, DeviceMqttClientID)
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

	deviceMap, err := store.HgetallCtx(ctx, DeviceMqttDevice)
	if err != nil {
		return err
	}
	for devKey, raw := range deviceMap {
		var current devices.DevConn
		if json.Unmarshal([]byte(raw), &current) != nil || current.ClientID == "" {
			if _, err = store.HdelCtx(ctx, DeviceMqttDevice, devKey); err != nil {
				return err
			}
			ps := strings.Split(devKey, ":")
			if len(ps) > 0 {
				if _, err = store.ZremCtx(ctx, genDeviceLastActivityKey(ps[0]), devKey); err != nil {
					return err
				}
			}
			continue
		}
		if _, ok := activeClientIDs[current.ClientID]; ok {
			continue
		}
		if _, err = store.HdelCtx(ctx, DeviceMqttDevice, devKey); err != nil {
			return err
		}
		ps := strings.Split(devKey, ":")
		if len(ps) > 0 {
			if _, err = store.ZremCtx(ctx, genDeviceLastActivityKey(ps[0]), devKey); err != nil {
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
		activityKey := genDeviceLastActivityKey(pid)
		card, err := store.ZcardCtx(ctx, activityKey)
		if err != nil {
			return err
		}
		var activityKeys []string
		if card < ActivitySmallSetThreshold {
			activityKeys, err = store.ZrangeCtx(ctx, activityKey, 0, -1)
			if err != nil {
				return err
			}
		} else {
			minScore := time.Now().Add(-30 * 24 * time.Hour).UnixMilli()
			maxScore := time.Now().UnixMilli()
			for {
				pairs, err := store.ZrevrangebyscoreWithScoresAndLimitCtx(ctx, activityKey, minScore, maxScore, 0, ActivitySmallSetThreshold)
				if err != nil {
					return err
				}
				for _, p := range pairs {
					activityKeys = append(activityKeys, p.Key)
				}
				if len(pairs) < ActivitySmallSetThreshold {
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
