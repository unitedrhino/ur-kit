// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件提供独立协议服务的定时任务注册与多处理器执行，不依赖平台私有调度类型。
package core

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

// TimerHandler 在任务触发时执行协议数据同步；时间是本次触发时间。
type TimerHandler func(context.Context, time.Time) error

// TimerTask 描述提交给平台调度器的一个协议周期任务。
type TimerTask struct {
	GroupCode string
	Code      string
	Name      string
	CronExpr  string
	Topic     string
	Priority  int64
	Handler   TimerHandler
}

// TimerScheduler 由接入方适配平台 timedsvr 或其他持久化调度器。
type TimerScheduler interface {
	Register(context.Context, TimerTask) error
}

// TimerOptions 提供协议代码、服务名、任务组及调度器。
type TimerOptions struct {
	ProtocolCode string
	ProtocolName string
	ServerName   string
	GroupCode    string
	CronExpr     string
	Scheduler    TimerScheduler
}

// Timer 只注册一个平台任务，并在每次触发时执行全部已登记处理器。
type Timer struct {
	mu          sync.RWMutex
	active      sync.WaitGroup
	options     TimerOptions
	handlers    []TimerHandler
	registering bool
	started     bool
	stopped     bool
}

// NewTimer 校验平台任务标识；调度表达式默认为每十分钟一次。
func NewTimer(options TimerOptions) (*Timer, error) {
	if options.ProtocolCode == "" || options.ServerName == "" || options.GroupCode == "" || options.Scheduler == nil {
		return nil, errors.New("protocol code, server name, group code and scheduler are required")
	}
	if options.CronExpr == "" {
		options.CronExpr = "@every 10m"
	}
	return &Timer{options: options}, nil
}

// RegisterHandler 保存周期任务的处理器；可以在任务注册前或注册后追加。
func (timer *Timer) RegisterHandler(handler TimerHandler) error {
	if timer == nil || handler == nil {
		return errors.New("timer and handler are required")
	}
	timer.mu.Lock()
	if timer.stopped {
		timer.mu.Unlock()
		return errors.New("protocol timer is stopped")
	}
	timer.handlers = append(timer.handlers, handler)
	timer.mu.Unlock()
	return nil
}

// Start 向平台调度器注册唯一任务；注册失败可再次尝试。
func (timer *Timer) Start(ctx context.Context) error {
	if timer == nil {
		return errors.New("timer is required")
	}
	timer.mu.Lock()
	if timer.stopped || timer.started || timer.registering {
		timer.mu.Unlock()
		return errors.New("protocol timer already registered or registering")
	}
	if len(timer.handlers) == 0 {
		timer.mu.Unlock()
		return errors.New("protocol timer has no handlers")
	}
	timer.registering = true
	options := timer.options
	timer.mu.Unlock()
	task := TimerTask{
		GroupCode: options.GroupCode,
		Code:      "protocol-" + options.ProtocolCode + "-timer",
		Name:      "自定义协议-" + options.ProtocolName + "-定时任务-数据同步",
		CronExpr:  options.CronExpr,
		Topic:     "server.things." + options.ServerName + ".protocol.timer",
		Priority:  3,
		Handler:   timer.RunOnce,
	}
	err := options.Scheduler.Register(ctx, task)
	timer.mu.Lock()
	timer.registering = false
	stopped := timer.stopped
	if err == nil && !stopped {
		timer.started = true
	}
	timer.mu.Unlock()
	if err != nil {
		return fmt.Errorf("register protocol timer: %w", err)
	}
	if stopped {
		return errors.New("protocol timer stopped during registration")
	}
	return nil
}

// RunOnce 执行全部处理器，并汇总失败而不阻断后续处理器。
func (timer *Timer) RunOnce(ctx context.Context, triggeredAt time.Time) error {
	if timer == nil {
		return errors.New("timer is required")
	}
	timer.mu.Lock()
	if timer.stopped {
		timer.mu.Unlock()
		return nil
	}
	handlers := append([]TimerHandler(nil), timer.handlers...)
	timer.active.Add(1)
	timer.mu.Unlock()
	defer timer.active.Done()
	var failures []error
	for index, handler := range handlers {
		if err := handler(ctx, triggeredAt); err != nil {
			failures = append(failures, fmt.Errorf("protocol timer handler %d: %w", index, err))
		}
	}
	return errors.Join(failures...)
}

// Stop 阻止新触发并等待正在执行的处理器退出；平台已登记任务由接入方管理。
func (timer *Timer) Stop() {
	if timer == nil {
		return
	}
	timer.mu.Lock()
	timer.stopped = true
	timer.handlers = nil
	timer.mu.Unlock()
	timer.active.Wait()
}
