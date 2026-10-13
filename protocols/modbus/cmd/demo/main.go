// 本文件运行一个本地 Modbus TCP 设备，并用公开客户端演示寄存器读写。
package main

import (
	"context"
	"fmt"
	"net"
	"os"

	"github.com/unitedrhino/ur-kit/protocols/modbus"
)

// main 启动回环地址模拟设备，读取、写入并再次读取寄存器。
func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

// run 完成本地功能码 3/6 演示，并等待模拟设备结束。
func run() error {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return err
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	initial := make([]uint16, 16)
	initial[10] = 42
	go func() { done <- modbus.NewSimulator(initial).Serve(ctx, listener) }()
	defer func() { cancel(); <-done }()
	client := modbus.Client{Address: listener.Addr().String(), UnitID: 1}
	before, err := client.ReadHoldingRegisters(ctx, 10, 1)
	if err != nil {
		return err
	}
	if err := client.WriteSingleRegister(ctx, 10, 258); err != nil {
		return err
	}
	after, err := client.ReadHoldingRegisters(ctx, 10, 1)
	if err != nil {
		return err
	}
	fmt.Printf("holding register 10: %d -> %d\n", before[0], after[0])
	return nil
}
