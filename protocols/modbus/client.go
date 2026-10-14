// 本文件提供 Modbus TCP、UDP 与串口基础线圈和寄存器读写，供独立协议接入和本地设备模拟使用。
package modbus

import (
	"context"
	"crypto/tls"
	"encoding/binary"
	"errors"
	"io"
	"time"
)

// SerialConfig 保存物理串口的速率、数据位、停止位与校验位；零值采用 19200、8E1。
type SerialConfig struct {
	BaudRate int
	DataBits int
	StopBits int
	Parity   string
}

// Client 保存 Modbus TCP/UDP、RTU 网关或物理串口的连接参数。
type Client struct {
	// Address 为网络地址或物理串口设备路径。
	Address string
	UnitID  byte
	Timeout time.Duration
	// Serial 非空时经物理串口交换 RTU 帧，不与网络模式或 TLS 混用。
	Serial *SerialConfig
	// TLS 非空时校验证书并加密 TCP 连接；调用方应提供可信根证书或系统信任链。
	TLS *tls.Config
	// RTUOverTCP 使用带 CRC 的 RTU 帧经 TCP 传输；默认仍使用 MBAP 帧。
	RTUOverTCP bool
	// UDP 使用 MBAP 帧经 UDP 数据报传输，不与 TLS 或 RTUOverTCP 同时使用。
	UDP bool
	// RTUOverUDP 使用带 CRC 的 RTU 帧经 UDP 数据报传输，隐含 UDP 传输。
	RTUOverUDP bool
	// session 在复用连接时交由 Session 串行收发；由 OpenSession 创建。
	session *Session
}

// ReadHoldingRegisters 使用功能码 3 读取保持寄存器，返回设备的无符号 16 位字。
func (client Client) ReadHoldingRegisters(ctx context.Context, address, quantity uint16) ([]uint16, error) {
	return client.readRegisters(ctx, 3, address, quantity)
}

// ReadInputRegisters 使用功能码 4 读取只读输入寄存器，返回设备的无符号 16 位字。
func (client Client) ReadInputRegisters(ctx context.Context, address, quantity uint16) ([]uint16, error) {
	return client.readRegisters(ctx, 4, address, quantity)
}

// readRegisters 核对读取数量、设备字节数与功能码，再解析每个大端寄存器。
func (client Client) readRegisters(ctx context.Context, function byte, address, quantity uint16) ([]uint16, error) {
	if quantity == 0 || quantity > 125 || uint32(address)+uint32(quantity) > 65536 {
		return nil, errors.New("register range must contain 1..125 values within address space")
	}
	request := make([]byte, 5)
	request[0] = function
	binary.BigEndian.PutUint16(request[1:3], address)
	binary.BigEndian.PutUint16(request[3:5], quantity)
	response, err := client.exchange(ctx, request)
	if err != nil {
		return nil, err
	}
	if len(response) != 2+int(quantity)*2 || response[0] != function || int(response[1]) != int(quantity)*2 {
		return nil, errors.New("invalid modbus register response")
	}
	values := make([]uint16, quantity)
	for index := range values {
		values[index] = binary.BigEndian.Uint16(response[2+index*2:])
	}
	return values, nil
}

// ReadCoils 使用功能码 1 读取线圈；返回切片的顺序与地址递增顺序一致。
func (client Client) ReadCoils(ctx context.Context, address, quantity uint16) ([]bool, error) {
	return client.readBits(ctx, 1, address, quantity)
}

// ReadDiscreteInputs 使用功能码 2 读取只读离散输入。
func (client Client) ReadDiscreteInputs(ctx context.Context, address, quantity uint16) ([]bool, error) {
	return client.readBits(ctx, 2, address, quantity)
}

// readBits 按 Modbus 最低有效位优先的线缆顺序解析连续布尔点位。
func (client Client) readBits(ctx context.Context, function byte, address, quantity uint16) ([]bool, error) {
	if quantity == 0 || quantity > 2000 || uint32(address)+uint32(quantity) > 65536 {
		return nil, errors.New("bit range must contain 1..2000 values within address space")
	}
	request := make([]byte, 5)
	request[0] = function
	binary.BigEndian.PutUint16(request[1:3], address)
	binary.BigEndian.PutUint16(request[3:5], quantity)
	response, err := client.exchange(ctx, request)
	if err != nil {
		return nil, err
	}
	byteCount := (int(quantity) + 7) / 8
	if len(response) != 2+byteCount || response[0] != function || int(response[1]) != byteCount {
		return nil, errors.New("invalid modbus bit response")
	}
	values := make([]bool, quantity)
	for index := range values {
		values[index] = response[2+index/8]&(1<<uint(index%8)) != 0
	}
	return values, nil
}

