// 本文件提供与现有 Things 协议服务 Redis 键兼容的 MQTT 会话跟踪。
package tracking

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	// DeviceKey 是设备到 MQTT 会话的兼容哈希键。
	DeviceKey = "device:mqtt:device"
	// ClientKey 是 MQTT 客户端 ID 到设备的兼容哈希键。
	ClientKey = "device:mqtt:clientID"
	// ActivityPrefix 是每个产品的设备最后活动时间有序集合前缀。
	ActivityPrefix = "device:lastActivity"
	// ActivityTTL 保留最近三十天的设备活动时间。
	ActivityTTL = 30 * 24 * time.Hour
)

// Device 表示现有协议消息中的产品与设备组合标识。
type Device struct {
	ProductID  string `json:"productID"`
	DeviceName string `json:"deviceName"`
}

// Connection 保留现有 Things DevConn 的 JSON 字段，供新旧协议服务交叉读取。
type Connection struct {
	UserName   string `json:"username"`
	Timestamp  int64  `json:"timestamp"`
	Address    string `json:"addr"`
	ClientID   string `json:"clientID"`
	Reason     string `json:"reason"`
	Action     string `json:"action"`
	ProductID  string `json:"productID"`
	DeviceName string `json:"deviceName"`
}

// Tracker 将 MQTT 会话操作绑定到调用方提供的 Redis 客户端。
type Tracker struct{ Client redis.UniversalClient }

// NewTracker 创建会话跟踪器，拒绝空 Redis 客户端。
func NewTracker(client redis.UniversalClient) (*Tracker, error) {
	if client == nil {
		return nil, errors.New("redis client is required")
	}
	return &Tracker{Client: client}, nil
}

// TopicKey 返回与旧协议服务一致的设备主题键。
func TopicKey(device Device) string { return device.ProductID + ":" + device.DeviceName }

// activityKey 返回设备所属产品的活动集合键。
func activityKey(productID string) string { return ActivityPrefix + ":" + productID }

// syncScript 原子维护双向会话映射，避免新旧客户端交替连接时保留错误反向映射。
var syncScript = redis.NewScript(`
local old = redis.call('HGET', KEYS[1], ARGV[1])
if old then
  local ok, previous = pcall(cjson.decode, old)
  if ok and previous.clientID and previous.clientID ~= ARGV[2] then
    local reverse = redis.call('HGET', KEYS[2], previous.clientID)
    if reverse then
      local valid, device = pcall(cjson.decode, reverse)
      if valid and device.productID == ARGV[3] and device.deviceName == ARGV[4] then
        redis.call('HDEL', KEYS[2], previous.clientID)
      end
    end
  end
end
local other = redis.call('HGET', KEYS[2], ARGV[2])
if other then
  local ok, device = pcall(cjson.decode, other)
  if ok and device.productID and device.deviceName then
    local otherkey = device.productID .. ':' .. device.deviceName
    if otherkey ~= ARGV[1] then
      local current = redis.call('HGET', KEYS[1], otherkey)
      if current then
        local valid, connection = pcall(cjson.decode, current)
        if valid and connection.clientID == ARGV[2] then
          redis.call('HDEL', KEYS[1], otherkey)
          redis.call('ZREM', '` + ActivityPrefix + `:' .. device.productID, otherkey)
        end
      end
    end
  end
end
redis.call('HSET', KEYS[1], ARGV[1], ARGV[5])
redis.call('HSET', KEYS[2], ARGV[2], ARGV[6])
redis.call('ZADD', KEYS[3], ARGV[7], ARGV[1])
redis.call('EXPIRE', KEYS[3], ARGV[8])
return 1
`)

// Sync 将已验证的连接写入双向映射，并记录当前毫秒活动时间。
func (tracker *Tracker) Sync(ctx context.Context, connection Connection, received time.Time) error {
	if tracker == nil || tracker.Client == nil {
		return errors.New("redis client is required")
	}
	if connection.ProductID == "" || connection.DeviceName == "" || connection.ClientID == "" {
		return errors.New("product, device and client ID are required")
	}
	device := Device{ProductID: connection.ProductID, DeviceName: connection.DeviceName}
	connectionJSON, err := json.Marshal(connection)
	if err != nil {
		return err
	}
	deviceJSON, err := json.Marshal(device)
	if err != nil {
		return err
	}
	return syncScript.Run(ctx, tracker.Client, []string{DeviceKey, ClientKey, activityKey(device.ProductID)}, TopicKey(device), connection.ClientID, device.ProductID, device.DeviceName, connectionJSON, deviceJSON, received.UnixMilli(), int64(ActivityTTL.Seconds())).Err()
}

