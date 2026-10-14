//go:build linux

// 本文件用 Linux 伪串口缓冲区核对连接检查没有发送设备命令。
package modbus

import (
	"context"
	"testing"

	"github.com/creack/pty"
	"golang.org/x/sys/unix"
)

// TestSerialProbeNoCommand 验证串口配置检查只打开端口，不写入设备指令。
func TestSerialProbeNoCommand(t *testing.T) {
	master, slave, err := pty.Open()
	if err != nil {
		t.Fatal(err)
	}
	defer master.Close()
	defer slave.Close()
	client := Client{Address: slave.Name(), Serial: &SerialConfig{Parity: "N"}}
	if err := client.Probe(context.Background()); err != nil {
		t.Fatal(err)
	}
	pending, err := unix.IoctlGetInt(int(master.Fd()), unix.TIOCINQ)
	if err != nil {
		t.Fatal(err)
	}
	if pending != 0 {
		t.Fatalf("串口配置检查发送了 %d 字节设备指令", pending)
	}
}
