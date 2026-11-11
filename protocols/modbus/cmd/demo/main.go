// 本文件演示 Modbus TCP 读写，也可为平台网关持续提供模拟设备。
package main

import (
	"context"
	"flag"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/unitedrhino/ur-kit/protocols/modbus"
)

// main 根据监听参数启动持续运行的模拟设备，或执行一次本地读写演示。
func main() {
	listen := flag.String("listen", "", "持续运行模拟设备的 TCP 地址，例如 127.0.0.1:15020")
	flag.Parse()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, *listen); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

// run 使用同一组初始寄存器演示读写；指定地址时等待网关连接，直到上下文取消。
func run(ctx context.Context, listen string) error {
	address := listen
	if address == "" {
		address = "127.0.0.1:0"
	}
	listener, err := net.Listen("tcp", address)
	if err != nil {
		return err
	}
	initial := make([]uint16, 16)
	initial[10] = 42
	simulator := modbus.NewSimulator(initial)
	if listen != "" {
		fmt.Printf("Modbus TCP listening on %s, holding register 10 = 42\n", listener.Addr())
		return simulator.Serve(ctx, listener)
	}
	ctx, cancel := context.WithCancel(ctx)
	done := make(chan error, 1)
	go func() { done <- simulator.Serve(ctx, listener) }()
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
