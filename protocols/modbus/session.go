// 本文件提供可复用的 Modbus 连接；同一设备的并发请求按帧串行执行。
package modbus

import (
	"context"
	"crypto/tls"
	"errors"
	"net"
	"sync"
	"time"

	"github.com/goburrow/serial"
)

// Session 保存一个已打开的网络或串口连接；关闭后不可重新使用。
type Session struct {
	mu          sync.Mutex
	client      Client
	network     net.Conn
	port        serial.Port
	transaction uint16
	closed      bool
}

// OpenSession 按客户端参数打开连接；返回的会话负责关闭连接。
func (client Client) OpenSession(ctx context.Context) (*Session, error) {
	if client.Address == "" {
		return nil, errors.New("modbus address is empty")
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if client.session != nil {
		return nil, errors.New("modbus client already belongs to a session")
	}
	if client.Serial != nil && (client.TLS != nil || client.UDP || client.RTUOverTCP || client.RTUOverUDP) {
		return nil, errors.New("modbus serial cannot combine with network transport or tls")
	}
	if (client.UDP || client.RTUOverUDP) && (client.TLS != nil || client.RTUOverTCP) {
		return nil, errors.New("modbus udp cannot combine with tls or rtu over tcp")
	}
	timeout := client.Timeout
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	connectionCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	session := &Session{client: client}
	if client.Serial != nil {
		poll := timeout
		if poll > 50*time.Millisecond {
			poll = 50 * time.Millisecond
		}
		port, err := serial.Open(&serial.Config{Address: client.Address, BaudRate: client.Serial.BaudRate, DataBits: client.Serial.DataBits, StopBits: client.Serial.StopBits, Parity: client.Serial.Parity, Timeout: poll})
		if err != nil {
			return nil, err
		}
		session.port = port
	} else {
		dialer := &net.Dialer{Timeout: timeout}
		var err error
		switch {
		case client.UDP || client.RTUOverUDP:
			session.network, err = dialer.DialContext(connectionCtx, "udp", client.Address)
		case client.TLS != nil:
			session.network, err = (&tls.Dialer{NetDialer: dialer, Config: client.TLS.Clone()}).DialContext(connectionCtx, "tcp", client.Address)
		default:
			session.network, err = dialer.DialContext(connectionCtx, "tcp", client.Address)
		}
		if err != nil {
			return nil, err
		}
	}
	if err := connectionCtx.Err(); err != nil {
		_ = session.Close()
		return nil, err
	}
	return session, nil
}

// Client 返回绑定本会话的客户端；所有读写方法共享同一连接和事务序列。
func (session *Session) Client() Client {
	client := session.client
	client.session = session
	return client
}

// Close 释放会话连接；重复调用安全。
func (session *Session) Close() error {
	session.mu.Lock()
	defer session.mu.Unlock()
	if session.closed {
		return nil
	}
	session.closed = true
	if session.port != nil {
		return session.port.Close()
	}
	return session.network.Close()
}

// exchange 在连接上执行单次请求，收到不完整或无效帧后关闭会话避免下次错帧。
func (session *Session) exchange(ctx context.Context, requestPDU []byte) ([]byte, error) {
	session.mu.Lock()
	defer session.mu.Unlock()
	if session.closed {
		return nil, net.ErrClosed
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	timeout := session.client.Timeout
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	deadline := time.Now().Add(timeout)
	if contextDeadline, ok := ctx.Deadline(); ok && contextDeadline.Before(deadline) {
		deadline = contextDeadline
	}
	var response []byte
	var err error
	if session.port != nil {
		response, err = exchangeRTU(serialExchange{port: session.port, ctx: ctx, deadline: deadline}, session.client.UnitID, requestPDU)
	} else {
		_ = session.network.SetDeadline(deadline)
		done := make(chan struct{})
		stop := context.AfterFunc(ctx, func() {
			_ = session.network.SetDeadline(time.Now())
			close(done)
		})
		if session.client.UDP || session.client.RTUOverUDP {
			response, err = session.client.exchangeUDPOnConn(session.network, requestPDU, session.transaction+1)
		} else if session.client.RTUOverTCP {
			response, err = exchangeRTU(session.network, session.client.UnitID, requestPDU)
		} else {
			response, err = exchangeMBAP(session.network, session.client.UnitID, requestPDU, session.transaction+1)
		}
		if !stop() {
			<-done
		}
		_ = session.network.SetDeadline(time.Time{})
	}
	if ctxErr := ctx.Err(); ctxErr != nil {
		err = ctxErr
	}
	if err != nil {
		session.closed = true
		if session.port != nil {
			_ = session.port.Close()
		} else {
			_ = session.network.Close()
		}
		return nil, err
	}
	session.transaction++
	return response, nil
}
