// Package caches 提供跨服务共享的缓存访问封装。
// imDelivered.go 负责 IM 应用层 ACK 的"已送达游标"缓存：
// 客户端收到推送后回执 im.ack，apisvr 调用 SetIMDeliveredCursor 记录该会话已送达的最大消息 ID，
// 仅当新 msgId 大于已存值时才更新（游标单调），缓存 7 天过期，不承担持久化职责（DB 为可信源）。
package caches

import (
	"context"
	"fmt"
	"strconv"

	"gitee.com/unitedrhino/share/caches"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// imDeliveredTTLSeconds 已送达游标缓存过期秒数（7 天）
const imDeliveredTTLSeconds = 7 * 24 * 60 * 60

// genIMDeliveredKey 构造已送达游标缓存 key：im:delivered:{tenantCode}:{userID}:{conversationID}
func genIMDeliveredKey(tenantCode string, userID, conversationID int64) string {
	return fmt.Sprintf("im:delivered:%s:%d:%d", tenantCode, userID, conversationID)
}

// SetIMDeliveredCursor 记录某用户在会话中的已送达最大消息 ID。
// 仅当 msgID 大于已存游标时更新；返回最终生效的游标值。
func SetIMDeliveredCursor(ctx context.Context, tenantCode string, userID, conversationID, msgID int64) (int64, error) {
	store := caches.GetStore()
	if store == nil {
		return 0, fmt.Errorf("caches store 未初始化")
	}
	key := genIMDeliveredKey(tenantCode, userID, conversationID)
	current, err := GetIMDeliveredCursor(ctx, tenantCode, userID, conversationID)
	if err != nil {
		return 0, err
	}
	if msgID <= current {
		return current, nil
	}
	if err := store.SetexCtx(ctx, key, strconv.FormatInt(msgID, 10), imDeliveredTTLSeconds); err != nil {
		return 0, err
	}
	return msgID, nil
}

// GetIMDeliveredCursor 读取某用户在会话中的已送达最大消息 ID；无记录返回 0。
func GetIMDeliveredCursor(ctx context.Context, tenantCode string, userID, conversationID int64) (int64, error) {
	store := caches.GetStore()
	if store == nil {
		return 0, fmt.Errorf("caches store 未初始化")
	}
	val, err := store.GetCtx(ctx, genIMDeliveredKey(tenantCode, userID, conversationID))
	if err != nil {
		// 键不存在属正常情况，视为游标 0；其余错误上抛
		if err == redis.Nil {
			return 0, nil
		}
		return 0, err
	}
	if val == "" {
		return 0, nil
	}
	n, err := strconv.ParseInt(val, 10, 64)
	if err != nil {
		return 0, err
	}
	return n, nil
}
