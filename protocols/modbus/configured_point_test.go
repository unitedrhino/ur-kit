// 本文件验证原协议点位 JSON 可以在独立 TCP 客户端完成分区读取和位域写入。
package modbus

import (
	"context"
	"encoding/json"
	"net"
	"reflect"
	"strings"
	"testing"
)

// TestConfiguredPointEndToEnd 验证四类点位及保持寄存器位域不会覆盖未选中的位。
func TestConfiguredPointEndToEnd(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	simulator := NewSimulator([]uint16{0xa53c, 0, 0})
	simulator.SetCoils([]bool{false})
	simulator.SetDiscreteInputs([]bool{true})
	simulator.SetInputRegisters([]uint16{0x1234, 0x5678})
	go func() { done <- simulator.Serve(ctx, listener) }()
	defer func() {
		cancel()
		if err := <-done; err != nil {
			t.Fatal(err)
		}
	}()
	client := Client{Address: listener.Addr().String()}
	var bitPoint Point
	if err := json.Unmarshal([]byte(`{"identifier":"flag","address":0,"registerType":"HOLDING_REGISTER","valueType":"uint16","bit":4,"bitLen":3}`), &bitPoint); err != nil {
		t.Fatal(err)
	}
	if value, err := client.ReadPoint(ctx, bitPoint); err != nil || value != uint16(3) {
		t.Fatalf("初始位域=%v, err=%v", value, err)
	}
	if err := client.WritePoint(ctx, bitPoint, uint16(5)); err != nil {
		t.Fatal(err)
	}
	if words, err := client.ReadHoldingRegisters(ctx, 0, 1); err != nil || !reflect.DeepEqual(words, []uint16{0xa55c}) {
		t.Fatalf("未选位被改写: %v, err=%v", words, err)
	}
	input := Point{RegisterType: "INPUT_REGISTER", ValueType: "uint32"}
	if value, err := client.ReadPoint(ctx, input); err != nil || value != uint32(0x12345678) {
		t.Fatalf("输入寄存器=%v, err=%v", value, err)
	}
	coil := Point{RegisterType: "COIL"}
	if err := client.WritePoint(ctx, coil, true); err != nil {
		t.Fatal(err)
	}
	if value, err := client.ReadPoint(ctx, coil); err != nil || value != true {
		t.Fatalf("线圈=%v, err=%v", value, err)
	}
	if value, err := client.ReadPoint(ctx, Point{RegisterType: "DISCRETE_INPUT"}); err != nil || value != true {
		t.Fatalf("离散输入=%v, err=%v", value, err)
	}
}

// TestConfiguredPointValidation 验证只读点位、非法位宽和越界值在访问设备前拒绝。
func TestConfiguredPointValidation(t *testing.T) {
	client := Client{Address: "127.0.0.1:1"}
	for _, test := range []struct {
		point Point
		value any
		want  string
	}{
		{Point{RegisterType: "INPUT_REGISTER", ValueType: "uint16"}, uint16(1), "read-only"},
		{Point{RegisterType: "DISCRETE_INPUT"}, true, "read-only"},
		{Point{RegisterType: "COIL"}, uint16(1), "must be bool"},
		{Point{RegisterType: "HOLDING_REGISTER", ValueType: "uint16", Bit: 15, BitLen: 2}, uint16(1), "bit field"},
		{Point{RegisterType: "HOLDING_REGISTER", ValueType: "uint16", BitLen: 2}, uint16(4), "within configured width"},
	} {
		if err := client.WritePoint(context.Background(), test.point, test.value); err == nil || !strings.Contains(err.Error(), test.want) {
			t.Fatalf("点位=%+v 错误=%v, want=%q", test.point, err, test.want)
		}
	}
}
