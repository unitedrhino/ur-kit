// 本文件验证缓存失效时旧回源结果不能覆盖后续写入。
package common

import (
	"context"
	"testing"
	"time"
)

// TestInvalidationBarrier 验证加载期间更新缓存不会被旧值覆盖。
func TestInvalidationBarrier(t *testing.T) {
	started := make(chan struct{})
	release := make(chan struct{})
	cache, err := NewCache[string, string](time.Minute, func(context.Context, string) (string, bool, error) {
		close(started)
		<-release
		return "old", true, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan struct{})
	go func() {
		_, _, _ = cache.Get(context.Background(), "key")
		close(done)
	}()
	<-started
	cache.Set("key", "new")
	close(release)
	<-done
	value, _, err := cache.Get(context.Background(), "key")
	if err != nil || value != "new" {
		t.Fatalf("旧回源污染缓存: value=%q err=%v", value, err)
	}
}
