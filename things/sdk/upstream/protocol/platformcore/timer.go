// 本文件将 SaaS timedsvr RPC 与事件总线接入公开协议定时任务。
package platformcore

import (
	"context"
	"errors"
	"time"

	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/share/def"
	"github.com/unitedrhino/ur-kit/sdks/go/pb/core/service/timedsvr/pb/timed"
	publiccore "github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/zrpc"
)

// RegisterTimerHandler 登记协议周期任务，保持原任务代码、十分钟周期和平台主题。
func (protocol *CoreProtocol) RegisterTimerHandler(handle func(context.Context, time.Time) error) error {
	if handle == nil {
		return errors.New("protocol timer handler is required")
	}
	protocol.timerMu.Lock()
	defer protocol.timerMu.Unlock()
	if protocol.timer == nil {
		if !protocol.timedJobRpc.IsConfigured() {
			return errors.New("timedsvr RPC configuration is required")
		}
		client, err := zrpc.NewClient(protocol.timedJobRpc.Conf)
		if err != nil {
			return err
		}
		scheduler := &publiccore.GRPCTimerScheduler{
			GroupClient: timed.NewTaskGroupManageClient(client.Conn()),
			TaskClient:  timed.NewTaskInfoManageClient(client.Conn()),
			Bus:         platformBus{event: protocol.fastEvent},
		}
		timer, err := publiccore.NewTimer(publiccore.TimerOptions{
			ProtocolCode: protocol.Pi.Code,
			ProtocolName: protocol.Pi.Name,
			ServerName:   protocol.ServerName,
			GroupCode:    def.TimedUnitedRhinoQueueGroupCode,
			Scheduler:    scheduler,
		})
		if err != nil {
			return err
		}
		protocol.timer, protocol.timerClient = timer, client
	}
	if err := protocol.timer.RegisterHandler(func(ctx context.Context, at time.Time) error {
		return handle(ctxs.WithRoot(ctx), at)
	}); err != nil {
		return err
	}
	if protocol.timerStarted {
		return nil
	}
	ctx, cancel := context.WithTimeout(ctxs.WithRoot(context.Background()), 10*time.Second)
	defer cancel()
	if err := protocol.timer.Start(ctx); err != nil {
		return err
	}
	protocol.timerStarted = true
	return nil
}

// logTimerError 记录立即执行周期任务时的聚合失败。
func logTimerError(err error) { logx.Error(err) }