// WriteSingleCoil 使用功能码 5 写入线圈，并核对设备回显的地址及 FF00/0000 值。
func (client Client) WriteSingleCoil(ctx context.Context, address uint16, value bool) error {
	word := uint16(0)
	if value {
		word = 0xff00
	}
	return client.writeSingle(ctx, 5, address, word)
}

// WriteMultipleCoils 使用功能码 15 批量写入连续线圈，并核对设备回显的起点和数量。
func (client Client) WriteMultipleCoils(ctx context.Context, address uint16, values []bool) error {
	if len(values) == 0 || len(values) > 1968 || uint32(address)+uint32(len(values)) > 65536 {
		return errors.New("coil range must contain 1..1968 values within address space")
	}
	byteCount := (len(values) + 7) / 8
	request := make([]byte, 6+byteCount)
	request[0] = 15
	binary.BigEndian.PutUint16(request[1:3], address)
	binary.BigEndian.PutUint16(request[3:5], uint16(len(values)))
	request[5] = byte(byteCount)
	for index, value := range values {
		if value {
			request[6+index/8] |= 1 << uint(index%8)
		}
	}
	response, err := client.exchange(ctx, request)
	if err != nil {
		return err
	}
	if len(response) != 5 || response[0] != 15 || binary.BigEndian.Uint16(response[1:3]) != address || binary.BigEndian.Uint16(response[3:5]) != uint16(len(values)) {
		return errors.New("invalid modbus coil write response")
	}
	return nil
}

// WriteSingleRegister 使用功能码 6 写入保持寄存器，并核对设备回显的地址和值。
func (client Client) WriteSingleRegister(ctx context.Context, address, value uint16) error {
	return client.writeSingle(ctx, 6, address, value)
}

// writeSingle 使用五字节 PDU 写入单个布尔或寄存器点位，拒绝不匹配的设备回显。
func (client Client) writeSingle(ctx context.Context, function byte, address, value uint16) error {
	request := make([]byte, 5)
	request[0] = function
	binary.BigEndian.PutUint16(request[1:3], address)
	binary.BigEndian.PutUint16(request[3:5], value)
	response, err := client.exchange(ctx, request)
	if err != nil {
		return err
	}
	if len(response) != len(request) || response[0] != function || binary.BigEndian.Uint16(response[1:3]) != address || binary.BigEndian.Uint16(response[3:5]) != value {
		return errors.New("invalid modbus write response")
	}
	return nil
}

// WriteMultipleRegisters 使用功能码 16 写入连续保持寄存器，并核对设备回显的起点和数量。
func (client Client) WriteMultipleRegisters(ctx context.Context, address uint16, values []uint16) error {
	if len(values) == 0 || len(values) > 123 || uint32(address)+uint32(len(values)) > 65536 {
		return errors.New("register range must contain 1..123 values within address space")
	}
	request := make([]byte, 6+len(values)*2)
	request[0] = 16
	binary.BigEndian.PutUint16(request[1:3], address)
	binary.BigEndian.PutUint16(request[3:5], uint16(len(values)))
	request[5] = byte(len(values) * 2)
	for index, value := range values {
		binary.BigEndian.PutUint16(request[6+index*2:], value)
	}
	response, err := client.exchange(ctx, request)
	if err != nil {
		return err
	}
	if len(response) != 5 || response[0] != 16 || binary.BigEndian.Uint16(response[1:3]) != address || binary.BigEndian.Uint16(response[3:5]) != uint16(len(values)) {
		return errors.New("invalid modbus write response")
	}
	return nil
}

// writeFrame 确保完整写出一帧；零字节短写返回明确错误。
func writeFrame(connection io.Writer, frame []byte) error {
	for len(frame) > 0 {
		written, err := connection.Write(frame)
		if err != nil {
			return err
		}
		if written == 0 {
			return io.ErrShortWrite
		}
		frame = frame[written:]
	}
	return nil
}
