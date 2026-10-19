// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件使用本仓 timedsvr protobuf 和事件总线适配协议周期任务。
package core

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"gitee.com/unitedrhino/core/service/timedsvr/pb/timed"
	"google.golang.org/grpc"
)

// TimerEventBus 由接入方实现定时任务事件订阅。
type TimerEventBus interface {
	QueueSubscribe(string, func(context.Context, []byte) error) error
}

// GRPCTimerScheduler 通过本仓 RPC 注册平台任务，并消费对应的定时事件。
type GRPCTimerScheduler struct {
	GroupClient timed.TaskGroupManageClient
	TaskClient  timed.TaskInfoManageClient
	Bus         TimerEventBus
	mu          sync.Mutex
	handlers    map[string]TimerHandler
	subscribed  map[string]bool
	subscribing map[string]bool
	running     map[string]bool
}

// Register 先订阅任务事件，再幂等创建组和 Cron 任务；RPC 失败后可重试。
func (scheduler *GRPCTimerScheduler) Register(ctx context.Context, task TimerTask) error {
	if scheduler == nil || scheduler.GroupClient == nil || scheduler.TaskClient == nil || scheduler.Bus == nil ||
		task.GroupCode == "" || task.Code == "" || task.CronExpr == "" || task.Handler == nil {
		return errors.New("timer RPC clients, event bus, task identity, cron and handler are required")
	}
	topic := fmt.Sprintf("server.timed.%s.%s", task.GroupCode, task.Code)
	scheduler.mu.Lock()
	if scheduler.handlers == nil {
		scheduler.handlers = make(map[string]TimerHandler)
		scheduler.subscribed = make(map[string]bool)
		scheduler.subscribing = make(map[string]bool)
		scheduler.running = make(map[string]bool)
	}
	if !scheduler.subscribed[topic] && scheduler.subscribing[topic] {
		scheduler.mu.Unlock()
		return fmt.Errorf("protocol timer %s subscription is in progress", topic)
	}
	scheduler.handlers[topic] = task.Handler
	if !scheduler.subscribed[topic] {
		scheduler.subscribing[topic] = true
		scheduler.mu.Unlock()
		err := scheduler.Bus.QueueSubscribe(topic, func(eventCtx context.Context, body []byte) error {
			return scheduler.consume(eventCtx, topic, body)
		})
		scheduler.mu.Lock()
		delete(scheduler.subscribing, topic)
		if err != nil {
			scheduler.mu.Unlock()
			return fmt.Errorf("subscribe protocol timer %s: %w", topic, err)
		}
		scheduler.subscribed[topic] = true
	}
	scheduler.mu.Unlock()
	if _, err := scheduler.GroupClient.TaskGroupCreate(ctx, &timed.TaskGroup{
		Code: task.GroupCode, Name: task.GroupCode,
	}, grpc.WaitForReady(true)); err != nil {
		return fmt.Errorf("create timer group %s: %w", task.GroupCode, err)
	}
	params, err := json.Marshal(map[string]string{"topic": task.Topic, "payload": ""})
	if err != nil {
		return err
	}
	if _, err := scheduler.TaskClient.TaskInfoCreate(ctx, &timed.TaskInfo{
		GroupCode: task.GroupCode, Code: task.Code, Name: task.Name,
		Type: 1, CronExpr: task.CronExpr, Params: string(params), Priority: task.Priority, Status: 1,
	}, grpc.WaitForReady(true)); err != nil {
		return fmt.Errorf("create timer task %s: %w", task.Code, err)
	}
	return nil
}

// consume 校验事件并串行执行同一任务的处理器；重叠触发会跳过。
func (scheduler *GRPCTimerScheduler) consume(ctx context.Context, topic string, body []byte) error {
	var event struct {
		Params map[string]string `json:"params"`
	}
	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("decode timer event %s: %w", topic, err)
	}
	scheduler.mu.Lock()
	handler := scheduler.handlers[topic]
	if handler == nil || scheduler.running[topic] {
		scheduler.mu.Unlock()
		return nil
	}
	scheduler.running[topic] = true
	scheduler.mu.Unlock()
	defer func() {
		scheduler.mu.Lock()
		delete(scheduler.running, topic)
		scheduler.mu.Unlock()
	}()
	return handler(ctx, time.Now())
}
