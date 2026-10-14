// 本文件验证点位编码与 Modbus TCP 多寄存器写入的真实往返和错误边界。
package modbus

import (
	"context"
	"encoding/binary"
	"io"
	"net"
	"reflect"
	"strings"
	"testing"
)

// TestHoldingPointRoundTrip 用本地 TCP 模拟器验证 16/32/64 位、浮点、字符串和设备字序。
func TestHoldingPointRoundTrip(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- NewSimulator(make([]uint16, 32)).Serve(ctx, listener) }()
	defer func() {
		cancel()
		if err := <-done; err != nil {
			t.Fatal(err)
		}
	}()
	client := Client{Address: listener.Addr().String(), UnitID: 7}
	for _, test := range []struct {
		name  string
		point HoldingPoint
		value any
		wire  []uint16
	}{
		{"uint16", HoldingPoint{Address: 0, ValueType: "uint16"}, uint16(42), []uint16{42}},
		{"int16 swapped", HoldingPoint{Address: 1, ValueType: "int16", ByteSwap: true, MultiWrite: true}, int16(-2), []uint16{0xfeff}},
		{"uint32 swapped", HoldingPoint{Address: 2, ValueType: "uint32", WordSwap: true}, uint32(0x12345678), []uint16{0x5678, 0x1234}},
		{"int32 swapped", HoldingPoint{Address: 4, ValueType: "int32", ByteSwap: true}, int32(-123456), []uint16{0xfeff, 0xc01d}},
		{"uint64", HoldingPoint{Address: 6, ValueType: "uint64"}, uint64(0x123456789abcdef0), []uint16{0x1234, 0x5678, 0x9abc, 0xdef0}},
		{"int64", HoldingPoint{Address: 10, ValueType: "int64", WordSwap: true}, int64(-1234567890123), nil},
		{"float32", HoldingPoint{Address: 14, ValueType: "float32"}, float32(12.5), []uint16{0x4148, 0}},
		{"float64", HoldingPoint{Address: 16, ValueType: "float64", ByteSwap: true, WordSwap: true}, float64(-0.125), []uint16{0, 0xc0bf, 0, 0}},
		{"string odd words", HoldingPoint{Address: 20, ValueType: "string", StrLen: 3, WordSwap: true}, "abc", []uint16{0x6300, 0x6162, 0}},
	} {
		t.Run(test.name, func(t *testing.T) {
			if err := client.WriteHoldingPoint(ctx, test.point, test.value); err != nil {
				t.Fatal(err)
			}
			got, err := client.ReadHoldingPoint(ctx, test.point)
			if err != nil || !reflect.DeepEqual(got, test.value) {
				t.Fatalf("got=%v (%T), want=%v, err=%v", got, got, test.value, err)
			}
			if test.wire != nil {
				wire, err := client.ReadHoldingRegisters(ctx, test.point.Address, uint16(len(test.wire)))
				if err != nil || !reflect.DeepEqual(wire, test.wire) {
					t.Fatalf("wire=%#v, want=%#v, err=%v", wire, test.wire, err)
				}
			}
		})
	}
}

// TestWriteMultipleRegistersEcho 验证客户端拒绝事务号、地址和数量错误的写入回显。
func TestWriteMultipleRegistersEcho(t *testing.T) {
	for _, test := range []struct {
		name  string
		frame []byte
	}{
		{"wrong transaction", []byte{0, 2, 0, 0, 0, 6, 7, 16, 0, 10, 0, 2}},
		{"wrong address", []byte{0, 1, 0, 0, 0, 6, 7, 16, 0, 11, 0, 2}},
		{"wrong quantity", []byte{0, 1, 0, 0, 0, 6, 7, 16, 0, 10, 0, 1}},
	} {
		t.Run(test.name, func(t *testing.T) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer listener.Close()
			done := make(chan error, 1)
			go func() {
				conn, err := listener.Accept()
				if err != nil {
					done <- err
					return
				}
				defer conn.Close()
				header := make([]byte, 7)
				if _, err := io.ReadFull(conn, header); err != nil {
					done <- err
					return
				}
				pdu := make([]byte, int(binary.BigEndian.Uint16(header[4:6]))-1)
				if _, err := io.ReadFull(conn, pdu); err != nil {
					done <- err
					return
				}
				_, err = conn.Write(test.frame)
				done <- err
			}()
			err = (Client{Address: listener.Addr().String(), UnitID: 7}).WriteMultipleRegisters(context.Background(), 10, []uint16{1, 2})
			if err == nil {
				t.Fatal("错误回显被接受")
			}
			if err := <-done; err != nil {
				t.Fatal(err)
			}
		})
	}
}

// TestHoldingPointValidation 验证类型和长度错误在连接设备前被拒绝。
func TestHoldingPointValidation(t *testing.T) {
	client := Client{Address: "127.0.0.1:1"}
	for _, test := range []struct {
		point HoldingPoint
		value any
		want  string
	}{
		{HoldingPoint{ValueType: "string"}, "a", "register range"},
		{HoldingPoint{ValueType: "uint16"}, int(1), "must be uint16"},
		{HoldingPoint{ValueType: "string", StrLen: 1}, "abc", "exceeds"},
		{HoldingPoint{Address: 65535, ValueType: "uint32"}, uint32(1), "address space"},
		{HoldingPoint{ValueType: "string", StrLen: 124}, "a", "multiple-write limit"},
	} {
		err := client.WriteHoldingPoint(context.Background(), test.point, test.value)
		if err == nil || !strings.Contains(err.Error(), test.want) {
			t.Fatalf("point=%+v err=%v, want %q", test.point, err, test.want)
		}
	}
	if _, err := (HoldingPoint{ValueType: "uint32"}).Decode([]uint16{1}); err == nil {
		t.Fatal("错误的寄存器数量未被拒绝")
	}
}

// TestWriteMultipleRegistersException 验证设备的地址异常、非法数量和空输入。
func TestWriteMultipleRegistersException(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- NewSimulator(make([]uint16, 2)).Serve(ctx, listener) }()
	defer func() {
		cancel()
		if err := <-done; err != nil {
			t.Fatal(err)
		}
	}()
	client := Client{Address: listener.Addr().String()}
	if err := client.WriteMultipleRegisters(ctx, 1, []uint16{1, 2}); err == nil || !strings.Contains(err.Error(), "exception code 2") {
		t.Fatalf("地址异常: %v", err)
	}
	if err := client.WriteMultipleRegisters(ctx, 0, nil); err == nil {
		t.Fatal("空写入未被拒绝")
	}
	if err := client.WriteMultipleRegisters(ctx, 65535, []uint16{1, 2}); err == nil {
		t.Fatal("越界未被拒绝")
	}
	request := []byte{16, 0, 0, 0, 2, 2, 0, 1}
	response := NewSimulator(make([]uint16, 2)).respond(request)
	if !reflect.DeepEqual(response, []byte{0x90, 3}) {
		t.Fatalf("非法字节数量响应=%v", response)
	}
	response = NewSimulator(make([]uint16, 2)).respond([]byte{16, 0, 0, 0, 0, 0})
	if !reflect.DeepEqual(response, []byte{0x90, 3}) {
		t.Fatalf("零数量响应=%v", response)
	}
}
