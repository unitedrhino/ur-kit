// 本文件实现 Modbus UDP 与 RTU over UDP 的单数据报交换及完整帧校验。
package modbus

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"time"
)

// exchangeUDP 用一份数据报承载完整请求和响应，拒绝截断或多余字节。
func (client Client) exchangeUDP(ctx context.Context, requestPDU []byte) ([]byte, error) {
	timeout := client.Timeout
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	connection, err := (&net.Dialer{Timeout: timeout}).DialContext(ctx, "udp", client.Address)
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
	return client.exchangeUDPOnConn(connection, requestPDU, 1)
}

// exchangeUDPOnConn 在已有 UDP 套接字上交换完整数据报，并核对事务号。
func (client Client) exchangeUDPOnConn(connection net.Conn, requestPDU []byte, transaction uint16) ([]byte, error) {
	var request []byte
	if client.RTUOverUDP {
		request = make([]byte, 1+len(requestPDU)+2)
		request[0] = client.UnitID
		copy(request[1:], requestPDU)
		binary.LittleEndian.PutUint16(request[len(request)-2:], rtuCRC(request[:len(request)-2]))
	} else {
		request = make([]byte, 7+len(requestPDU))
		binary.BigEndian.PutUint16(request[:2], transaction)
		binary.BigEndian.PutUint16(request[4:6], uint16(len(requestPDU)+1))
		request[6] = client.UnitID
		copy(request[7:], requestPDU)
	}
	written, err := connection.Write(request)
	if err != nil {
		return nil, err
	}
	if written != len(request) {
		return nil, io.ErrShortWrite
	}
	// Modbus 的最大合法响应占 260 字节，多留一字节识别超长数据报。
	frame := make([]byte, 261)
	length, err := connection.Read(frame)
	if err != nil {
		return nil, err
	}
	if length > 260 {
		return nil, errors.New("invalid modbus udp response length")
	}
	if client.RTUOverUDP {
		return parseRTUDatagram(frame[:length], client.UnitID, requestPDU[0])
	}
	return parseMBAPDatagramWithTransaction(frame[:length], client.UnitID, requestPDU[0], transaction)
}

// parseMBAPDatagram 校验完整数据报的事务、协议、长度、单元号和异常码。
func parseMBAPDatagram(frame []byte, unit, function byte) ([]byte, error) {
	return parseMBAPDatagramWithTransaction(frame, unit, function, 1)
}

// parseMBAPDatagramWithTransaction 核对会话每次请求的事务号。
func parseMBAPDatagramWithTransaction(frame []byte, unit, function byte, transaction uint16) ([]byte, error) {
	if len(frame) < 9 || binary.BigEndian.Uint16(frame[:2]) != transaction || binary.BigEndian.Uint16(frame[2:4]) != 0 || frame[6] != unit {
		return nil, errors.New("invalid modbus transaction, protocol or unit")
	}
	length := int(binary.BigEndian.Uint16(frame[4:6]))
	if length < 2 || length > 253 || len(frame) != 6+length {
		return nil, errors.New("invalid modbus response length")
	}
	response := frame[7:]
	if response[0] == function|0x80 {
		if len(response) != 2 {
			return nil, errors.New("invalid modbus exception response")
		}
		return nil, fmt.Errorf("modbus exception code %d", response[1])
	}
	if response[0] != function {
		return nil, errors.New("invalid modbus response function")
	}
	return response, nil
}

// parseRTUDatagram 校验完整 RTU 数据报的单元号、功能码、长度和 CRC。
func parseRTUDatagram(frame []byte, unit, function byte) ([]byte, error) {
	if len(frame) < 5 || frame[0] != unit {
		return nil, errors.New("invalid modbus rtu unit or length")
	}
	if binary.LittleEndian.Uint16(frame[len(frame)-2:]) != rtuCRC(frame[:len(frame)-2]) {
		return nil, errors.New("invalid modbus rtu crc")
	}
	if frame[1] == function|0x80 {
		if len(frame) != 5 {
			return nil, errors.New("invalid modbus rtu exception length")
		}
		return nil, fmt.Errorf("modbus exception code %d", frame[2])
	}
	if frame[1] != function {
		return nil, errors.New("invalid modbus rtu function")
	}
	switch function {
	case 1, 2, 3, 4:
		if frame[2] == 0 || frame[2] > 250 || len(frame) != 5+int(frame[2]) {
			return nil, errors.New("invalid modbus rtu byte count")
		}
	case 5, 6, 15, 16:
		if len(frame) != 8 {
			return nil, errors.New("invalid modbus rtu write length")
		}
	default:
		return nil, errors.New("unsupported modbus rtu function")
	}
	return frame[1 : len(frame)-2], nil
}
