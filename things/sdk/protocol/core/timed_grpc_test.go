// 本文件验证公开 timedsvr RPC 适配器的任务注册、事件订阅和失败重试。
package core

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/core/service/timedsvr/pb/timed"
	"google.golang.org/grpc"
)

// fakeTimedGroupClient 记录公开 TaskGroupCreate 请求。
type fakeTimedGroupClient struct {
	timed.TaskGroupManageClient
	group *timed.TaskGroup
}

// TaskGroupCreate 保存组请求。
func (client *fakeTimedGroupClient) TaskGroupCreate(_ context.Context, group *timed.TaskGroup, _ ...grpc.CallOption) (*timed.TaskGroupWithID, error) {
	client.group = group
	return &timed.TaskGroupWithID{}, nil
}

// fakeTimedTaskClient 记录公开 TaskInfoCreate 请求并允许模拟失败。
type fakeTimedTaskClient struct {
	timed.TaskInfoManageClient
	task *timed.TaskInfo
	err  error
}

// TaskInfoCreate 保存任务请求。
func (client *fakeTimedTaskClient) TaskInfoCreate(_ context.Context, task *timed.TaskInfo, _ ...grpc.CallOption) (*timed.TaskInfoWithID, error) {
	client.task = task
	if client.err != nil {
		return nil, client.err
	}
	return &timed.TaskInfoWithID{}, nil
}

// fakeTimedBus 保存定时事件主题及回调。
type fakeTimedBus struct {
	topic         string
	subscriptions int
	handler       func(context.Context, []byte) error
}

// QueueSubscribe 保存订阅，用于投递本机事件。
func (bus *fakeTimedBus) QueueSubscribe(topic string, handler func(context.Context, []byte) error) error {
	bus.topic, bus.handler = topic, handler
	bus.subscriptions++
	return nil
}

// TestGRPCTimerScheduler 验证 RPC 合同字段、重复注册和定时事件执行。
func TestGRPCTimerScheduler(t *testing.T) {
	groupClient, taskClient, bus := &fakeTimedGroupClient{}, &fakeTimedTaskClient{err: errors.New("unavailable")}, &fakeTimedBus{}
	scheduler := &GRPCTimerScheduler{GroupClient: groupClient, TaskClient: taskClient, Bus: bus}
	var calls int
	timer, err := NewTimer(TimerOptions{ProtocolCode: "modbus", ProtocolName: "Modbus", ServerName: "gateway",
		GroupCode: "protocol-group", Scheduler: scheduler})
	if err != nil {
		t.Fatal(err)
	}
	if err := timer.RegisterHandler(func(context.Context, time.Time) error { calls++; return nil }); err != nil {
		t.Fatal(err)
	}
	if err := timer.Start(context.Background()); err == nil {
		t.Fatal("任务 RPC 失败未返回错误")
	}
	taskClient.err = nil
	if err := timer.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if bus.subscriptions != 1 || bus.topic != "server.timed.protocol-group.protocol-modbus-timer" {
		t.Fatalf("定时事件重复订阅或主题错误: %d %s", bus.subscriptions, bus.topic)
	}
	if groupClient.group.Code != "protocol-group" || taskClient.task.Type != 1 || taskClient.task.Status != 1 ||
		taskClient.task.Code != "protocol-modbus-timer" || taskClient.task.CronExpr != "@every 10m" || taskClient.task.Priority != 3 {
		t.Fatalf("平台任务字段错误: group=%+v task=%+v", groupClient.group, taskClient.task)
	}
	var params map[string]string
	if err := json.Unmarshal([]byte(taskClient.task.Params), &params); err != nil ||
		params["topic"] != "server.things.gateway.protocol.timer" {
		t.Fatalf("平台任务参数错误: %v %v", params, err)
	}
	if err := bus.handler(context.Background(), []byte(`{"params":{}}`)); err != nil || calls != 1 {
		t.Fatalf("定时事件处理错误: %v %d", err, calls)
	}
	if err := bus.handler(context.Background(), []byte(`{`)); err == nil {
		t.Fatal("无效定时事件未拒绝")
	}
}
