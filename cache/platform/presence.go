// 本文件封装用户在线节点与 IM 已送达游标的业务缓存键、期限和单调更新约束。
package platform

import (
	"context"
	"errors"
	"fmt"
	"time"
)

// OnlineStore 是用户在线节点所需的最小有期限键值存储接口。
type OnlineStore interface {
	SetTTL(context.Context, string, string, time.Duration) error
	Delete(context.Context, string) error
}

// UserOnlineCache 保存用户在线节点，存储实现由接入服务注入。
type UserOnlineCache struct{ store OnlineStore }

// NewUserOnlineCache 创建用户在线缓存，要求调用方提供可信存储实现。
func NewUserOnlineCache(store OnlineStore) (*UserOnlineCache, error) {
	if store == nil {
		return nil, errors.New("online store is required")
	}
	return &UserOnlineCache{store: store}, nil
}

// SetUser 设置用户当前在线节点，20 秒过期时间与原平台在线缓存一致。
func (cache *UserOnlineCache) SetUser(ctx context.Context, tenantCode string, userID, nodeID int64) error {
	key, err := onlineKey(tenantCode, userID)
	if err != nil {
		return err
	}
	if nodeID <= 0 {
		return errors.New("node ID is required")
	}
	return cache.store.SetTTL(ctx, key, fmt.Sprint(nodeID), 20*time.Second)
}

// DeleteUser 删除指定企业用户的在线节点记录。
func (cache *UserOnlineCache) DeleteUser(ctx context.Context, tenantCode string, userID int64) error {
	key, err := onlineKey(tenantCode, userID)
	if err != nil {
		return err
	}
	return cache.store.Delete(ctx, key)
}

// onlineKey 使用企业编码与用户 ID 生成相互隔离的在线状态键。
func onlineKey(tenantCode string, userID int64) (string, error) {
	if tenantCode == "" || userID <= 0 {
		return "", errors.New("tenant code and user ID are required")
	}
	return fmt.Sprintf("user:online:%s:%d", tenantCode, userID), nil
}

// CursorStore 是 IM 游标需要的原子最大值操作与读操作接口。
// MaxTTL 必须由 Redis Lua 等原子操作实现，不能拆成 Get 与 Set。
type CursorStore interface {
	MaxTTL(context.Context, string, int64, time.Duration) (int64, error)
	GetInt64(context.Context, string) (int64, bool, error)
}

// DeliveredCursor 保存用户在会话中的最大已送达消息 ID。
type DeliveredCursor struct{ store CursorStore }

// NewDeliveredCursor 创建已送达游标缓存，存储由调用方注入。
func NewDeliveredCursor(store CursorStore) (*DeliveredCursor, error) {
	if store == nil {
		return nil, errors.New("cursor store is required")
	}
	return &DeliveredCursor{store: store}, nil
}

// Set 将游标单调推进到 msgID，7 天过期时间与原平台缓存一致。
func (cursor *DeliveredCursor) Set(ctx context.Context, tenantCode string, userID, conversationID, msgID int64) (int64, error) {
	key, err := deliveredKey(tenantCode, userID, conversationID)
	if err != nil {
		return 0, err
	}
	if msgID <= 0 {
		return 0, errors.New("message ID is required")
	}
	return cursor.store.MaxTTL(ctx, key, msgID, 7*24*time.Hour)
}

// Get 读取已送达最大游标，无记录时返回 0。
func (cursor *DeliveredCursor) Get(ctx context.Context, tenantCode string, userID, conversationID int64) (int64, error) {
	key, err := deliveredKey(tenantCode, userID, conversationID)
	if err != nil {
		return 0, err
	}
	value, found, err := cursor.store.GetInt64(ctx, key)
	if err != nil || !found {
		return 0, err
	}
	return value, nil
}

// deliveredKey 使用企业、用户和会话共同生成游标键。
func deliveredKey(tenantCode string, userID, conversationID int64) (string, error) {
	if tenantCode == "" || userID <= 0 || conversationID <= 0 {
		return "", errors.New("tenant code, user ID and conversation ID are required")
	}
	return fmt.Sprintf("im:delivered:%s:%d:%d", tenantCode, userID, conversationID), nil
}
