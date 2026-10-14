// 本文件验证批量线圈写入的线缆位序、回显、边界与模拟设备状态。
package modbus

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"net"
	"reflect"
	"testing"
)

// TestWriteMultipleCoilsWire 检查功能码 15 的请求帧和错误回显拒绝。
func TestWriteMultipleCoilsWire(t *testing.T) {
	values := []bool{true, false, true, true, false, false, true, false, false, true}
	for _, test := range []struct {
		name     string
		response []byte
		wantErr  bool
	}{
		{"valid", []byte{15, 0, 4, 0, 10}, false},
		{"wrong count", []byte{15, 0, 4, 0, 9}, true},
		{"wrong address", []byte{15, 0, 5, 0, 10}, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer listener.Close()
			done := make(chan error, 1)
			go func() {
				connection, err := listener.Accept()
				if err != nil {
					done <- err
					return
				}
				defer connection.Close()
				frame := make([]byte, 15)
				if _, err := io.ReadFull(connection, frame); err != nil {
					done <- err
					return
				}
				if !reflect.DeepEqual(frame[:7], []byte{0, 1, 0, 0, 0, 9, 7}) || !reflect.DeepEqual(frame[7:], []byte{15, 0, 4, 0, 10, 2, 0x4d, 0x02}) {
					done <- errors.New("unexpected Modbus bulk coil frame")
					return
				}
				reply := append([]byte{0, 1, 0, 0, 0, 0, 7}, test.response...)
				binary.BigEndian.PutUint16(reply[4:6], uint16(len(test.response)+1))
				_, err = connection.Write(reply)
				done <- err
			}()
			err = (Client{Address: listener.Addr().String(), UnitID: 7}).WriteMultipleCoils(context.Background(), 4, values)
			if (err != nil) != test.wantErr {
				t.Fatalf("write error=%v, wantErr=%v", err, test.wantErr)
			}
			if err := <-done; err != nil {
				t.Fatal(err)
			}
		})
	}
}

// TestWriteMultipleCoilsSimulator 验证批量写入只修改目标线圈且非法帧不修改设备。
func TestWriteMultipleCoilsSimulator(t *testing.T) {
	simulator := NewSimulator(nil)
	simulator.SetCoils(make([]bool, 12))
	if got := simulator.respond([]byte{15, 0, 1, 0, 10, 2, 0x4d, 0x02}); !reflect.DeepEqual(got, []byte{15, 0, 1, 0, 10}) {
		t.Fatalf("write response=%v", got)
	}
	for _, request := range [][]byte{
		{15, 0, 1, 0, 10, 1, 0x4d},
		{15, 0, 11, 0, 2, 1, 3},
		{15, 0, 1, 0, 0, 0},
	} {
		if got := simulator.respond(request); len(got) != 2 || got[0] != 0x8f {
			t.Fatalf("invalid request accepted: %v -> %v", request, got)
		}
	}
	if got := simulator.respond([]byte{1, 0, 0, 0, 12}); !reflect.DeepEqual(got, []byte{1, 2, 0x9a, 0x04}) {
		t.Fatalf("coils after write=%v", got)
	}
	client := Client{Address: "127.0.0.1:1"}
	for _, test := range []struct {
		address uint16
		values  []bool
	}{
		{0, nil},
		{0, make([]bool, 1969)},
		{65535, []bool{true, true}},
	} {
		if err := client.WriteMultipleCoils(context.Background(), test.address, test.values); err == nil {
			t.Fatalf("invalid coil range accepted: %d, %d", test.address, len(test.values))
		}
	}
}

// TestWriteMultipleCoilsRoundTrip 在真实回环 TCP 连接上核对跨字节线圈写入与读取。
func TestWriteMultipleCoilsRoundTrip(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	simulator := NewSimulator(nil)
	simulator.SetCoils(make([]bool, 12))
	go func() { done <- simulator.Serve(ctx, listener) }()
	defer func() {
		cancel()
		if err := <-done; err != nil {
			t.Fatal(err)
		}
	}()
	client := Client{Address: listener.Addr().String(), UnitID: 7}
	values := []bool{true, false, true, true, false, false, true, false, false, true}
	if err := client.WriteMultipleCoils(ctx, 1, values); err != nil {
		t.Fatal(err)
	}
	got, err := client.ReadCoils(ctx, 0, 12)
	want := append([]bool{false}, values...)
	want = append(want, false)
	if err != nil || !reflect.DeepEqual(got, want) {
		t.Fatalf("coils=%v, err=%v, want=%v", got, err, want)
	}
}
