// 本文件以真实 TCP 连接验证本地 Modbus 模拟器与公开客户端互通。
package modbus

import (
	"context"
	"encoding/binary"
	"io"
	"net"
	"reflect"
	"strings"
	"testing"
	"time"
)

// TestSimulatorEndToEnd 验证读写、异常码以及取消时连接和监听器退出。
func TestSimulatorEndToEnd(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	initial := make([]uint16, 16)
	initial[10], initial[11] = 42, 258
	go func() { done <- NewSimulator(initial).Serve(ctx, listener) }()
	client := Client{Address: listener.Addr().String(), UnitID: 7}
	values, err := client.ReadHoldingRegisters(ctx, 10, 2)
	if err != nil || !reflect.DeepEqual(values, []uint16{42, 258}) {
		t.Fatalf("初始寄存器=%v, err=%v", values, err)
	}
	if err := client.WriteSingleRegister(ctx, 10, 99); err != nil {
		t.Fatal(err)
	}
	values, err = client.ReadHoldingRegisters(ctx, 10, 2)
	if err != nil || !reflect.DeepEqual(values, []uint16{99, 258}) {
		t.Fatalf("更新后寄存器=%v, err=%v", values, err)
	}
	if _, err := client.ReadHoldingRegisters(ctx, 16, 1); err == nil || !strings.Contains(err.Error(), "exception code 2") {
		t.Fatalf("未拒绝无效地址: %v", err)
	}
	if err := client.WriteSingleRegister(ctx, 16, 1); err == nil || !strings.Contains(err.Error(), "exception code 2") {
		t.Fatalf("未拒绝无效写入地址: %v", err)
	}
	for _, test := range []struct {
		request []byte
		code    byte
	}{
		{request: []byte{4, 0, 10, 0, 1}, code: 1},
		{request: []byte{3, 0, 10, 0, 0}, code: 3},
	} {
		connection, dialErr := net.Dial("tcp", listener.Addr().String())
		if dialErr != nil {
			t.Fatal(dialErr)
		}
		frame := append([]byte{0, 9, 0, 0, 0, 6, 7}, test.request...)
		if _, writeErr := connection.Write(frame); writeErr != nil {
			t.Fatal(writeErr)
		}
		response := make([]byte, 9)
		if _, readErr := io.ReadFull(connection, response); readErr != nil {
			t.Fatal(readErr)
		}
		if binary.BigEndian.Uint16(response[:2]) != 9 || response[7] != test.request[0]|0x80 || response[8] != test.code {
			t.Fatalf("异常响应错误: %v", response)
		}
		connection.Close()
	}
	idle, err := net.Dial("tcp", listener.Addr().String())
	if err != nil {
		t.Fatal(err)
	}
	defer idle.Close()
	cancel()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("模拟器取消后未退出")
	}
}
