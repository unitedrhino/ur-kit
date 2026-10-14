// 本文件通过物理串口收发 Modbus RTU 帧，沿用网络 RTU 的 CRC 与响应校验。
package modbus

import (
	"context"
	"errors"
	"time"

	"github.com/goburrow/serial"
)

// serialExchange 在串口分段读取时持续检查调用取消和本次请求的总超时。
type serialExchange struct {
	port     serial.Port
	ctx      context.Context
	deadline time.Time
}

// Read 在短轮询超时后重试，直到收到数据、请求取消或总时限到达。
func (exchange serialExchange) Read(buffer []byte) (int, error) {
	for {
		if err := exchange.ctx.Err(); err != nil {
			return 0, err
		}
		if !time.Now().Before(exchange.deadline) {
			return 0, context.DeadlineExceeded
		}
		read, err := exchange.port.Read(buffer)
		if errors.Is(err, serial.ErrTimeout) {
			continue
		}
		return read, err
	}
}

// Write 在发送串口帧前核对调用是否已经取消。
func (exchange serialExchange) Write(buffer []byte) (int, error) {
	if err := exchange.ctx.Err(); err != nil {
		return 0, err
	}
	return exchange.port.Write(buffer)
}

// exchangeSerial 按调用方串口参数打开设备并完成一次 RTU 请求；端口由本次调用独占。
func (client Client) exchangeSerial(ctx context.Context, requestPDU []byte) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	timeout := client.Timeout
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	if deadline, ok := ctx.Deadline(); ok {
		if remaining := time.Until(deadline); remaining < timeout {
			timeout = remaining
		}
	}
	if timeout <= 0 {
		return nil, context.DeadlineExceeded
	}
	deadline := time.Now().Add(timeout)
	readPoll := timeout
	if readPoll > 50*time.Millisecond {
		readPoll = 50 * time.Millisecond
	}
	port, err := serial.Open(&serial.Config{
		Address:  client.Address,
		BaudRate: client.Serial.BaudRate,
		DataBits: client.Serial.DataBits,
		StopBits: client.Serial.StopBits,
		Parity:   client.Serial.Parity,
		Timeout:  readPoll,
	})
	if err != nil {
		return nil, err
	}
	defer port.Close()
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	response, err := exchangeRTU(serialExchange{port: port, ctx: ctx, deadline: deadline}, client.UnitID, requestPDU)
	if ctxErr := ctx.Err(); ctxErr != nil {
		return nil, ctxErr
	}
	return response, err
}
