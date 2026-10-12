// 本文件使用本地模拟 Modbus TCP 服务验证读寄存器与事务头。
package modbus

import (
	"context"
	"encoding/binary"
	"io"
	"net"
	"reflect"
	"testing"
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
