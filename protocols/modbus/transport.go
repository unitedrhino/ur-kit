// 本文件封装 Modbus TCP 单次请求的事务头校验、设备异常和取消处理。
package modbus

import (
	"context"
	"crypto/tls"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"time"
)

// exchange 发送一帧 PDU 并返回响应 PDU；调用方负责核对正常响应的业务字段。
func (client Client) exchange(ctx context.Context, requestPDU []byte) ([]byte, error) {
	if client.Address == "" {
		return nil, errors.New("modbus address is empty")
	}
	if len(requestPDU) < 1 || len(requestPDU) > 252 {
		return nil, errors.New("invalid modbus request length")
	}
	if client.Serial != nil {
		if client.TLS != nil || client.UDP || client.RTUOverTCP || client.RTUOverUDP {
			return nil, errors.New("modbus serial cannot combine with network transport or tls")
		}
		return client.exchangeSerial(ctx, requestPDU)
	}
	if client.UDP || client.RTUOverUDP {
		if client.TLS != nil || client.RTUOverTCP {
			return nil, errors.New("modbus udp cannot combine with tls or rtu over tcp")
		}
		return client.exchangeUDP(ctx, requestPDU)
	}
	timeout := client.Timeout
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	dialer := &net.Dialer{Timeout: timeout}
	var connection net.Conn
	var err error
	if client.TLS != nil {
		// TLS 拨号把握手也纳入请求上下文；克隆配置避免修改调用方共享对象。
		dialCtx, cancel := context.WithTimeout(ctx, timeout)
		connection, err = (&tls.Dialer{NetDialer: dialer, Config: client.TLS.Clone()}).DialContext(dialCtx, "tcp", client.Address)
		cancel()
	} else {
		connection, err = dialer.DialContext(ctx, "tcp", client.Address)
	}
	if err != nil {
		return nil, err
	}
	defer connection.Close()
	stop := context.AfterFunc(ctx, func() { _ = connection.Close() })
	defer stop()
	if deadline, ok := ctx.Deadline(); ok {
		_ = connection.SetDeadline(deadline)
	} else {
		_ = connection.SetDeadline(time.Now().Add(timeout))
	}
	if client.RTUOverTCP {
		return exchangeRTU(connection, client.UnitID, requestPDU)
	}
	request := make([]byte, 7+len(requestPDU))
	binary.BigEndian.PutUint16(request[0:2], 1)
	binary.BigEndian.PutUint16(request[4:6], uint16(len(requestPDU)+1))
	request[6] = client.UnitID
	copy(request[7:], requestPDU)
	if err := writeFrame(connection, request); err != nil {
		return nil, err
	}
	header := make([]byte, 7)
	if _, err := io.ReadFull(connection, header); err != nil {
		return nil, err
	}
	if binary.BigEndian.Uint16(header[0:2]) != 1 || binary.BigEndian.Uint16(header[2:4]) != 0 || header[6] != client.UnitID {
		return nil, errors.New("invalid modbus transaction, protocol or unit")
	}
	length := binary.BigEndian.Uint16(header[4:6])
	if length < 2 || length > 253 {
		return nil, errors.New("invalid modbus response length")
	}
	responsePDU := make([]byte, int(length)-1)
	if _, err := io.ReadFull(connection, responsePDU); err != nil {
		return nil, err
	}
	if responsePDU[0] == requestPDU[0]|0x80 {
		if len(responsePDU) != 2 {
			return nil, errors.New("invalid modbus exception response")
		}
		return nil, fmt.Errorf("modbus exception code %d", responsePDU[1])
	}
	return responsePDU, nil
}
