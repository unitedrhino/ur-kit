// 本文件验证云协议配置更新的回滚、旧资源释放和并发读取。
package cloud

import (
	"context"
	"errors"
	"sync"
	"testing"
)

// TestConfigManagerReconcile 验证整批准备失败不改变现有配置，并按需释放资源。
func TestConfigManagerReconcile(t *testing.T) {
	type config struct{ key, value string }
	closed := map[string]int{}
	manager, err := NewConfigManager(Options[config]{
		Key:   func(item config) string { return item.key },
		Equal: func(left, right config) bool { return left == right },
		Prepare: func(_ context.Context, item config) (func(), error) {
			if item.value == "bad" {
				return nil, errors.New("cannot prepare")
			}
			return func() { closed[item.key+item.value]++ }, nil
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	if err := manager.Reconcile(ctx, []config{{"b", "1"}, {"a", "1"}}); err != nil {
		t.Fatal(err)
	}
	if err := manager.Reconcile(ctx, []config{{"a", "2"}, {"b", "bad"}}); err == nil {
		t.Fatal("配置准备失败仍被提交")
	}
	if item, ok := manager.Get("a"); !ok || item.value != "1" || closed["a2"] != 1 || closed["a1"] != 0 {
		t.Fatalf("准备失败未回滚或释放错误: %+v %v %+v", item, ok, closed)
	}
	if err := manager.Reconcile(ctx, []config{{"a", "2"}}); err != nil {
		t.Fatal(err)
	}
	if closed["a1"] != 1 || closed["b1"] != 1 || len(manager.List()) != 1 {
		t.Fatalf("配置替换没有释放旧资源: %+v", closed)
	}
	manager.Close()
	manager.Close()
	if closed["a2"] != 2 {
		t.Fatalf("当前资源未恰好释放一次: %+v", closed)
	}
	if err := manager.Reconcile(ctx, nil); err == nil {
		t.Fatal("关闭后仍允许更新")
	}
}

// TestConfigManagerReaders 验证更新期间并发查询可获得完整快照。
func TestConfigManagerReaders(t *testing.T) {
	manager, err := NewConfigManager(Options[int]{
		Key:     func(int) string { return "only" },
		Equal:   func(left, right int) bool { return left == right },
		Prepare: func(context.Context, int) (func(), error) { return func() {}, nil },
	})
	if err != nil {
		t.Fatal(err)
	}
	defer manager.Close()
	var group sync.WaitGroup
	for reader := 0; reader < 4; reader++ {
		group.Add(1)
		go func() {
			defer group.Done()
			for index := 0; index < 100; index++ {
				manager.Get("only")
				if len(manager.List()) > 1 {
					t.Error("单配置管理器返回多项")
				}
			}
		}()
	}
	for index := 0; index < 100; index++ {
		if err := manager.Reconcile(context.Background(), []int{index}); err != nil {
			t.Fatal(err)
		}
	}
	group.Wait()
}

// TestConfigManagerCanceled 验证准备完成后上下文取消仍会释放新资源。
func TestConfigManagerCanceled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	closed := 0
	manager, err := NewConfigManager(Options[string]{
		Key:   func(item string) string { return item },
		Equal: func(left, right string) bool { return left == right },
		Prepare: func(context.Context, string) (func(), error) {
			cancel()
			return func() { closed++ }, nil
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer manager.Close()
	if err := manager.Reconcile(ctx, []string{"new"}); !errors.Is(err, context.Canceled) {
		t.Fatalf("取消未阻止配置发布: %v", err)
	}
	if _, ok := manager.Get("new"); ok || closed != 1 {
		t.Fatalf("取消后配置已生效或资源未释放: closed=%d present=%v", closed, ok)
	}
}
