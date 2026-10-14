// 本文件用本机 TCP 网关验证 RTU 帧、CRC、设备异常和响应拒绝路径。
package modbus

import (
	"bytes"
	"context"
	"encoding/binary"
	"io"
	"net"
	"strings"
	"testing"
	"time"
)

// rtuReply 为测试网关构造独立 RTU 响应帧。
func rtuReply(unit byte, pdu []byte) []byte {
	frame := append([]byte{unit}, pdu...)
	crc := rtuCRC(frame)
	return binary.LittleEndian.AppendUint16(frame, crc)
}

// rtuGateway 启动仅处理一次请求的本机网关，并让用例指定完整响应帧。
func rtuGateway(t *testing.T, respond func([]byte) []byte) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = listener.Close() })
	go func() {
		connection, acceptErr := listener.Accept()
		if acceptErr != nil {
			return
		}
		defer connection.Close()
		_ = connection.SetDeadline(time.Now().Add(3 * time.Second))
		request := make([]byte, 8)
		if _, readErr := io.ReadFull(connection, request); readErr != nil {
			t.Errorf("读取 RTU 请求失败: %v", readErr)
			return
		}
		if reply := respond(request); reply != nil {
			if writeErr := writeFrame(connection, reply); writeErr != nil {
				t.Errorf("写出 RTU 响应失败: %v", writeErr)
			}
		}
	}()
	return listener.Addr().String()
}

// TestRTUOverTCPRoundTrip 核对标准 CRC 向量及真实回环读写线缆。
func TestRTUOverTCPRoundTrip(t *testing.T) {
	request := []byte{1, 3, 0, 0, 0, 10}
	if crc := rtuCRC(request); crc != 0xcdc5 {
		t.Fatalf("标准 RTU CRC 错误: %04x", crc)
	}
	address := rtuGateway(t, func(frame []byte) []byte {
		if !bytes.Equal(frame, []byte{1, 3, 0, 10, 0, 1, 0xa4, 0x08}) {
			t.Errorf("RTU 读请求线缆错误: %x", frame)
		}
		return rtuReply(1, []byte{3, 2, 1, 2})
	})
	values, err := (Client{Address: address, UnitID: 1, RTUOverTCP: true}).ReadHoldingRegisters(context.Background(), 10, 1)
	if err != nil || len(values) != 1 || values[0] != 258 {
		t.Fatalf("RTU 回环读失败: values=%v err=%v", values, err)
	}
	address = rtuGateway(t, func(frame []byte) []byte {
		if frame[0] != 1 || frame[1] != 6 || binary.BigEndian.Uint16(frame[2:4]) != 10 || binary.BigEndian.Uint16(frame[4:6]) != 258 || binary.LittleEndian.Uint16(frame[6:8]) != rtuCRC(frame[:6]) {
			t.Errorf("RTU 写请求线缆错误: %x", frame)
		}
		return rtuReply(1, frame[1:6])
	})
	if err := (Client{Address: address, UnitID: 1, RTUOverTCP: true}).WriteSingleRegister(context.Background(), 10, 258); err != nil {
		t.Fatalf("RTU 回环写失败: %v", err)
	}
}

// TestRTURejectsBadResponses 核对异常帧及错误单元号、功能码、字节数和 CRC。
func TestRTURejectsBadResponses(t *testing.T) {
	tests := []struct {
		name, message string
		reply         func() []byte
	}{
		{"exception", "exception code 2", func() []byte { return rtuReply(1, []byte{0x83, 2}) }},
		{"unit", "unit", func() []byte { return rtuReply(2, []byte{3, 2, 0, 1}) }},
		{"function", "function", func() []byte { return rtuReply(1, []byte{4, 2, 0, 1}) }},
		{"byte-count", "byte count", func() []byte { return rtuReply(1, []byte{3, 0}) }},
		{"crc", "crc", func() []byte { frame := rtuReply(1, []byte{3, 2, 0, 1}); frame[len(frame)-1] ^= 0xff; return frame }},
	}
	for _, item := range tests {
		t.Run(item.name, func(t *testing.T) {
			address := rtuGateway(t, func([]byte) []byte { return item.reply() })
			_, err := (Client{Address: address, UnitID: 1, RTUOverTCP: true}).ReadHoldingRegisters(context.Background(), 0, 1)
			if err == nil || !strings.Contains(err.Error(), item.message) {
				t.Fatalf("未拒绝无效 RTU 响应: %v", err)
			}
		})
	}
}
