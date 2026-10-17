// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件组合协议服务、云配置快照与周期任务，提供独立云协议的完整启动和退出入口。
package cloud

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"gitee.com/unitedrhino/things/sdk/protocol/core"
)

// ConfigRefresher 完整读取平台配置后更新当前配置快照。
type ConfigRefresher[C any] interface {
	Refresh(context.Context, *ConfigManager[C]) error
}

// UpdateSubscriber 为当前协议订阅平台配置变更，返回取消订阅函数。
type UpdateSubscriber func(context.Context, string, func(context.Context) error) (func(), error)

// RuntimeOptions 注入云协议启动依赖；Timer 和 SubscribeUpdates 可按协议能力选择。
type RuntimeOptions[C any] struct {
	Base             *core.Protocol
	Manager          *ConfigManager[C]
	Source           ConfigRefresher[C]
	ProtocolCode     string
	Timer            *core.Timer
	SubscribeUpdates UpdateSubscriber
}

// Runtime 管理协议登记、首次配置、变更订阅、周期任务及对应资源释放。
type Runtime[C any] struct {
	mu          sync.Mutex
	options     RuntimeOptions[C]
	unsubscribe func()
	started     bool
	stopped     bool
}

// NewRuntime 检查云协议具备服务、配置管理器与完整配置来源。
func NewRuntime[C any](options RuntimeOptions[C]) (*Runtime[C], error) {
	if options.Base == nil || options.Manager == nil || options.Source == nil || options.ProtocolCode == "" {
		return nil, errors.New("cloud protocol, manager, source and code are required")
	}
	return &Runtime[C]{options: options}, nil
}

// Start 先注册协议，再载入全量配置，最后接入更新通知与周期任务；失败时释放已启动资源。
func (runtime *Runtime[C]) Start(ctx context.Context) error {
	if runtime == nil {
		return errors.New("cloud runtime is required")
	}
	runtime.mu.Lock()
	defer runtime.mu.Unlock()
	if runtime.started || runtime.stopped {
		return errors.New("cloud runtime already started or stopped")
	}
	options := runtime.options
	if err := options.Base.Start(ctx); err != nil {
		return fmt.Errorf("start protocol: %w", err)
	}
	cleanup := func() {
		runtime.stopped = true
		if runtime.unsubscribe != nil {
			runtime.unsubscribe()
			runtime.unsubscribe = nil
		}
		options.Base.Stop()
		if options.Timer != nil {
			options.Timer.Stop()
		}
		options.Manager.Close()
	}
	if err := options.Source.Refresh(ctx, options.Manager); err != nil {
		cleanup()
		return fmt.Errorf("load protocol config: %w", err)
	}
	if options.SubscribeUpdates != nil {
		topic := "server.things.dm.protocol." + options.ProtocolCode + ".update"
		unsubscribe, err := options.SubscribeUpdates(ctx, topic, func(updateCtx context.Context) error {
			return options.Source.Refresh(updateCtx, options.Manager)
		})
		if err != nil {
			cleanup()
			return fmt.Errorf("subscribe protocol config updates: %w", err)
		}
		if unsubscribe == nil {
			cleanup()
			return errors.New("protocol config update subscription must be cancelable")
		}
		runtime.unsubscribe = unsubscribe
	}
	if options.Timer != nil {
		if err := options.Timer.Start(ctx); err != nil {
			cleanup()
			return fmt.Errorf("start protocol timer: %w", err)
		}
	}
	runtime.started = true
	return nil
}

// Stop 取消变更订阅、停止协议服务并释放已生效配置；重复调用保持幂等。
func (runtime *Runtime[C]) Stop() {
	if runtime == nil {
		return
	}
	runtime.mu.Lock()
	defer runtime.mu.Unlock()
	if runtime.stopped {
		return
	}
	runtime.stopped = true
	if runtime.unsubscribe != nil {
		runtime.unsubscribe()
		runtime.unsubscribe = nil
	}
	runtime.options.Base.Stop()
	if runtime.options.Timer != nil {
		runtime.options.Timer.Stop()
	}
	runtime.options.Manager.Close()
}
