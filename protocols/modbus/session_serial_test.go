//go:build !windows

// 本文件使用伪串口验证持久会话可重复收发 RTU 帧。
package modbus

import (
	"context"
	"encoding/binary"
	"io"
	"testing"
	"time"

	"github.com/creack/pty"
)

// TestSerialSessionReusesPort 验证两次读取使用同一物理串口会话。
func TestSerialSessionReusesPort(t *testing.T) {
	master, slave, err := pty.Open()
	if err != nil {
		t.Fatal(err)
	}
	defer master.Close()
	defer slave.Close()
	_ = master.SetReadDeadline(time.Now().Add(2 * time.Second))
	done := make(chan error, 1)
	go func() {
		for index := 1; index <= 2; index++ {
			request := make([]byte, 8)
			if _, err := io.ReadFull(master, request); err != nil {
				done <- err
				return
			}
			if request[0] != 7 || request[1] != 3 || binary.LittleEndian.Uint16(request[6:]) != rtuCRC(request[:6]) {
				done <- io.ErrUnexpectedEOF
				return
			}
			if _, err := master.Write(rtuReply(7, []byte{3, 2, 0, byte(index)})); err != nil {
				done <- err
				return
			}
		}
		done <- nil
	}()
	session, err := (Client{Address: slave.Name(), UnitID: 7, Timeout: time.Second, Serial: &SerialConfig{BaudRate: 19200, DataBits: 8, StopBits: 1, Parity: "N"}}).OpenSession(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()
	for index := uint16(1); index <= 2; index++ {
		values, err := session.Client().ReadHoldingRegisters(context.Background(), 10, 1)
		if err != nil || len(values) != 1 || values[0] != index {
			t.Fatalf("read %d: values=%v err=%v", index, values, err)
		}
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}
