// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件使用本机 gRPC 服务验证协议定时任务的本仓 protobuf 线路。
package core

import (
	"context"
	"gitee.com/unitedrhino/share/utils"
	"net"
	"sync"
	"testing"
	"time"

	"gitee.com/unitedrhino/core/service/timedsvr/pb/timed"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// timerGRPCServer 收取真实 gRPC 编解码后的任务组和任务请求。
type timerGRPCServer struct {
	timed.UnimplementedTaskGroupManageServer
	timed.UnimplementedTaskInfoManageServer
	mu    sync.Mutex
	group *timed.TaskGroup
	task  *timed.TaskInfo
}

// TaskGroupCreate 保存平台注册的任务组。
func (server *timerGRPCServer) TaskGroupCreate(_ context.Context, group *timed.TaskGroup) (*timed.TaskGroupWithID, error) {
	server.mu.Lock()
	server.group = group
	server.mu.Unlock()
	return &timed.TaskGroupWithID{}, nil
}

// TaskInfoCreate 保存平台注册的 Cron 任务。
func (server *timerGRPCServer) TaskInfoCreate(_ context.Context, task *timed.TaskInfo) (*timed.TaskInfoWithID, error) {
	server.mu.Lock()
	server.task = task
	server.mu.Unlock()
	return &timed.TaskInfoWithID{}, nil
}

// TestGRPCTimerSchedulerRoundTrip 验证任务通过生成的 gRPC 客户端到达本机服务。
func TestGRPCTimerSchedulerRoundTrip(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	server := grpc.NewServer()
	service := &timerGRPCServer{}
	timed.RegisterTaskGroupManageServer(server, service)
	timed.RegisterTaskInfoManageServer(server, service)
	utils.Go(context.Background(), func() { _ = server.Serve(listener) })
	t.Cleanup(server.Stop)
	connection, err := grpc.NewClient(listener.Addr().String(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = connection.Close() })
	bus := &fakeTimedBus{}
	scheduler := &GRPCTimerScheduler{GroupClient: timed.NewTaskGroupManageClient(connection),
		TaskClient: timed.NewTaskInfoManageClient(connection), Bus: bus}
	timer, err := NewTimer(TimerOptions{ProtocolCode: "modbus", ProtocolName: "Modbus", ServerName: "gateway",
		GroupCode: "protocol-group", Scheduler: scheduler})
	if err != nil {
		t.Fatal(err)
	}
	if err := timer.RegisterHandler(func(context.Context, time.Time) error { return nil }); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := timer.Start(ctx); err != nil {
		t.Fatal(err)
	}
	service.mu.Lock()
	defer service.mu.Unlock()
	if service.group == nil || service.group.Code != "protocol-group" || service.task == nil ||
		service.task.Code != "protocol-modbus-timer" || service.task.CronExpr != "@every 10m" {
		t.Fatalf("真实 gRPC 合同字段错误: group=%+v task=%+v", service.group, service.task)
	}
}
