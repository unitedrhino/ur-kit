// 本文件提供仅供本地演示与集成测试使用的 Modbus TCP 线圈和寄存器模拟器。
package modbus

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"net"
	"sync"
)

// Simulator 保存本地模拟设备的四类点位；不同连接可并发访问。
type Simulator struct {
	mu             sync.Mutex
	registers      []uint16
	inputRegisters []uint16
	coils          []bool
	discreteInputs []bool
}

// NewSimulator 根据初始值创建模拟设备；输入切片之后的修改不会影响设备。
func NewSimulator(initial []uint16) *Simulator {
	return &Simulator{registers: append([]uint16(nil), initial...)}
}

// SetInputRegisters 替换只读输入寄存器快照；后续修改输入切片不会影响设备。
func (simulator *Simulator) SetInputRegisters(values []uint16) {
	simulator.mu.Lock()
	defer simulator.mu.Unlock()
	simulator.inputRegisters = append([]uint16(nil), values...)
}

// SetCoils 替换可读写线圈快照；后续修改输入切片不会影响设备。
func (simulator *Simulator) SetCoils(values []bool) {
	simulator.mu.Lock()
	defer simulator.mu.Unlock()
	simulator.coils = append([]bool(nil), values...)
}

// SetDiscreteInputs 替换只读离散输入快照；后续修改输入切片不会影响设备。
func (simulator *Simulator) SetDiscreteInputs(values []bool) {
	simulator.mu.Lock()
	defer simulator.mu.Unlock()
	simulator.discreteInputs = append([]bool(nil), values...)
}

// Serve 在指定监听器上响应功能码 1～6、15、16；上下文取消后关闭监听器并等待连接退出。
func (simulator *Simulator) Serve(ctx context.Context, listener net.Listener) error {
	if simulator == nil || listener == nil {
		return errors.New("modbus simulator and listener are required")
	}
	serveCtx, cancel := context.WithCancel(ctx)
	stop := context.AfterFunc(serveCtx, func() { _ = listener.Close() })
	var handlers sync.WaitGroup
	defer handlers.Wait()
	defer cancel()
	defer stop()
	defer listener.Close()
	for {
		connection, err := listener.Accept()
		if err != nil {
			if serveCtx.Err() != nil {
				return nil
			}
			return err
		}
		handlers.Add(1)
		go func() {
			defer handlers.Done()
			defer connection.Close()
			stopConnection := context.AfterFunc(serveCtx, func() { _ = connection.Close() })
			defer stopConnection()
			simulator.serveConnection(connection)
		}()
	}
}

// serveConnection 逐帧读取 MBAP 和 PDU，并保留请求事务号及单元号。
func (simulator *Simulator) serveConnection(connection net.Conn) {
	for {
		header := make([]byte, 7)
		if _, err := io.ReadFull(connection, header); err != nil {
			return
		}
		length := binary.BigEndian.Uint16(header[4:6])
		if binary.BigEndian.Uint16(header[2:4]) != 0 || length < 2 || length > 253 {
			return
		}
		request := make([]byte, int(length)-1)
		if _, err := io.ReadFull(connection, request); err != nil {
			return
		}
		response := simulator.respond(request)
		binary.BigEndian.PutUint16(header[4:6], uint16(len(response)+1))
		if err := writeFrame(connection, append(header, response...)); err != nil {
			return
		}
	}
}

// respond 按 Modbus 异常码反馈无效功能、地址或数量，避免越界访问设备点位。
func (simulator *Simulator) respond(request []byte) []byte {
	if len(request) == 0 {
		return []byte{0x80, 3}
	}
	function := request[0]
	if function < 1 || function > 6 && function != 15 && function != 16 {
		return []byte{function | 0x80, 1}
	}
	if function == 15 {
		if len(request) < 6 {
			return []byte{0x8f, 3}
		}
		address := int(binary.BigEndian.Uint16(request[1:3]))
		quantity := int(binary.BigEndian.Uint16(request[3:5]))
		byteCount := (quantity + 7) / 8
		if quantity < 1 || quantity > 1968 || int(request[5]) != byteCount || len(request) != 6+byteCount {
			return []byte{0x8f, 3}
		}
		simulator.mu.Lock()
		defer simulator.mu.Unlock()
		if address >= len(simulator.coils) || quantity > len(simulator.coils)-address {
			return []byte{0x8f, 2}
		}
		for index := 0; index < quantity; index++ {
			simulator.coils[address+index] = request[6+index/8]&(1<<uint(index%8)) != 0
		}
		return append([]byte(nil), request[:5]...)
	}
	if function == 16 {
		if len(request) < 6 {
			return []byte{0x90, 3}
		}
		address := int(binary.BigEndian.Uint16(request[1:3]))
		quantity := int(binary.BigEndian.Uint16(request[3:5]))
		if quantity < 1 || quantity > 123 || int(request[5]) != quantity*2 || len(request) != 6+quantity*2 {
			return []byte{0x90, 3}
		}
		simulator.mu.Lock()
		defer simulator.mu.Unlock()
		if address >= len(simulator.registers) || quantity > len(simulator.registers)-address {
			return []byte{0x90, 2}
		}
		for index := 0; index < quantity; index++ {
			simulator.registers[address+index] = binary.BigEndian.Uint16(request[6+index*2:])
		}
		return append([]byte(nil), request[:5]...)
	}
	if len(request) != 5 {
		return []byte{function | 0x80, 3}
	}
	address := int(binary.BigEndian.Uint16(request[1:3]))
	value := int(binary.BigEndian.Uint16(request[3:5]))
	simulator.mu.Lock()
	defer simulator.mu.Unlock()
	switch function {
	case 1, 2:
		values := simulator.coils
		if function == 2 {
			values = simulator.discreteInputs
		}
		if value < 1 || value > 2000 {
			return []byte{function | 0x80, 3}
		}
		if address >= len(values) || value > len(values)-address {
			return []byte{function | 0x80, 2}
		}
		byteCount := (value + 7) / 8
		response := make([]byte, 2+byteCount)
		response[0], response[1] = function, byte(byteCount)
		for index := 0; index < value; index++ {
			if values[address+index] {
				response[2+index/8] |= 1 << uint(index%8)
			}
		}
		return response
	case 3, 4:
		values := simulator.registers
		if function == 4 {
			values = simulator.inputRegisters
		}
		if value < 1 || value > 125 {
			return []byte{function | 0x80, 3}
		}
		if address >= len(values) || value > len(values)-address {
			return []byte{function | 0x80, 2}
		}
		response := make([]byte, 2+value*2)
		response[0], response[1] = function, byte(value*2)
		for index := 0; index < value; index++ {
			binary.BigEndian.PutUint16(response[2+index*2:], values[address+index])
		}
		return response
	case 5:
		if value != 0 && value != 0xff00 {
			return []byte{0x85, 3}
		}
		if address >= len(simulator.coils) {
			return []byte{0x85, 2}
		}
		simulator.coils[address] = value == 0xff00
		return append([]byte(nil), request...)
	default:
		if address >= len(simulator.registers) {
			return []byte{0x86, 2}
		}
		simulator.registers[address] = uint16(value)
		return append([]byte(nil), request...)
	}
}
