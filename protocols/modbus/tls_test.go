// 本文件用本机证书和模拟设备验证 Modbus TCP 的 TLS 连接与证书校验。
package modbus

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"io"
	"math/big"
	"net"
	"reflect"
	"strings"
	"testing"
	"time"
)

// localTLSConfig 生成仅对本机回环地址有效的测试证书与客户端信任链。
func localTLSConfig(t *testing.T) (*tls.Config, *tls.Config) {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	issued := time.Now()
	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "modbus-local-test"},
		NotBefore:    issued.Add(-time.Minute),
		NotAfter:     issued.Add(time.Hour),
		KeyUsage:     x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	certificate, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}
	roots := x509.NewCertPool()
	roots.AddCert(certificate)
	return &tls.Config{MinVersion: tls.VersionTLS12, Certificates: []tls.Certificate{{Certificate: [][]byte{der}, PrivateKey: key}}}, &tls.Config{MinVersion: tls.VersionTLS12, RootCAs: roots}
}

// TestRTUOverTLSRoundTrip 验证加密传输仍按 RTU 单元号和 CRC 解析设备响应。
func TestRTUOverTLSRoundTrip(t *testing.T) {
	serverTLS, clientTLS := localTLSConfig(t)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	secureListener := tls.NewListener(listener, serverTLS)
	defer secureListener.Close()
	done := make(chan error, 1)
	go func() {
		connection, acceptErr := secureListener.Accept()
		if acceptErr != nil {
			done <- acceptErr
			return
		}
		defer connection.Close()
		_ = connection.SetDeadline(time.Now().Add(3 * time.Second))
		request := make([]byte, 8)
		if _, readErr := io.ReadFull(connection, request); readErr != nil {
			done <- readErr
			return
		}
		if request[0] != 1 || request[1] != 3 || rtuCRC(request[:6]) != uint16(request[6])|uint16(request[7])<<8 {
			done <- io.ErrUnexpectedEOF
			return
		}
		done <- writeFrame(connection, rtuReply(1, []byte{3, 2, 1, 2}))
	}()
	values, err := (Client{Address: listener.Addr().String(), UnitID: 1, RTUOverTCP: true, TLS: clientTLS}).ReadHoldingRegisters(context.Background(), 10, 1)
	if err != nil || !reflect.DeepEqual(values, []uint16{258}) {
		t.Fatalf("RTU TLS 回环读数=%v, err=%v", values, err)
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

// TestClientTLSRoundTrip 验证加密连接的寄存器读写和不受信任证书的拒绝。
func TestClientTLSRoundTrip(t *testing.T) {
	serverTLS, clientTLS := localTLSConfig(t)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	secureListener := tls.NewListener(listener, serverTLS)
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	initial := make([]uint16, 11)
	initial[10] = 42
	go func() { done <- NewSimulator(initial).Serve(ctx, secureListener) }()
	t.Cleanup(func() {
		cancel()
		_ = secureListener.Close()
		if err := <-done; err != nil {
			t.Errorf("模拟设备退出失败: %v", err)
		}
	})
	client := Client{Address: listener.Addr().String(), UnitID: 7, TLS: clientTLS}
	values, err := client.ReadHoldingRegisters(ctx, 10, 1)
	if err != nil || !reflect.DeepEqual(values, []uint16{42}) {
		t.Fatalf("TLS 初始读数=%v, err=%v", values, err)
	}
	if err := client.WriteSingleRegister(ctx, 10, 258); err != nil {
		t.Fatal(err)
	}
	values, err = client.ReadHoldingRegisters(ctx, 10, 1)
	if err != nil || !reflect.DeepEqual(values, []uint16{258}) {
		t.Fatalf("TLS 更新读数=%v, err=%v", values, err)
	}
	if _, err := (Client{Address: listener.Addr().String(), UnitID: 7, TLS: &tls.Config{MinVersion: tls.VersionTLS12}}).ReadHoldingRegisters(ctx, 10, 1); err == nil || !strings.Contains(err.Error(), "certificate") {
		t.Fatalf("未拒绝不受信任的设备证书: %v", err)
	}
}

// TestClientTLSHandshakeTimeout 验证已连通但不握手的设备不会无限占用请求。
func TestClientTLSHandshakeTimeout(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	done := make(chan struct{})
	go func() {
		defer close(done)
		connection, acceptErr := listener.Accept()
		if acceptErr != nil {
			return
		}
		defer connection.Close()
		_, _ = io.Copy(io.Discard, connection)
	}()
	started := time.Now()
	_, err = (Client{Address: listener.Addr().String(), UnitID: 1, Timeout: 150 * time.Millisecond, TLS: &tls.Config{MinVersion: tls.VersionTLS12}}).ReadHoldingRegisters(context.Background(), 0, 1)
	if err == nil || time.Since(started) > 2*time.Second {
		t.Fatalf("TLS 握手未按超时退出: %v", err)
	}
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("握手超时后连接仍未关闭")
	}
}
