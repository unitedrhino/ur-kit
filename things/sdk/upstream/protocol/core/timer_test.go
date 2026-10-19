// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件验证协议定时任务的平台注册、重试和多处理器失败隔离。
package core

import (
	"context"
	"errors"
	"gitee.com/unitedrhino/share/utils"
	"reflect"
	"testing"
	"time"
)

// fakeTimerScheduler 保存注册请求并按需模拟平台错误。
type fakeTimerScheduler struct {
	task     TimerTask
	attempts int
	err      error
}

// Register 记录本次定时任务注册。
func (scheduler *fakeTimerScheduler) Register(_ context.Context, task TimerTask) error {
	scheduler.attempts++
	if scheduler.err != nil {
		return scheduler.err
	}
	scheduler.task = task
	return nil
}

// TestTimerRegistrationAndHandlers 验证唯一任务身份、失败重试及全部处理器执行。
func TestTimerRegistrationAndHandlers(t *testing.T) {
	scheduler := &fakeTimerScheduler{err: errors.New("timedsvr unavailable")}
	timer, err := NewTimer(TimerOptions{ProtocolCode: "modbus", ProtocolName: "Modbus", ServerName: "gateway",
		GroupCode: "protocol-group", Scheduler: scheduler})
	if err != nil {
		t.Fatal(err)
	}
	if err := timer.Start(context.Background()); err == nil {
		t.Fatal("没有处理器时允许注册周期任务")
	}
	var called []string
	triggered := time.UnixMilli(1760361600123)
	if err := timer.RegisterHandler(func(_ context.Context, at time.Time) error {
		if !at.Equal(triggered) {
			t.Fatalf("触发时间错误: %v", at)
		}
		called = append(called, "first")
		return errors.New("first failed")
	}); err != nil {
		t.Fatal(err)
	}
	if err := timer.RegisterHandler(func(context.Context, time.Time) error {
		called = append(called, "second")
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if err := timer.Start(context.Background()); err == nil || scheduler.attempts != 1 {
		t.Fatalf("平台错误未传递或注册次数错误: %v %d", err, scheduler.attempts)
	}
	scheduler.err = nil
	if err := timer.Start(context.Background()); err != nil || scheduler.attempts != 2 {
		t.Fatalf("注册失败后重试错误: %v %d", err, scheduler.attempts)
	}
	if err := timer.Start(context.Background()); err == nil || scheduler.attempts != 2 {
		t.Fatal("重复注册未拒绝")
	}
	task := scheduler.task
	if task.GroupCode != "protocol-group" || task.Code != "protocol-modbus-timer" ||
		task.CronExpr != "@every 10m" || task.Topic != "server.things.gateway.protocol.timer" ||
		task.Priority != 3 || task.Handler == nil {
		t.Fatalf("平台注册任务不兼容: %+v", task)
	}
	if err := task.Handler(context.Background(), triggered); err == nil || !reflect.DeepEqual(called, []string{"first", "second"}) {
		t.Fatalf("处理器错误隔离失败: %v %v", err, called)
	}
	if err := timer.RegisterHandler(func(context.Context, time.Time) error {
		called = append(called, "third")
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if err := task.Handler(context.Background(), triggered); err == nil || !reflect.DeepEqual(called[2:], []string{"first", "second", "third"}) {
		t.Fatalf("追加处理器未参与后续触发: %v %v", err, called)
	}
}

// TestTimerStop 等待运行中的处理器结束，并阻止平台残留触发再次访问协议资源。
func TestTimerStop(t *testing.T) {
	scheduler := &fakeTimerScheduler{}
	timer, err := NewTimer(TimerOptions{ProtocolCode: "cloud", ServerName: "gateway", GroupCode: "group", Scheduler: scheduler})
	if err != nil {
		t.Fatal(err)
	}
	entered := make(chan struct{})
	release := make(chan struct{})
	calls := 0
	if err := timer.RegisterHandler(func(context.Context, time.Time) error { calls++; close(entered); <-release; return nil }); err != nil {
		t.Fatal(err)
	}
	if err := timer.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	runDone := make(chan error, 1)
	utils.Go(context.Background(), func() { runDone <- scheduler.task.Handler(context.Background(), time.Now()) })
	<-entered
	stopDone := make(chan struct{})
	utils.Go(context.Background(), func() { timer.Stop(); close(stopDone) })
	select {
	case <-stopDone:
		t.Fatal("定时器退出未等待执行中的处理器")
	case <-time.After(20 * time.Millisecond):
	}
	close(release)
	if err := <-runDone; err != nil {
		t.Fatal(err)
	}
	<-stopDone
	timer.Stop()
	if err := scheduler.task.Handler(context.Background(), time.Now()); err != nil || calls != 1 {
		t.Fatalf("停止后仍运行处理器: calls=%d err=%v", calls, err)
	}
	if err := timer.RegisterHandler(func(context.Context, time.Time) error { return nil }); err == nil {
		t.Fatal("停止后仍可添加处理器")
	}
	if err := timer.Start(context.Background()); err == nil {
		t.Fatal("停止后仍可注册平台任务")
	}
}
