//go:build !windows

// 本文件用本机伪串口验证物理串口入口的 RTU 读写、超时与模式边界。
package modbus

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"strings"
	"testing"
	"time"

	"github.com/creack/pty"
)

// TestSerialRTURoundTrip 核对串口路径沿用单元号、CRC 及读写功能码校验。
func TestSerialRTURoundTrip(t *testing.T) {
	master, slave, err := pty.Open()
	if err != nil {
		t.Fatal(err)
	}
	defer master.Close()
	defer slave.Close()
	if err := master.SetReadDeadline(time.Now().Add(3 * time.Second)); err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() {
		for index := 0; index < 2; index++ {
			request := make([]byte, 8)
			if _, err := io.ReadFull(master, request); err != nil {
				done <- err
				return
			}
			if request[0] != 7 || binary.LittleEndian.Uint16(request[6:]) != rtuCRC(request[:6]) {
				done <- io.ErrUnexpectedEOF
				return
			}
			var response []byte
			if index == 0 {
				if request[1] != 3 || binary.BigEndian.Uint16(request[2:4]) != 10 || binary.BigEndian.Uint16(request[4:6]) != 1 {
					done <- io.ErrUnexpectedEOF
					return
				}
				response = rtuReply(7, []byte{3, 2, 1, 2})
			} else {
				if request[1] != 6 || binary.BigEndian.Uint16(request[2:4]) != 10 || binary.BigEndian.Uint16(request[4:6]) != 258 {
					done <- io.ErrUnexpectedEOF
					return
				}
				response = rtuReply(7, request[1:6])
			}
			if _, err := master.Write(response); err != nil {
				done <- err
				return
			}
		}
		done <- nil
	}()
	client := Client{Address: slave.Name(), UnitID: 7, Timeout: time.Second, Serial: &SerialConfig{BaudRate: 19200, DataBits: 8, StopBits: 1, Parity: "N"}}
	values, err := client.ReadHoldingRegisters(context.Background(), 10, 1)
	if err != nil || len(values) != 1 || values[0] != 258 {
		t.Fatalf("串口 RTU 读取失败: %v %v", values, err)
	}
	if err := client.WriteSingleRegister(context.Background(), 10, 258); err != nil {
		t.Fatalf("串口 RTU 写入失败: %v", err)
	}
	if err := <-done; err != nil {
		t.Fatalf("伪串口收发失败: %v", err)
	}
}

// TestSerialRTURejectsMixedModes 验证串口不能与网络传输或 TLS 同时启用。
func TestSerialRTURejectsMixedModes(t *testing.T) {
	client := Client{Address: "/dev/tty-not-opened", Serial: &SerialConfig{}, RTUOverTCP: true}
	_, err := client.ReadHoldingRegisters(context.Background(), 0, 1)
	if err == nil || !strings.Contains(err.Error(), "cannot combine") {
		t.Fatalf("未拒绝混合传输模式: %v", err)
	}
}

// TestSerialRTUStopsWaiting 验证无响应串口遵守调用取消和客户端总超时。
func TestSerialRTUStopsWaiting(t *testing.T) {
	master, slave, err := pty.Open()
	if err != nil {
		t.Fatal(err)
	}
	defer master.Close()
	defer slave.Close()
	client := Client{Address: slave.Name(), UnitID: 7, Timeout: 500 * time.Millisecond, Serial: &SerialConfig{Parity: "N"}}
	ctx, cancel := context.WithCancel(context.Background())
	time.AfterFunc(25*time.Millisecond, cancel)
	started := time.Now()
	if _, err := client.ReadHoldingRegisters(ctx, 10, 1); !errors.Is(err, context.Canceled) || time.Since(started) > 250*time.Millisecond {
		t.Fatalf("串口调用取消未及时结束: %v", err)
	}
	client.Timeout = 80 * time.Millisecond
	started = time.Now()
	if _, err := client.ReadHoldingRegisters(context.Background(), 10, 1); !errors.Is(err, context.DeadlineExceeded) || time.Since(started) > 250*time.Millisecond {
		t.Fatalf("串口总超时未及时结束: %v", err)
	}
}
