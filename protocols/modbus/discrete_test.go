// 本文件使用真实回环 TCP 连接验证线圈、离散输入和输入寄存器的功能码与边界。
package modbus

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"net"
	"reflect"
	"strings"
	"testing"
)

// TestDiscreteWireFrames 使用独立测试服务核对功能码、起始地址、位序及写线圈线缆值。
func TestDiscreteWireFrames(t *testing.T) {
	for _, test := range []struct {
		name     string
		request  []byte
		response []byte
		call     func(Client) error
	}{
		{"coils", []byte{1, 0, 9, 0, 10}, []byte{1, 2, 0x4d, 0x02}, func(client Client) error {
			values, err := client.ReadCoils(context.Background(), 9, 10)
			if err == nil && !reflect.DeepEqual(values, []bool{true, false, true, true, false, false, true, false, false, true}) {
				return errors.New("unexpected coil bit order")
			}
			return err
		}},
		{"discrete", []byte{2, 0, 3, 0, 1}, []byte{2, 1, 1}, func(client Client) error {
			values, err := client.ReadDiscreteInputs(context.Background(), 3, 1)
			if err == nil && !reflect.DeepEqual(values, []bool{true}) {
				return errors.New("unexpected discrete value")
			}
			return err
		}},
		{"input register", []byte{4, 0, 4, 0, 1}, []byte{4, 2, 0x12, 0x34}, func(client Client) error {
			values, err := client.ReadInputRegisters(context.Background(), 4, 1)
			if err == nil && !reflect.DeepEqual(values, []uint16{0x1234}) {
				return errors.New("unexpected input register")
			}
			return err
		}},
		{"write coil", []byte{5, 0, 4, 0xff, 0}, []byte{5, 0, 4, 0xff, 0}, func(client Client) error {
			return client.WriteSingleCoil(context.Background(), 4, true)
		}},
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
				frame := make([]byte, 12)
				if _, err := io.ReadFull(connection, frame); err != nil {
					done <- err
					return
				}
				if !reflect.DeepEqual(frame[:7], []byte{0, 1, 0, 0, 0, 6, 7}) || !reflect.DeepEqual(frame[7:], test.request) {
					done <- errors.New("unexpected Modbus request frame")
					return
				}
				reply := append([]byte{0, 1, 0, 0, 0, 0, 7}, test.response...)
				binary.BigEndian.PutUint16(reply[4:6], uint16(len(test.response)+1))
				_, err = connection.Write(reply)
				done <- err
			}()
			if err := test.call(Client{Address: listener.Addr().String(), UnitID: 7}); err != nil {
				t.Fatal(err)
			}
			if err := <-done; err != nil {
				t.Fatal(err)
			}
		})
	}
}

// TestReadBitsAndInputRegisters 验证跨字节位序、读写线圈及输入寄存器的独立数据区。
func TestReadBitsAndInputRegisters(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	simulator := NewSimulator([]uint16{7, 8})
	coils := []bool{true, false, true, true, false, false, true, false, true, true}
	inputs := []bool{false, true, false, false, true, false, false, true, true, false}
	simulator.SetCoils(coils)
	simulator.SetDiscreteInputs(inputs)
	simulator.SetInputRegisters([]uint16{0x1234, 0x5678})
	go func() { done <- simulator.Serve(ctx, listener) }()
	defer func() {
		cancel()
		if err := <-done; err != nil {
			t.Fatal(err)
		}
	}()
	client := Client{Address: listener.Addr().String(), UnitID: 7}
	if got, err := client.ReadCoils(ctx, 0, 10); err != nil || !reflect.DeepEqual(got, coils) {
		t.Fatalf("线圈=%v, err=%v", got, err)
	}
	if got, err := client.ReadDiscreteInputs(ctx, 0, 10); err != nil || !reflect.DeepEqual(got, inputs) {
		t.Fatalf("离散输入=%v, err=%v", got, err)
	}
	if got, err := client.ReadInputRegisters(ctx, 0, 2); err != nil || !reflect.DeepEqual(got, []uint16{0x1234, 0x5678}) {
		t.Fatalf("输入寄存器=%v, err=%v", got, err)
	}
	if err := client.WriteSingleCoil(ctx, 1, true); err != nil {
		t.Fatal(err)
	}
	if err := client.WriteSingleCoil(ctx, 8, false); err != nil {
		t.Fatal(err)
	}
	if got, err := client.ReadCoils(ctx, 0, 10); err != nil || !reflect.DeepEqual(got, []bool{true, true, true, true, false, false, true, false, false, true}) {
		t.Fatalf("写后线圈=%v, err=%v", got, err)
	}
	if got, err := client.ReadHoldingRegisters(ctx, 0, 2); err != nil || !reflect.DeepEqual(got, []uint16{7, 8}) {
		t.Fatalf("保持寄存器被只读输入覆盖: %v, err=%v", got, err)
	}
}

// TestDiscreteValidation 验证数量、地址、只读区和非法线圈值返回明确错误。
func TestDiscreteValidation(t *testing.T) {
	client := Client{Address: "127.0.0.1:1"}
	for _, test := range []struct {
		address  uint16
		quantity uint16
	}{
		{0, 0}, {0, 2001}, {65535, 2},
	} {
		if _, err := client.ReadCoils(context.Background(), test.address, test.quantity); err == nil {
			t.Fatalf("非法位区间被接受: %+v", test)
		}
	}
	simulator := NewSimulator(make([]uint16, 2))
	simulator.SetCoils([]bool{false, false})
	for _, test := range []struct {
		request []byte
		want    []byte
	}{
		{[]byte{2, 0, 0, 0, 1}, []byte{0x82, 2}},
		{[]byte{4, 0, 0, 0, 1}, []byte{0x84, 2}},
		{[]byte{5, 0, 0, 0, 1}, []byte{0x85, 3}},
		{[]byte{1, 0, 0, 0, 0}, []byte{0x81, 3}},
		{[]byte{15, 0, 0, 0, 1}, []byte{0x8f, 1}},
	} {
		if got := simulator.respond(test.request); !reflect.DeepEqual(got, test.want) {
			t.Fatalf("请求=%v 响应=%v, want=%v", test.request, got, test.want)
		}
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- simulator.Serve(ctx, listener) }()
	defer func() {
		cancel()
		if err := <-done; err != nil {
			t.Fatal(err)
		}
	}()
	client.Address = listener.Addr().String()
	if err := client.WriteSingleCoil(ctx, 2, true); err == nil || !strings.Contains(err.Error(), "exception code 2") {
		t.Fatalf("越界线圈未拒绝: %v", err)
	}
}
