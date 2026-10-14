// 本文件用本地 TCP 设备验证 Modbus 会话连接复用、并发与断线行为。
package modbus

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"net"
	"sync"
	"testing"
	"time"
)

// TestSessionReusesConnection 验证并发请求在同一连接上串行收发且事务号递增。
func TestSessionReusesConnection(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	serverDone := make(chan error, 1)
	go func() {
		connection, err := listener.Accept()
		if err != nil {
			serverDone <- err
			return
		}
		defer connection.Close()
		for transaction := uint16(1); transaction <= 8; transaction++ {
			request := make([]byte, 12)
			if _, err := io.ReadFull(connection, request); err != nil {
				serverDone <- err
				return
			}
			if binary.BigEndian.Uint16(request[:2]) != transaction || request[6] != 7 || request[7] != 3 {
				serverDone <- errors.New("unexpected transaction or request")
				return
			}
			response := []byte{0, 0, 0, 0, 0, 5, 7, 3, 2, 0, byte(transaction)}
			binary.BigEndian.PutUint16(response[:2], transaction)
			if _, err := connection.Write(response); err != nil {
				serverDone <- err
				return
			}
		}
		serverDone <- nil
	}()
	session, err := (Client{Address: listener.Addr().String(), UnitID: 7}).OpenSession(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()
	client := session.Client()
	var wait sync.WaitGroup
	for index := 0; index < 8; index++ {
		wait.Add(1)
		go func() {
			defer wait.Done()
			values, err := client.ReadHoldingRegisters(context.Background(), 1, 1)
			if err != nil || len(values) != 1 || values[0] < 1 || values[0] > 8 {
				t.Errorf("values=%v err=%v", values, err)
			}
		}()
	}
	wait.Wait()
	if err := <-serverDone; err != nil {
		t.Fatal(err)
	}
	if err := session.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := client.ReadHoldingRegisters(context.Background(), 1, 1); !errors.Is(err, net.ErrClosed) {
		t.Fatalf("closed session error=%v", err)
	}
}

// TestSessionCancelClosesBrokenConnection 验证无响应设备不会卡住取消或复用半截响应。
func TestSessionCancelClosesBrokenConnection(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	serverReceived := make(chan struct{})
	go func() {
		connection, err := listener.Accept()
		if err != nil {
			return
		}
		defer connection.Close()
		_, _ = io.ReadFull(connection, make([]byte, 12))
		close(serverReceived)
		_, _ = io.Copy(io.Discard, connection)
	}()
	session, err := (Client{Address: listener.Addr().String(), UnitID: 7, Timeout: 5 * time.Second}).OpenSession(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()
	ctx, cancel := context.WithCancel(context.Background())
	result := make(chan error, 1)
	go func() {
		_, err := session.Client().ReadHoldingRegisters(ctx, 1, 1)
		result <- err
	}()
	select {
	case <-serverReceived:
	case <-time.After(time.Second):
		t.Fatal("request not received")
	}
	cancel()
	select {
	case err := <-result:
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("cancel error=%v", err)
		}
	case <-time.After(time.Second):
		t.Fatal("session did not cancel")
	}
	if _, err := session.Client().ReadHoldingRegisters(context.Background(), 1, 1); !errors.Is(err, net.ErrClosed) {
		t.Fatalf("broken session error=%v", err)
	}
}

// TestUDPSessionTransactions 验证复用数据报套接字时 MBAP 事务号匹配。
func TestUDPSessionTransactions(t *testing.T) {
	listener, err := net.ListenPacket("udp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	done := make(chan error, 1)
	go func() {
		for transaction := uint16(1); transaction <= 2; transaction++ {
			_ = listener.SetReadDeadline(time.Now().Add(time.Second))
			request := make([]byte, 260)
			length, address, err := listener.ReadFrom(request)
			if err != nil {
				done <- err
				return
			}
			if length != 12 || binary.BigEndian.Uint16(request[:2]) != transaction {
				done <- errors.New("unexpected udp transaction")
				return
			}
			response := []byte{0, 0, 0, 0, 0, 5, 7, 3, 2, 0, byte(transaction)}
			binary.BigEndian.PutUint16(response[:2], transaction)
			if _, err := listener.WriteTo(response, address); err != nil {
				done <- err
				return
			}
		}
		done <- nil
	}()
	session, err := (Client{Address: listener.LocalAddr().String(), UnitID: 7, UDP: true}).OpenSession(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()
	for transaction := uint16(1); transaction <= 2; transaction++ {
		values, err := session.Client().ReadHoldingRegisters(context.Background(), 10, 1)
		if err != nil || len(values) != 1 || values[0] != transaction {
			t.Fatalf("transaction=%d values=%v err=%v", transaction, values, err)
		}
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}
