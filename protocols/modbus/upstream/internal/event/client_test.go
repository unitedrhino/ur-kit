// 本文件以本机 Modbus 设备验证平台配置到公开 SDK 会话的读写接线。
package event

import (
	"context"
	"encoding/binary"
	"io"
	"net"
	"testing"

	"gitee.com/unitedrhino/protocol/modbus/internal/domain"
	"gitee.com/unitedrhino/things/share/domain/schema"
)

// TestClientConfigPreservesSerialDefaults 验证默认串口参数与旧驱动一致。
func TestClientConfigPreservesSerialDefaults(t *testing.T) {
	client, err := clientConfig(map[string]string{"mode": "rtu", "address": "/dev/tty-test"})
	if err != nil {
		t.Fatal(err)
	}
	if client.UnitID != 0 || client.Serial == nil || client.Serial.BaudRate != 19200 || client.Serial.DataBits != 8 || client.Serial.StopBits != 2 || client.Serial.Parity != "N" {
		t.Fatalf("unexpected serial defaults: %+v", client)
	}
	client, err = clientConfig(map[string]string{"mode": "rtu", "address": "/dev/tty-test", "parity": "1"})
	if err != nil || client.Serial.StopBits != 1 || client.Serial.Parity != "E" {
		t.Fatalf("unexpected even parity defaults: %+v err=%v", client.Serial, err)
	}
}

// TestConfiguredSessionReadWrite 验证平台 TCP 配置可在同一连接完成读写。
func TestConfiguredSessionReadWrite(t *testing.T) {
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
		for transaction := uint16(1); transaction <= 2; transaction++ {
			request := make([]byte, 12)
			if _, err := io.ReadFull(connection, request); err != nil {
				done <- err
				return
			}
			if binary.BigEndian.Uint16(request[:2]) != transaction || request[6] != 0 {
				done <- io.ErrUnexpectedEOF
				return
			}
			var pdu []byte
			if transaction == 1 {
				if request[7] != 3 {
					done <- io.ErrUnexpectedEOF
					return
				}
				pdu = []byte{3, 2, 0, 42}
			} else {
				if request[7] != 16 {
					done <- io.ErrUnexpectedEOF
					return
				}
				pdu = []byte{16, 0, 10, 0, 1}
				// 功能码 16 请求比读请求长；读取剩余数量与字节数。
				remaining := make([]byte, 3)
				if _, err := io.ReadFull(connection, remaining); err != nil {
					done <- err
					return
				}
			}
			response := make([]byte, 7+len(pdu))
			binary.BigEndian.PutUint16(response[:2], transaction)
			binary.BigEndian.PutUint16(response[4:6], uint16(len(pdu)+1))
			copy(response[7:], pdu)
			if _, err := connection.Write(response); err != nil {
				done <- err
				return
			}
		}
		done <- nil
	}()
	client, err := clientConfig(map[string]string{"mode": "tcp", "address": listener.Addr().String()})
	if err != nil {
		t.Fatal(err)
	}
	session, err := client.OpenSession(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()
	device := &domain.DevInfo{Point: map[string]*domain.Point{"temperature": {Address: 10, Quantity: 1, RegisterType: domain.HoldingRegister, ValueType: domain.ValueTypeUint16, Schema: schema.Property{CommonParam: schema.CommonParam{Identifier: "temperature"}}}}}
	device.SetSession(session)
	values, err := ReadDev(context.Background(), device)
	if err != nil || values["temperature"] != uint16(42) {
		t.Fatalf("read values=%v err=%v", values, err)
	}
	if err := session.Client().WriteMultipleRegisters(context.Background(), 10, []uint16{258}); err != nil {
		t.Fatal(err)
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}
