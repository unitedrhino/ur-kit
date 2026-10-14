// 本文件提供仅供本地演示与集成测试使用的 Modbus TCP 保持寄存器模拟器。
package modbus

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"net"
	"sync"
)

// Simulator 保存本地模拟设备的保持寄存器；不同连接可并发访问。
type Simulator struct {
	mu        sync.Mutex
	registers []uint16
}

// NewSimulator 根据初始值创建模拟设备；输入切片之后的修改不会影响设备。
func NewSimulator(initial []uint16) *Simulator {
	return &Simulator{registers: append([]uint16(nil), initial...)}
}

// Serve 在指定监听器上响应功能码 3 和 6；上下文取消后关闭监听器并等待连接退出。
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

// respond 按 Modbus 异常码反馈无效功能、地址或数量，避免越界访问寄存器。
func (simulator *Simulator) respond(request []byte) []byte {
	function := request[0]
	if function != 3 && function != 6 {
		return []byte{function | 0x80, 1}
	}
	if len(request) != 5 {
		return []byte{function | 0x80, 3}
	}
	address := int(binary.BigEndian.Uint16(request[1:3]))
	value := int(binary.BigEndian.Uint16(request[3:5]))
	simulator.mu.Lock()
	defer simulator.mu.Unlock()
	if function == 3 {
		if value < 1 || value > 125 {
			return []byte{0x83, 3}
		}
		if address >= len(simulator.registers) || value > len(simulator.registers)-address {
			return []byte{0x83, 2}
		}
		response := make([]byte, 2+value*2)
		response[0], response[1] = 3, byte(value*2)
		for index := 0; index < value; index++ {
			binary.BigEndian.PutUint16(response[2+index*2:], simulator.registers[address+index])
		}
		return response
	}
	if address >= len(simulator.registers) {
		return []byte{0x86, 2}
	}
	simulator.registers[address] = uint16(value)
	return append([]byte(nil), request...)
}
