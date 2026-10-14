// 本文件用可控 Redis 适配器验证并发 ACK 不会使已送达游标回退。
package caches_test

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"sync/atomic"
	"testing"

	corecaches "gitee.com/unitedrhino/core/share/caches"
	sharecaches "gitee.com/unitedrhino/share/caches"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

// controlledCursorStore 强制旧实现的两个读取先完成，再按大值、小值顺序写入。
type controlledCursorStore struct {
	kv.Store
	mu             sync.Mutex
	value          string
	readCount      atomic.Int32
	barrierEnabled atomic.Bool
	readGate       chan struct{}
	highWritten    chan struct{}
}

// GetCtx 在旧实现的读写间提供确定性交错；新实现最终读取时直接返回当前值。
func (store *controlledCursorStore) GetCtx(_ context.Context, _ string) (string, error) {
	if store.barrierEnabled.Load() {
		if store.readCount.Add(1) == 2 {
			close(store.readGate)
		}
		<-store.readGate
		return "", redis.Nil
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	if store.value == "" {
		return "", redis.Nil
	}
	return store.value, nil
}

// SetexCtx 模拟旧实现的非原子写入，使较小 ACK 必定最后落库。
func (store *controlledCursorStore) SetexCtx(_ context.Context, _ string, value string, _ int) error {
	if value == "100" {
		<-store.highWritten
	}
	store.mu.Lock()
	store.value = value
	store.mu.Unlock()
	if value == "200" {
		close(store.highWritten)
	}
	return nil
}

// EvalCtx 模拟单键 Redis 脚本的原子最大值，用于验证适配层选择该入口。
func (store *controlledCursorStore) EvalCtx(_ context.Context, _ string, _ string, args ...any) (any, error) {
	incoming, err := strconv.ParseInt(fmt.Sprint(args[0]), 10, 64)
	if err != nil {
		return nil, err
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	current, _ := strconv.ParseInt(store.value, 10, 64)
	if incoming > current {
		store.value = strconv.FormatInt(incoming, 10)
	}
	return store.value, nil
}

// TestDeliveredCursorConcurrentAck 验证乱序并发回执最终保持最大消息 ID。
func TestDeliveredCursorConcurrentAck(t *testing.T) {
	store := &controlledCursorStore{readGate: make(chan struct{}), highWritten: make(chan struct{})}
	store.barrierEnabled.Store(true)
	sharecaches.SetStoreForTest(store)
	var wait sync.WaitGroup
	for _, msgID := range []int64{200, 100} {
		wait.Add(1)
		go func(msgID int64) {
			defer wait.Done()
			if _, err := corecaches.SetIMDeliveredCursor(context.Background(), "demo", 42, 55, msgID); err != nil {
				t.Error(err)
			}
		}(msgID)
	}
	wait.Wait()
	store.barrierEnabled.Store(false)
	got, err := corecaches.GetIMDeliveredCursor(context.Background(), "demo", 42, 55)
	if err != nil || got != 200 {
		t.Fatalf("并发回执后游标 = %d, err=%v, want 200", got, err)
	}
}
