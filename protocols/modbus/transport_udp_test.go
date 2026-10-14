// 本文件以本机 UDP 模拟设备验证 MBAP 和 RTU 数据报的读写及边界拒绝。
package modbus

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/binary"
	"net"
	"reflect"
	"strings"
	"testing"
	"time"
)

// udpGateway 只接收一份请求并返回指定设备帧，避免测试依赖外部网络。
func udpGateway(t *testing.T, respond func([]byte) []byte) string {
	t.Helper()
	listener, err := net.ListenPacket("udp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = listener.Close() })
	done := make(chan struct{})
	go func() {
		defer close(done)
		_ = listener.SetReadDeadline(time.Now().Add(3 * time.Second))
		buffer := make([]byte, 261)
		length, address, readErr := listener.ReadFrom(buffer)
		if readErr != nil {
			return
		}
		if response := respond(buffer[:length]); response != nil {
			_, _ = listener.WriteTo(response, address)
		}
	}()
	t.Cleanup(func() { <-done })
	return listener.LocalAddr().String()
}

// TestUDPModeRoundTrip 验证 MBAP 与 RTU 两类 UDP 数据报均能读取寄存器。
func TestUDPModeRoundTrip(t *testing.T) {
	address := udpGateway(t, func(request []byte) []byte {
		if !bytes.Equal(request, []byte{0, 1, 0, 0, 0, 6, 7, 3, 0, 10, 0, 1}) {
			t.Errorf("UDP MBAP 请求错误: %x", request)
		}
		return []byte{0, 1, 0, 0, 0, 5, 7, 3, 2, 1, 2}
	})
	values, err := (Client{Address: address, UnitID: 7, UDP: true}).ReadHoldingRegisters(context.Background(), 10, 1)
	if err != nil || !reflect.DeepEqual(values, []uint16{258}) {
		t.Fatalf("UDP MBAP 读数=%v, err=%v", values, err)
	}
	address = udpGateway(t, func(request []byte) []byte {
		if !bytes.Equal(request, []byte{0, 1, 0, 0, 0, 6, 7, 6, 0, 10, 1, 2}) {
			t.Errorf("UDP MBAP 写请求错误: %x", request)
		}
		return append([]byte(nil), request...)
	})
	if err := (Client{Address: address, UnitID: 7, UDP: true}).WriteSingleRegister(context.Background(), 10, 258); err != nil {
		t.Fatalf("UDP MBAP 写失败: %v", err)
	}
	address = udpGateway(t, func(request []byte) []byte {
		if len(request) != 8 || !bytes.Equal(request[:6], []byte{7, 3, 0, 10, 0, 1}) || binary.LittleEndian.Uint16(request[6:]) != rtuCRC(request[:6]) {
			t.Errorf("UDP RTU 请求错误: %x", request)
		}
		return rtuReply(7, []byte{3, 2, 1, 2})
	})
	values, err = (Client{Address: address, UnitID: 7, RTUOverUDP: true}).ReadHoldingRegisters(context.Background(), 10, 1)
	if err != nil || !reflect.DeepEqual(values, []uint16{258}) {
		t.Fatalf("UDP RTU 读数=%v, err=%v", values, err)
	}
	address = udpGateway(t, func(request []byte) []byte {
		if len(request) != 8 || request[0] != 7 || request[1] != 6 || binary.BigEndian.Uint16(request[2:4]) != 10 || binary.BigEndian.Uint16(request[4:6]) != 258 || binary.LittleEndian.Uint16(request[6:]) != rtuCRC(request[:6]) {
			t.Errorf("UDP RTU 写请求错误: %x", request)
		}
		return append([]byte(nil), request...)
	})
	if err := (Client{Address: address, UnitID: 7, RTUOverUDP: true}).WriteSingleRegister(context.Background(), 10, 258); err != nil {
		t.Fatalf("UDP RTU 写失败: %v", err)
	}
}

// TestUDPRejectsInvalidDatagrams 核对完整帧长度、事务、单元号、CRC、功能码和异常处理。
func TestUDPRejectsInvalidDatagrams(t *testing.T) {
	mbap := []byte{0, 1, 0, 0, 0, 5, 7, 3, 2, 1, 2}
	for _, item := range []struct {
		name, message string
		frame         []byte
	}{
		{"extra", "length", append(append([]byte(nil), mbap...), 0)},
		{"short", "length", mbap[:len(mbap)-1]},
		{"transaction", "transaction", []byte{0, 2, 0, 0, 0, 5, 7, 3, 2, 1, 2}},
		{"unit", "unit", []byte{0, 1, 0, 0, 0, 5, 8, 3, 2, 1, 2}},
		{"function", "function", []byte{0, 1, 0, 0, 0, 5, 7, 4, 2, 1, 2}},
		{"exception", "exception code 2", []byte{0, 1, 0, 0, 0, 3, 7, 0x83, 2}},
		{"oversize", "length", bytes.Repeat([]byte{1}, 261)},
	} {
		t.Run(item.name, func(t *testing.T) {
			address := udpGateway(t, func([]byte) []byte { return item.frame })
			_, err := (Client{Address: address, UnitID: 7, UDP: true}).ReadHoldingRegisters(context.Background(), 10, 1)
			if err == nil || !strings.Contains(err.Error(), item.message) {
				t.Fatalf("UDP 无效帧未拒绝: %v", err)
			}
		})
	}
	for _, item := range []struct {
		name, message string
		frame         []byte
	}{
		{"crc", "crc", []byte{7, 3, 2, 1, 2, 0, 0}},
		{"unit", "unit", rtuReply(8, []byte{3, 2, 1, 2})},
		{"function", "function", rtuReply(7, []byte{4, 2, 1, 2})},
		{"byte-count", "byte count", rtuReply(7, []byte{3, 4, 1, 2})},
		{"exception", "exception code 2", rtuReply(7, []byte{0x83, 2})},
	} {
		t.Run("rtu-"+item.name, func(t *testing.T) {
			address := udpGateway(t, func([]byte) []byte { return item.frame })
			_, err := (Client{Address: address, UnitID: 7, RTUOverUDP: true}).ReadHoldingRegisters(context.Background(), 10, 1)
			if err == nil || !strings.Contains(err.Error(), item.message) {
				t.Fatalf("UDP RTU 无效帧未拒绝: %v", err)
			}
		})
	}
}

// TestUDPRejectsIncompatibleTransports 验证数据报模式拒绝流式 RTU 和 TLS 组合。
func TestUDPRejectsIncompatibleTransports(t *testing.T) {
	for _, client := range []Client{
		{Address: "127.0.0.1:1", UDP: true, RTUOverTCP: true},
		{Address: "127.0.0.1:1", RTUOverUDP: true, TLS: &tls.Config{}},
	} {
		if _, err := client.ReadHoldingRegisters(context.Background(), 0, 1); err == nil || !strings.Contains(err.Error(), "cannot combine") {
			t.Fatalf("无效传输组合未拒绝: %v", err)
		}
	}
}

// TestUDPTimeout 验证无响应的数据报不会使请求一直等待。
func TestUDPTimeout(t *testing.T) {
	address := udpGateway(t, func([]byte) []byte { return nil })
	started := time.Now()
	_, err := (Client{Address: address, UnitID: 7, Timeout: 150 * time.Millisecond, UDP: true}).ReadHoldingRegisters(context.Background(), 10, 1)
	if err == nil || time.Since(started) > 2*time.Second {
		t.Fatalf("UDP 无响应未按超时退出: %v", err)
	}
}
