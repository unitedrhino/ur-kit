// 文件说明：用可控loader屏障复现失效后旧读重新填入缓存的代次竞态；合成连接事实不代表某次实际设备失败根因。
package caches

import (
	"context"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"gitee.com/unitedrhino/share/utils"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"github.com/zeromicro/go-zero/core/stores/kv"
)

// invalidationEvent 保存真实注册的远端失效回调，以同步触发验证本地代次而不声称跨节点强一致。
type invalidationEvent struct {
	callback FastFunc // Cache实际注册的失效回调。
}

// Subscribe 记录原回调；本夹具每个独立Cache只有一个失效订阅。
func (e *invalidationEvent) Subscribe(_ string, callback FastFunc) error {
	e.callback = callback
	return nil
}

// Publish 同步分发原键，检查通知不在发布锁内递归调用业务读取。
func (e *invalidationEvent) Publish(ctx context.Context, _ string, arg any) error {
	return e.callback(ctx, time.Now(), []byte(arg.(string)))
}

// invalidationDeviceFact 是合成离线/新连接快照；共享层不依赖Things设备类型或真实设备身份。
type invalidationDeviceFact struct {
	Online bool  `json:"online"` // 旧loader已读取的状态。
	Epoch  int64 `json:"epoch"`  // 原读与失效后的新代次。
}

// invalidationLoadResult 保存异步原读的实际结果，通道退出后才能结束测试。
type invalidationLoadResult struct {
	Fact *invalidationDeviceFact // 原读允许看到并发前快照，但不允许重新污染后继读取。
	Err  error                   // 原请求是否正常完成。
}

// invalidationBlockedWriteStore 在真实Redis异步回填处建立有限屏障，不改变写值或伪造缓存成功。
type invalidationBlockedWriteStore struct {
	kv.Store               // 其余方法使用真实miniredis适配。
	entered  chan struct{} // 原旧回填已进入Redis写。
	release  chan struct{} // 允许原写实际完成。
	done     chan struct{} // 原写实际退出。
	blocked  atomic.Bool   // 只阻塞第一条旧离线回填。
}

// SetnxExCtx 只阻塞指定合成旧值，并保留真实调用者取消和实际写入结果。
func (s *invalidationBlockedWriteStore) SetnxExCtx(ctx context.Context, key, value string, seconds int) (bool, error) {
	if strings.Contains(value, `"online":false`) && s.blocked.CompareAndSwap(false, true) {
		close(s.entered)
		defer close(s.done)
		select {
		case <-s.release:
		case <-ctx.Done():
			return false, ctx.Err()
		}
	}
	return s.Store.SetnxExCtx(ctx, key, value, seconds)
}

// TestCacheInvalidationDuringLoader 不依赖睡眠：旧DB读先捕获离线，原写已更新并失效，旧读随后返回不得污染缓存。
func TestCacheInvalidationDuringLoader(t *testing.T) {
	setupRaceStore(t)
	ctx, cancel := context.WithTimeout(t.Context(), 2*time.Second)
	defer cancel()
	entered := make(chan struct{})
	release := make(chan struct{})
	var releaseOnce sync.Once
	t.Cleanup(func() { releaseOnce.Do(func() { close(release) }) })
	var online atomic.Bool
	var calls atomic.Int64
	cached, err := NewCache(CacheConfig[invalidationDeviceFact, string]{
		KeyType: t.Name() + "-" + uuid.NewString(),
		GetData: func(ctx context.Context, _ string) (*invalidationDeviceFact, error) {
			old := !online.Load()
			fact := &invalidationDeviceFact{Online: !old, Epoch: 1}
			if !old {
				fact.Epoch = 2
			}
			if calls.Add(1) == 1 {
				close(entered) // 表示旧数据库快照已捕获，不是直到返回才读取新状态。
				select {
				case <-release:
				case <-ctx.Done():
					return nil, ctx.Err()
				}
			}
			return fact, nil
		},
	})
	require.NoError(t, err)
	finished := make(chan invalidationLoadResult, 1)
	utils.Go(ctx, func() {
		fact, err := cached.GetData(ctx, "synthetic-device")
		finished <- invalidationLoadResult{Fact: fact, Err: err}
	})
	select {
	case <-entered:
	case <-ctx.Done():
		t.Fatal("原loader没有进入受控屏障")
	}
	// 对应已提交在线写入之后的真实缓存失效，不用SetData伪造在线快照。
	online.Store(true)
	require.NoError(t, cached.SetData(ctx, "synthetic-device", nil))
	releaseOnce.Do(func() { close(release) })
	select {
	case result := <-finished:
		require.NoError(t, result.Err)
		require.NotNil(t, result.Fact)
	case <-ctx.Done():
		t.Fatal("原读取未在预算内实际退出")
	}
	current, err := cached.GetData(ctx, "synthetic-device")
	require.NoError(t, err)
	require.NotNil(t, current)
	require.True(t, current.Online, "失效已完成后，旧在途读不能将离线快照重新缓存")
	require.EqualValues(t, 2, current.Epoch, "后继读取必须使用新代次，不能沿旧loader结果继续授权判断")
}

