// 本文件使用本地模拟 Modbus TCP 服务验证读写寄存器与事务头。
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

// TestReadHoldingRegisters 验证请求地址、数量与响应解析。
func TestReadHoldingRegisters(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	done := make(chan error, 1)
	go func() {
		connection, acceptErr := listener.Accept()
		if acceptErr != nil {
			done <- acceptErr
			return
		}
		defer connection.Close()
		request := make([]byte, 12)
		_, readErr := io.ReadFull(connection, request)
		if readErr != nil {
			done <- readErr
			return
		}
		if request[6] != 7 || request[7] != 3 || binary.BigEndian.Uint16(request[8:10]) != 10 || binary.BigEndian.Uint16(request[10:12]) != 2 {
			done <- io.ErrUnexpectedEOF
			return
		}
		_, writeErr := connection.Write([]byte{0, 1, 0, 0, 0, 7, 7, 3, 4, 0, 42, 1, 2})
		done <- writeErr
	}()
	values, err := (Client{Address: listener.Addr().String(), UnitID: 7}).ReadHoldingRegisters(context.Background(), 10, 2)
	if err != nil || !reflect.DeepEqual(values, []uint16{42, 258}) {
		t.Fatalf("values=%v err=%v", values, err)
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

// TestClientCancellation 验证连接已建立且设备无响应时读写均及时响应上下文取消。
func TestClientCancellation(t *testing.T) {
	for _, operation := range []string{"read", "write"} {
		t.Run(operation, func(t *testing.T) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer listener.Close()
			requestReceived := make(chan struct{})
			go func() {
				connection, acceptErr := listener.Accept()
				if acceptErr != nil {
					return
				}
				defer connection.Close()
				request := make([]byte, 12)
				if _, readErr := io.ReadFull(connection, request); readErr == nil {
					close(requestReceived)
				}
				_, _ = io.Copy(io.Discard, connection)
			}()
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			result := make(chan error, 1)
			client := Client{Address: listener.Addr().String(), UnitID: 7, Timeout: 10 * time.Second}
			go func() {
				if operation == "read" {
					_, err := client.ReadHoldingRegisters(ctx, 10, 1)
					result <- err
					return
				}
				result <- client.WriteSingleRegister(ctx, 10, 1)
			}()
			select {
			case <-requestReceived:
			case <-time.After(2 * time.Second):
				t.Fatal("设备没有收到请求")
			}
			cancel()
			select {
			case err := <-result:
				if err == nil {
					t.Fatal("取消后请求仍返回成功")
				}
			case <-time.After(2 * time.Second):
				t.Fatal("取消后请求仍在等待设备响应")
			}
		})
	}
}

// TestWriteSingleRegister 验证功能码 6 的请求格式、设备回显和异常码。
func TestWriteSingleRegister(t *testing.T) {
	cases := []struct {
		name     string
		response []byte
		wantErr  string
	}{
		{name: "success", response: []byte{0, 1, 0, 0, 0, 6, 7, 6, 0, 10, 1, 2}},
		{name: "exception", response: []byte{0, 1, 0, 0, 0, 3, 7, 0x86, 2}, wantErr: "exception code 2"},
		{name: "wrong echo", response: []byte{0, 1, 0, 0, 0, 6, 7, 6, 0, 11, 1, 2}, wantErr: "invalid modbus write response"},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer listener.Close()
			done := make(chan error, 1)
			go func() {
				connection, acceptErr := listener.Accept()
				if acceptErr != nil {
					done <- acceptErr
					return
				}
				defer connection.Close()
				request := make([]byte, 12)
				if _, readErr := io.ReadFull(connection, request); readErr != nil {
					done <- readErr
					return
				}
				if request[6] != 7 || request[7] != 6 || binary.BigEndian.Uint16(request[8:10]) != 10 || binary.BigEndian.Uint16(request[10:12]) != 258 {
					done <- io.ErrUnexpectedEOF
					return
				}
				_, writeErr := connection.Write(test.response)
				done <- writeErr
			}()
			err = (Client{Address: listener.Addr().String(), UnitID: 7}).WriteSingleRegister(context.Background(), 10, 258)
			if test.wantErr == "" && err != nil {
				t.Fatalf("写入失败: %v", err)
			}
			if test.wantErr != "" && (err == nil || !strings.Contains(err.Error(), test.wantErr)) {
				t.Fatalf("错误响应未识别: %v", err)
			}
			if serverErr := <-done; serverErr != nil {
				t.Fatal(serverErr)
			}
		})
	}
}
