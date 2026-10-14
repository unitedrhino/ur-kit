// 本文件验证配置连通检查只建立传输连接，不向设备发送功能码。
package modbus

import (
	"context"
	"errors"
	"io"
	"net"
	"strings"
	"testing"
	"time"
)

// TestProbeTCPNoCommand 验证 TCP 检查完成连接后立即关闭且不发送设备请求。
func TestProbeTCPNoCommand(t *testing.T) {
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
		_ = connection.SetReadDeadline(time.Now().Add(time.Second))
		buffer := make([]byte, 1)
		_, err = connection.Read(buffer)
		done <- err
	}()
	if err := (Client{Address: listener.Addr().String(), Timeout: time.Second}).Probe(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := <-done; !errors.Is(err, io.EOF) {
		t.Fatalf("连通检查向设备发送了数据或未关闭连接: %v", err)
	}
}

// TestProbeRejectsInvalidMode 验证探测入口与读写入口使用相同的传输互斥规则。
func TestProbeRejectsInvalidMode(t *testing.T) {
	err := (Client{Address: "127.0.0.1:1", UDP: true, RTUOverTCP: true}).Probe(context.Background())
	if err == nil || !strings.Contains(err.Error(), "cannot combine") {
		t.Fatalf("未拒绝混合模式: %v", err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := (Client{Address: "127.0.0.1:1"}).Probe(ctx); !errors.Is(err, context.Canceled) {
		t.Fatalf("取消的探测仍尝试连接: %v", err)
	}
}