// TestCacheInvalidationPaths 所有公开失效路径都必须阻止旧loader晚填充；nonNil只保存新Redis值，不伪造DB写。
func TestCacheInvalidationPaths(t *testing.T) {
	setupRaceStore(t)
	for _, mode := range []string{"nil", "nonNil", "remote", "predicate"} {
		t.Run(mode, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(t.Context(), 2*time.Second)
			defer cancel()
			entered, release := make(chan struct{}), make(chan struct{})
			var releaseOnce sync.Once
			t.Cleanup(func() { releaseOnce.Do(func() { close(release) }) })
			var online atomic.Bool
			var calls atomic.Int64
			event := &invalidationEvent{}
			cached, err := NewCache(CacheConfig[invalidationDeviceFact, string]{KeyType: t.Name() + "-" + uuid.NewString(), FastEvent: event,
				GetData: func(ctx context.Context, _ string) (*invalidationDeviceFact, error) {
					fact := &invalidationDeviceFact{Online: online.Load(), Epoch: 1}
					if fact.Online {
						fact.Epoch = 2
					}
					if calls.Add(1) == 1 {
						close(entered)
						select {
						case <-release:
						case <-ctx.Done():
							return nil, ctx.Err()
						}
					}
					return fact, nil
				}})
			require.NoError(t, err)
			finished := make(chan invalidationLoadResult, 1)
			utils.Go(ctx, func() {
				fact, err := cached.GetData(ctx, "device")
				finished <- invalidationLoadResult{Fact: fact, Err: err}
			})
			select {
			case <-entered:
			case <-ctx.Done():
				t.Fatal("原loader未进入")
			}
			online.Store(true)
			switch mode {
			case "nil":
				require.NoError(t, cached.SetData(ctx, "device", nil))
			case "nonNil":
				require.NoError(t, cached.SetData(ctx, "device", &invalidationDeviceFact{Online: true, Epoch: 2}))
			case "remote":
				require.NoError(t, event.callback(ctx, time.Now(), []byte(GenKeyStr("device"))))
			case "predicate":
				cached.DeleteByFunc(func(key string) bool { return key == GenKeyStr("device") })
			}
			releaseOnce.Do(func() { close(release) })
			select {
			case result := <-finished:
				require.NoError(t, result.Err)
			case <-ctx.Done():
				t.Fatal("原loader未退出")
			}
			current, err := cached.GetData(ctx, "device")
			require.NoError(t, err)
			require.NotNil(t, current)
			require.True(t, current.Online)
			require.EqualValues(t, 2, current.Epoch)
		})
	}
}

