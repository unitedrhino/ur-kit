// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件验证独立云协议的启动顺序、配置通知和失败时的资源释放。
package cloud

import (
	"context"
	"errors"
	"testing"
	"time"

	"gitee.com/unitedrhino/things/sdk/protocol/core"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
)

// runtimeRegistry 记录协议服务注册和首次心跳。
type runtimeRegistry struct{ registers, heartbeats int }

// Register 模拟平台注册。
func (registry *runtimeRegistry) Register(context.Context, *dm.ProtocolInfo) error {
	registry.registers++
	return nil
}

// Heartbeat 模拟协议服务心跳。
func (registry *runtimeRegistry) Heartbeat(context.Context, *dm.ProtocolService) error {
	registry.heartbeats++
	return nil
}

// runtimeBus 满足本仓协议服务需要的最小事件总线接口。
type runtimeBus struct{}

// Publish 在本测试中不触发设备消息。
func (runtimeBus) Publish(context.Context, string, []byte) error { return nil }

// QueueSubscribe 在本测试中不触发设备下行。
func (runtimeBus) QueueSubscribe(string, func(context.Context, []byte) error) error { return nil }

// runtimeConfigSource 根据当前版本完整替换配置，按开关模拟平台故障。
type runtimeConfigSource struct {
	version string
	fail    bool
	calls   int
}

// Refresh 将本次平台快照交给配置管理器。
func (source *runtimeConfigSource) Refresh(ctx context.Context, manager *ConfigManager[testCloudConfig]) error {
	source.calls++
	if source.fail {
		return errors.New("platform unavailable")
	}
	return manager.Reconcile(ctx, []testCloudConfig{{Key: source.version}})
}

// runtimeScheduler 保存平台调度任务的注册次数与失败状态。
type runtimeScheduler struct {
	calls int
	fail  bool
}

// Register 模拟平台周期任务注册。
func (scheduler *runtimeScheduler) Register(context.Context, core.TimerTask) error {
	scheduler.calls++
	if scheduler.fail {
		return errors.New("scheduler unavailable")
	}
	return nil
}

// newRuntimeParts 为独立测试创建协议服务和配置管理器。
func newRuntimeParts(t *testing.T, released *int) (*core.Protocol, *ConfigManager[testCloudConfig], *runtimeRegistry) {
	t.Helper()
	registry := &runtimeRegistry{}
	base, err := core.NewProtocol(core.Options{Info: &dm.ProtocolInfo{Code: "cloud-example"}, Registry: registry, Bus: runtimeBus{}, RegisterIP: "127.0.0.1", HeartbeatInterval: time.Hour})
	if err != nil {
		t.Fatal(err)
	}
	manager, err := NewConfigManager(Options[testCloudConfig]{
		Key:     func(config testCloudConfig) string { return config.Key },
		Equal:   func(left, right testCloudConfig) bool { return left == right },
		Prepare: func(_ context.Context, _ testCloudConfig) (func(), error) { return func() { *released++ }, nil },
	})
	if err != nil {
		t.Fatal(err)
	}
	return base, manager, registry
}

// TestCloudRuntimeLifecycle 验证完整配置先加载，通知更新再替换，并在退出时释放全部资源。
func TestCloudRuntimeLifecycle(t *testing.T) {
	released := 0
	base, manager, registry := newRuntimeParts(t, &released)
	source := &runtimeConfigSource{version: "first"}
	scheduler := &runtimeScheduler{}
	timer, err := core.NewTimer(core.TimerOptions{ProtocolCode: "cloud-example", ServerName: "runtime-test", GroupCode: "cloud-example", Scheduler: scheduler})
	if err != nil {
		t.Fatal(err)
	}
	if err := timer.RegisterHandler(func(context.Context, time.Time) error { return nil }); err != nil {
		t.Fatal(err)
	}
	var update func(context.Context) error
	unsubscribed := 0
	runtime, err := NewRuntime(RuntimeOptions[testCloudConfig]{Base: base, Manager: manager, Source: source, ProtocolCode: "cloud-example", Timer: timer,
		SubscribeUpdates: func(_ context.Context, topic string, handler func(context.Context) error) (func(), error) {
			if topic != "server.things.dm.protocol.cloud-example.update" {
				t.Fatalf("配置主题错误: %s", topic)
			}
			if _, exists := manager.Get("first"); !exists {
				t.Fatal("首次配置尚未生效就订阅更新")
			}
			update = handler
			return func() { unsubscribed++ }, nil
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := runtime.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if registry.registers != 1 || registry.heartbeats != 1 || scheduler.calls != 1 || source.calls != 1 {
		t.Fatalf("启动顺序或次数错误: registry=%+v scheduler=%+v source=%+v", registry, scheduler, source)
	}
	source.version = "second"
	if err := update(context.Background()); err != nil {
		t.Fatal(err)
	}
	if released != 1 {
		t.Fatalf("旧配置资源没有在替换后释放: %d", released)
	}
	if _, exists := manager.Get("second"); !exists {
		t.Fatal("通知更新没有提交新配置")
	}
	source.fail = true
	if err := update(context.Background()); err == nil {
		t.Fatal("平台故障被误判为配置更新成功")
	}
	if _, exists := manager.Get("second"); !exists {
		t.Fatal("通知失败清空了已生效配置")
	}
	runtime.Stop()
	runtime.Stop()
	if released != 2 || unsubscribed != 1 {
		t.Fatalf("退出释放或取消订阅次数错误: released=%d unsubscribed=%d", released, unsubscribed)
	}
	if err := runtime.Start(context.Background()); err == nil {
		t.Fatal("停止的云协议再次启动")
	}
}

// TestCloudRuntimeStartupFailure 验证配置和调度失败后停止协议并清理已准备资源。
func TestCloudRuntimeStartupFailure(t *testing.T) {
	for _, failure := range []string{"config", "timer"} {
		t.Run(failure, func(t *testing.T) {
			released := 0
			base, manager, _ := newRuntimeParts(t, &released)
			source := &runtimeConfigSource{version: "first", fail: failure == "config"}
			scheduler := &runtimeScheduler{fail: failure == "timer"}
			timer, err := core.NewTimer(core.TimerOptions{ProtocolCode: "cloud-example", ServerName: "runtime-test", GroupCode: "cloud-example", Scheduler: scheduler})
			if err != nil {
				t.Fatal(err)
			}
			if err := timer.RegisterHandler(func(context.Context, time.Time) error { return nil }); err != nil {
				t.Fatal(err)
			}
			unsubscribed := 0
			runtime, err := NewRuntime(RuntimeOptions[testCloudConfig]{Base: base, Manager: manager, Source: source, ProtocolCode: "cloud-example", Timer: timer,
				SubscribeUpdates: func(context.Context, string, func(context.Context) error) (func(), error) {
					return func() { unsubscribed++ }, nil
				},
			})
			if err != nil {
				t.Fatal(err)
			}
			if err := runtime.Start(context.Background()); err == nil {
				t.Fatal("启动依赖故障被接受")
			}
			runtime.Stop()
			if failure == "config" && (scheduler.calls != 0 || unsubscribed != 0 || released != 0) {
				t.Fatalf("初始配置失败后仍启动了后续组件: scheduler=%d unsubscribed=%d released=%d", scheduler.calls, unsubscribed, released)
			}
			if failure == "timer" && (scheduler.calls != 1 || unsubscribed != 1 || released != 1) {
				t.Fatalf("调度失败后未清理已生效组件: scheduler=%d unsubscribed=%d released=%d", scheduler.calls, unsubscribed, released)
			}
		})
	}
}
