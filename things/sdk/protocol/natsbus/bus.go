// 本文件把独立协议的上下行与配置变更订阅接入标准 NATS 连接。
package natsbus

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
)

// Options 指定调用方持有的连接、下行队列组和回调超时。
type Options struct {
	Conn            *nats.Conn
	Queue           string
	CallbackTimeout time.Duration
	Logger          *slog.Logger
}

// Bus 复用调用方的 NATS 连接，并管理自己创建的订阅。
type Bus struct {
	options Options
	mu      sync.Mutex
	subs    map[*nats.Subscription]struct{}
	closed  bool
}

var _ core.Bus = (*Bus)(nil)

// New 创建协议事件总线；连接的关闭仍由调用方负责。
func New(options Options) (*Bus, error) {
	if options.Conn == nil || options.Conn.IsClosed() || options.Queue == "" {
		return nil, errors.New("NATS connection and queue group are required")
	}
	if options.CallbackTimeout <= 0 {
		options.CallbackTimeout = 30 * time.Second
	}
	if options.Logger == nil {
		options.Logger = slog.Default()
	}
	return &Bus{options: options, subs: make(map[*nats.Subscription]struct{})}, nil
}

// Publish 将设备事件发布到 NATS，返回值表示连接已接受消息。
func (bus *Bus) Publish(ctx context.Context, topic string, payload []byte) error {
	if bus == nil || topic == "" {
		return errors.New("NATS bus and topic are required")
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	bus.mu.Lock()
	defer bus.mu.Unlock()
	if bus.closed {
		return errors.New("NATS bus is closed")
	}
	return bus.options.Conn.Publish(topic, payload)
}

// QueueSubscribe 以指定队列组订阅协议下行；回调失败会记日志。
func (bus *Bus) QueueSubscribe(topic string, handler func(context.Context, []byte) error) error {
	if bus == nil || topic == "" || handler == nil {
		return errors.New("NATS bus, topic and handler are required")
	}
	bus.mu.Lock()
	defer bus.mu.Unlock()
	if bus.closed {
		return errors.New("NATS bus is closed")
	}
	sub, err := bus.options.Conn.QueueSubscribe(topic, bus.options.Queue, func(message *nats.Msg) {
		ctx, cancel := context.WithTimeout(context.Background(), bus.options.CallbackTimeout)
		defer cancel()
		if err := handler(ctx, message.Data); err != nil {
			bus.options.Logger.Error("protocol NATS downlink failed", "subject", message.Subject, "error", err)
		}
	})
	if err != nil {
		return err
	}
	bus.subs[sub] = struct{}{}
	return nil
}

// SubscribeUpdates 订阅云协议配置变更，并返回只撤销本次订阅的函数。
func (bus *Bus) SubscribeUpdates(ctx context.Context, topic string, handler func(context.Context) error) (func(), error) {
	if bus == nil || topic == "" || handler == nil {
		return nil, errors.New("NATS bus, topic and handler are required")
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	bus.mu.Lock()
	defer bus.mu.Unlock()
	if bus.closed {
		return nil, errors.New("NATS bus is closed")
	}
	sub, err := bus.options.Conn.Subscribe(topic, func(message *nats.Msg) {
		callbackCtx, cancel := context.WithTimeout(context.Background(), bus.options.CallbackTimeout)
		defer cancel()
		if err := handler(callbackCtx); err != nil {
			bus.options.Logger.Error("protocol NATS configuration refresh failed", "subject", message.Subject, "error", err)
		}
	})
	if err != nil {
		return nil, err
	}
	bus.subs[sub] = struct{}{}
	var once sync.Once
	return func() {
		once.Do(func() { bus.unsubscribe(sub) })
	}, nil
}

// unsubscribe 撤销当前总线持有的一项订阅。
func (bus *Bus) unsubscribe(sub *nats.Subscription) {
	bus.mu.Lock()
	_, exists := bus.subs[sub]
	delete(bus.subs, sub)
	bus.mu.Unlock()
	if exists {
		if err := sub.Unsubscribe(); err != nil {
			bus.options.Logger.Warn("protocol NATS unsubscribe failed", "error", err)
		}
	}
}

// Close 撤销本总线的全部订阅；调用方可继续使用同一 NATS 连接。
func (bus *Bus) Close() {
	if bus == nil {
		return
	}
	bus.mu.Lock()
	if bus.closed {
		bus.mu.Unlock()
		return
	}
	bus.closed = true
	subs := bus.subs
	bus.subs = make(map[*nats.Subscription]struct{})
	bus.mu.Unlock()
	for sub := range subs {
		if err := sub.Unsubscribe(); err != nil {
			bus.options.Logger.Warn("protocol NATS unsubscribe failed", "error", err)
		}
	}
}