// TestCacheInvalidationCurrentReaderDoesNotJoinOldFlight 失效已完成的新读必须走新代次singleflight，不等旧连接loader退出。
func TestCacheInvalidationCurrentReaderDoesNotJoinOldFlight(t *testing.T) {
	setupRaceStore(t)
	ctx, cancel := context.WithTimeout(t.Context(), 2*time.Second)
	defer cancel()
	entered, release := make(chan struct{}), make(chan struct{})
	var releaseOnce sync.Once
	t.Cleanup(func() { releaseOnce.Do(func() { close(release) }) })
	var calls atomic.Int64
	cached, err := NewCache(CacheConfig[invalidationDeviceFact, string]{KeyType: t.Name() + "-" + uuid.NewString(), GetData: func(ctx context.Context, _ string) (*invalidationDeviceFact, error) {
		if calls.Add(1) == 1 {
			close(entered)
			select {
			case <-release:
				return &invalidationDeviceFact{Epoch: 1}, nil
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}
		return &invalidationDeviceFact{Online: true, Epoch: 2}, nil
	}})
	require.NoError(t, err)
	old := make(chan invalidationLoadResult, 1)
	utils.Go(ctx, func() {
		fact, err := cached.GetData(ctx, "device")
		old <- invalidationLoadResult{Fact: fact, Err: err}
	})
	select {
	case <-entered:
	case <-ctx.Done():
		t.Fatal("原loader未进入")
	}
	require.NoError(t, cached.SetData(ctx, "device", nil))
	newCtx, cancelNew := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancelNew()
	current := make(chan invalidationLoadResult, 1)
	utils.Go(ctx, func() {
		fact, err := cached.GetData(newCtx, "device")
		current <- invalidationLoadResult{Fact: fact, Err: err}
	})
	select {
	case result := <-current:
		require.NoError(t, result.Err)
		require.NotNil(t, result.Fact)
		require.True(t, result.Fact.Online)
		require.EqualValues(t, 2, result.Fact.Epoch)
	case <-newCtx.Done():
		releaseOnce.Do(func() { close(release) })
		select {
		case <-current:
		case <-ctx.Done():
		}
		t.Fatal("失效后的新读错误加入原仍受控阻塞的singleflight")
	}
	releaseOnce.Do(func() { close(release) })
	select {
	case <-old:
	case <-ctx.Done():
		t.Fatal("原loader未实际退出")
	}
}

// TestCacheInvalidationAsyncRedis 原异步写已经进入时，失效必须与其实际写串行收敛，不得失效返回后重新填入旧Redis值。
func TestCacheInvalidationAsyncRedis(t *testing.T) {
	setupRaceStore(t)
	originalStore := store
	wrapped := &invalidationBlockedWriteStore{Store: originalStore, entered: make(chan struct{}), release: make(chan struct{}), done: make(chan struct{})}
	store = wrapped
	var releaseOnce sync.Once
	t.Cleanup(func() { releaseOnce.Do(func() { close(wrapped.release) }); store = originalStore })
	ctx, cancel := context.WithTimeout(t.Context(), 2*time.Second)
	defer cancel()
	var online atomic.Bool
	cached, err := NewCache(CacheConfig[invalidationDeviceFact, string]{KeyType: t.Name() + "-" + uuid.NewString(), GetData: func(context.Context, string) (*invalidationDeviceFact, error) {
		fact := &invalidationDeviceFact{Online: online.Load(), Epoch: 1}
		if fact.Online {
			fact.Epoch = 2
		}
		return fact, nil
	}})
	require.NoError(t, err)
	_, err = cached.GetData(ctx, "device")
	require.NoError(t, err)
	select {
	case <-wrapped.entered:
	case <-ctx.Done():
		t.Fatal("原异步Redis写未进入")
	}
	online.Store(true)
	invalidated := make(chan error, 1)
	utils.Go(ctx, func() { invalidated <- cached.SetData(ctx, "device", nil) })
	// 既允许失效先返回，也允许合法发布锁等待已进入的原写；最后只断言实际收敛，不用睡眠假定执行次序。
	wait := time.NewTimer(100 * time.Millisecond)
	defer wait.Stop()
	var invalidationErr error
	var observed bool
	select {
	case invalidationErr = <-invalidated:
		observed = true
	case <-wait.C:
	}
	releaseOnce.Do(func() { close(wrapped.release) })
	select {
	case <-wrapped.done:
	case <-ctx.Done():
		t.Fatal("原Redis写未实际退出")
	}
	if !observed {
		select {
		case invalidationErr = <-invalidated:
		case <-ctx.Done():
			t.Fatal("失效未在预算内退出")
		}
	}
	require.NoError(t, invalidationErr)
	// 强制只读Redis层检查最终值，不通过SetData伪造新代次或删除Redis掩盖旧写。
	cached.cache.Delete(GenKeyStr("device"))
	current, err := cached.GetData(ctx, "device")
	require.NoError(t, err)
	require.NotNil(t, current)
	require.True(t, current.Online, "失效后旧异步写不能重新污染Redis后继读取")
	require.EqualValues(t, 2, current.Epoch)
}