// clearScript 仅清除仍属于目标客户端的设备映射，保护已经接替的新会话。
var clearScript = redis.NewScript(`
local raw = redis.call('HGET', KEYS[2], ARGV[1])
if not raw then return 0 end
redis.call('HDEL', KEYS[2], ARGV[1])
local ok, device = pcall(cjson.decode, raw)
if not ok or not device.productID or not device.deviceName then return 1 end
local devicekey = device.productID .. ':' .. device.deviceName
local current = redis.call('HGET', KEYS[1], devicekey)
if current then
  local valid, connection = pcall(cjson.decode, current)
  if valid and connection.clientID == ARGV[1] then
    redis.call('HDEL', KEYS[1], devicekey)
    redis.call('ZREM', '` + ActivityPrefix + `:' .. device.productID, devicekey)
  end
end
return 1
`)

// ClearClient 解除客户端会话；旧客户端迟到的断连不会清除新会话。
func (tracker *Tracker) ClearClient(ctx context.Context, clientID string) error {
	if tracker == nil || tracker.Client == nil || clientID == "" {
		return errors.New("redis client and client ID are required")
	}
	return clearScript.Run(ctx, tracker.Client, []string{DeviceKey, ClientKey}, clientID).Err()
}

// IsConnected 从兼容设备映射读取当前 MQTT 会话。
func (tracker *Tracker) IsConnected(ctx context.Context, device Device) (bool, error) {
	if tracker == nil || tracker.Client == nil {
		return false, errors.New("redis client is required")
	}
	if device.ProductID == "" || device.DeviceName == "" {
		return false, nil
	}
	raw, err := tracker.Client.HGet(ctx, DeviceKey, TopicKey(device)).Result()
	if errors.Is(err, redis.Nil) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	var connection Connection
	if err := json.Unmarshal([]byte(raw), &connection); err != nil {
		return false, fmt.Errorf("invalid MQTT session: %w", err)
	}
	return connection.ClientID != "" && connection.ProductID == device.ProductID && connection.DeviceName == device.DeviceName, nil
}

// removeOrphanScript 仅当扫描时的会话未变化时删除孤立映射，保护并发重连。
var removeOrphanScript = redis.NewScript(`
if redis.call('HGET', KEYS[1], ARGV[1]) ~= ARGV[2] then return 0 end
redis.call('HDEL', KEYS[1], ARGV[1])
redis.call('ZREM', KEYS[2], ARGV[1])
return 1
`)

// Reconcile 清理不在活动客户端集合中的旧会话与孤立设备映射。
func (tracker *Tracker) Reconcile(ctx context.Context, active map[string]struct{}) error {
	if tracker == nil || tracker.Client == nil {
		return errors.New("redis client is required")
	}
	clients, err := tracker.Client.HKeys(ctx, ClientKey).Result()
	if err != nil {
		return err
	}
	for _, clientID := range clients {
		if _, ok := active[clientID]; !ok {
			if err := tracker.ClearClient(ctx, clientID); err != nil {
				return err
			}
		}
	}
	devices, err := tracker.Client.HGetAll(ctx, DeviceKey).Result()
	if err != nil {
		return err
	}
	for key, raw := range devices {
		var connection Connection
		if json.Unmarshal([]byte(raw), &connection) == nil && connection.ClientID != "" {
			if _, ok := active[connection.ClientID]; ok {
				continue
			}
		}
		productID, _, valid := strings.Cut(key, ":")
		if !valid || productID == "" {
			continue
		}
		if err := removeOrphanScript.Run(ctx, tracker.Client, []string{DeviceKey, activityKey(productID)}, key, raw).Err(); err != nil {
			return err
		}
	}
	return nil
}
