// 本文件将 Core 的 IM 已送达游标入口接到 ur-kit 公共缓存，并适配现有 go-zero Redis 存储。
package caches

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"gitee.com/unitedrhino/share/caches"
	"github.com/unitedrhino/ur-kit/cache/platform"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// deliveredKVStore 把平台现有单键 EvalCtx 接到公共游标的原子存储接口。
type deliveredKVStore struct{ store kv.Store }

// deliveredMaxScript 以十进制字符串比较 int64，避免 Redis Lua 浮点数使大整数失精度。
const deliveredMaxScript = `
local old = redis.call('GET', KEYS[1])
local incoming = ARGV[1]
local result = incoming
if old and (#old > #incoming or (#old == #incoming and old > incoming)) then
  result = old
end
redis.call('SETEX', KEYS[1], ARGV[2], result)
return result
`

// MaxTTL 原子保存较大消息 ID 并刷新七天过期时间；脚本与游标键在同一 Redis 节点执行。
func (store deliveredKVStore) MaxTTL(ctx context.Context, key string, value int64, ttl time.Duration) (int64, error) {
	if key == "" || value <= 0 || ttl < time.Second {
		return 0, errors.New("游标键、消息 ID 或过期时间无效")
	}
	result, err := store.store.EvalCtx(ctx, deliveredMaxScript, key, strconv.FormatInt(value, 10), int64(ttl.Seconds()))
	if err != nil {
		return 0, err
	}
	return strconv.ParseInt(fmt.Sprint(result), 10, 64)
}

// GetInt64 读取当前最大游标；不存在时返回 found=false。
func (store deliveredKVStore) GetInt64(ctx context.Context, key string) (int64, bool, error) {
	value, err := store.store.GetCtx(ctx, key)
	if errors.Is(err, redis.Nil) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	if value == "" {
		return 0, false, nil
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	return parsed, err == nil, err
}

// deliveredCursor 以当前已初始化的共享 Redis 存储构造公共游标。
func deliveredCursor() (*platform.DeliveredCursor, error) {
	store := caches.GetStore()
	if store == nil {
		return nil, errors.New("caches store 未初始化")
	}
	return platform.NewDeliveredCursor(deliveredKVStore{store: store})
}

// SetIMDeliveredCursor 原子记录会话已送达最大消息 ID，并返回最终生效的游标。
func SetIMDeliveredCursor(ctx context.Context, tenantCode string, userID, conversationID, msgID int64) (int64, error) {
	cursor, err := deliveredCursor()
	if err != nil {
		return 0, err
	}
	return cursor.Set(ctx, tenantCode, userID, conversationID, msgID)
}

// GetIMDeliveredCursor 读取会话游标，缺失时返回 0。
func GetIMDeliveredCursor(ctx context.Context, tenantCode string, userID, conversationID int64) (int64, error) {
	cursor, err := deliveredCursor()
	if err != nil {
		return 0, err
	}
	return cursor.Get(ctx, tenantCode, userID, conversationID)
}
