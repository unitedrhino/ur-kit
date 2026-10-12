// 文件说明：验证有界发布屏障不改变正常回源、缺失值及同步失效通知的兼容行为。
package caches

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	"gitee.com/unitedrhino/share/errors"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

// TestCachePublicationCompatibility 通过真实Redis适配验证通知锁外回读、空缓存及取消不会造成虚假成功。
func TestCachePublicationCompatibility(t *testing.T) {
	setupRaceStore(t)
	t.Run("notify-read", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(t.Context(), time.Second)
		defer cancel()
		event := &invalidationEvent{}
		var calls atomic.Int64
		cached, err := NewCache(CacheConfig[string, string]{KeyType: t.Name() + uuid.NewString(), FastEvent: event,
			GetData: func(context.Context, string) (*string, error) {
				calls.Add(1)
				value := "database-original"
				return &value, nil
			}})
		require.NoError(t, err)
		original, err := cached.GetData(ctx, "key")
		require.NoError(t, err)
		require.Equal(t, "database-original", *original)
		var notified atomic.Bool
		cached.AddNotifyCallback(func(ctx context.Context, _ []byte) {
			value, err := cached.GetData(ctx, "key")
			require.NoError(t, err)
			require.Equal(t, "explicit-update", *value)
			notified.Store(true)
		})
		updated := "explicit-update"
		require.NoError(t, cached.SetData(ctx, "key", &updated))
		require.True(t, notified.Load(), "同步通知必须能在发布锁外读取更新后的真实Redis值")
		require.EqualValues(t, 1, calls.Load())
	})
	t.Run("missing-no-loader", func(t *testing.T) {
		cached, err := NewCache(CacheConfig[string, string]{KeyType: t.Name() + uuid.NewString()})
		require.NoError(t, err)
		for range 2 {
			value, err := cached.GetData(t.Context(), "missing")
			require.Nil(t, value)
			require.True(t, errors.Cmp(err, errors.NotFind))
		}
	})
	t.Run("cancelled-set", func(t *testing.T) {
		cached, err := NewCache(CacheConfig[string, string]{KeyType: t.Name() + uuid.NewString()})
		require.NoError(t, err)
		ctx, cancel := context.WithCancel(t.Context())
		cancel()
		value := "must-not-write"
		require.ErrorIs(t, cached.SetData(ctx, "key", &value), context.Canceled)
		actual, err := store.GetCtx(t.Context(), cached.GenCacheKey("key"))
		require.NoError(t, err)
		require.Empty(t, actual)
	})
}
