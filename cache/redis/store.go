// 本文件以 Redis 实现公共业务缓存的有期限键值与原子单调游标存储。
package redisstore

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// Store 适配 cache/platform 的 OnlineStore 和 CursorStore 接口。
type Store struct{ Client redis.UniversalClient }

// NewStore 创建 Redis 存储适配器，并拒绝空客户端。
func NewStore(client redis.UniversalClient) (*Store, error) {
	if client == nil {
		return nil, errors.New("redis client is required")
	}
	return &Store{Client: client}, nil
}

// SetTTL 设置在线状态等短期缓存键；TTL 必须为正。
func (store *Store) SetTTL(ctx context.Context, key, value string, ttl time.Duration) error {
	if key == "" || ttl <= 0 {
		return errors.New("key and positive TTL are required")
	}
	return store.Client.Set(ctx, key, value, ttl).Err()
}

// GetString 读取通用缓存 JSON，键不存在时返回 found=false。
func (store *Store) GetString(ctx context.Context, key string) (string, bool, error) {
	if key == "" {
		return "", false, errors.New("key is required")
	}
	value, err := store.Client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return "", false, nil
	}
	return value, err == nil, err
}

// SetNXTTL 仅在键不存在时设置通用缓存 JSON，防止旧回源覆盖较新的值。
func (store *Store) SetNXTTL(ctx context.Context, key, value string, ttl time.Duration) (bool, error) {
	if key == "" || ttl <= 0 {
		return false, errors.New("key and positive TTL are required")
	}
	return store.Client.SetNX(ctx, key, value, ttl).Result()
}

// Delete 删除指定缓存键。
func (store *Store) Delete(ctx context.Context, key string) error {
	if key == "" {
		return errors.New("key is required")
	}
	return store.Client.Del(ctx, key).Err()
}

// maxTTLScript 通过十进制字符串比较 64 位 ID，避免 Lua 浮点数丢失精度。
var maxTTLScript = redis.NewScript(`
local old = redis.call('GET', KEYS[1])
local incoming = ARGV[1]
local result = incoming
if old then
  if #old > #incoming or (#old == #incoming and old > incoming) then
    result = old
  end
end
redis.call('PSETEX', KEYS[1], ARGV[2], result)
return result
`)

// MaxTTL 原子地保存较大的消息 ID 并刷新过期时间，返回实际保留的 ID。
func (store *Store) MaxTTL(ctx context.Context, key string, value int64, ttl time.Duration) (int64, error) {
	if key == "" || value <= 0 || ttl <= 0 {
		return 0, errors.New("key, positive value and TTL are required")
	}
	millis := ttl.Milliseconds()
	if millis < 1 {
		millis = 1
	}
	result, err := maxTTLScript.Run(ctx, store.Client, []string{key}, strconv.FormatInt(value, 10), strconv.FormatInt(millis, 10)).Text()
	if err != nil {
		return 0, err
	}
	return strconv.ParseInt(result, 10, 64)
}

// GetInt64 读取消息游标；不存在时返回 found=false。
func (store *Store) GetInt64(ctx context.Context, key string) (int64, bool, error) {
	if key == "" {
		return 0, false, errors.New("key is required")
	}
	result, err := store.Client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	value, err := strconv.ParseInt(result, 10, 64)
	if err != nil {
		return 0, false, err
	}
	return value, true, nil
}
