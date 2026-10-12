// 本文件提供可在本地模拟验证的 Modbus TCP 保持寄存器读取样例。
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

// Client 保存 Modbus TCP 连接地址、单元号与拨号超时。
type Client struct {
	Address string
	UnitID  byte
	Timeout time.Duration
}

// ReadHoldingRegisters 读取指定起始地址与数量的保持寄存器，返回无符号 16 位数值。
func (client Client) ReadHoldingRegisters(ctx context.Context, address, quantity uint16) ([]uint16, error) {
	if quantity == 0 || quantity > 125 {
		return nil, errors.New("quantity must be in 1..125")
	}
	if client.Address == "" {
		return nil, errors.New("modbus address is empty")
	}
	timeout := client.Timeout
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	connection, err := (&net.Dialer{Timeout: timeout}).DialContext(ctx, "tcp", client.Address)
	if err != nil {
		return nil, err
	}
	defer connection.Close()
	if deadline, ok := ctx.Deadline(); ok {
		_ = connection.SetDeadline(deadline)
	} else {
		_ = connection.SetDeadline(time.Now().Add(timeout))
	}
	request := make([]byte, 12)
	binary.BigEndian.PutUint16(request[0:2], 1)
	binary.BigEndian.PutUint16(request[4:6], 6)
	request[6] = client.UnitID
	request[7] = 3
	binary.BigEndian.PutUint16(request[8:10], address)
	binary.BigEndian.PutUint16(request[10:12], quantity)
	if _, err := connection.Write(request); err != nil {
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
	if length < 3 || length > 253 {
		return nil, errors.New("invalid modbus response length")
	}
	pdu := make([]byte, int(length)-1)
	if _, err := io.ReadFull(connection, pdu); err != nil {
		return nil, err
	}
	if pdu[0] == 0x83 {
		return nil, fmt.Errorf("modbus exception code %d", pdu[1])
	}
	if pdu[0] != 3 || int(pdu[1]) != int(quantity)*2 || len(pdu) != 2+int(quantity)*2 {
		return nil, errors.New("invalid modbus register response")
	}
	values := make([]uint16, quantity)
	for index := range values {
		values[index] = binary.BigEndian.Uint16(pdu[2+index*2 : 4+index*2])
	}
	return values, nil
}
