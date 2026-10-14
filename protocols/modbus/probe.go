// 本文件提供无设备读写副作用的 Modbus 传输连通检查，供配置页验证连接参数。
package modbus

import (
	"context"
	"crypto/tls"
	"errors"
	"net"
	"time"

	"github.com/goburrow/serial"
)

// Probe 只建立并关闭传输连接，不发送 Modbus 功能码；UDP 仅能核验本机套接字可创建。
func (client Client) Probe(ctx context.Context) error {
	if client.Address == "" {
		return errors.New("modbus address is empty")
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	if client.Serial != nil {
		if client.TLS != nil || client.UDP || client.RTUOverTCP || client.RTUOverUDP {
			return errors.New("modbus serial cannot combine with network transport or tls")
		}
		port, err := serial.Open(&serial.Config{
			Address:  client.Address,
			BaudRate: client.Serial.BaudRate,
			DataBits: client.Serial.DataBits,
			StopBits: client.Serial.StopBits,
			Parity:   client.Serial.Parity,
		})
		if err != nil {
			return err
		}
		defer port.Close()
		return ctx.Err()
	}
	if (client.UDP || client.RTUOverUDP) && (client.TLS != nil || client.RTUOverTCP) {
		return errors.New("modbus udp cannot combine with tls or rtu over tcp")
	}
	timeout := client.Timeout
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	probeCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	dialer := &net.Dialer{Timeout: timeout}
	var connection net.Conn
	var err error
	if client.UDP || client.RTUOverUDP {
		connection, err = dialer.DialContext(probeCtx, "udp", client.Address)
	} else if client.TLS != nil {
		connection, err = (&tls.Dialer{NetDialer: dialer, Config: client.TLS.Clone()}).DialContext(probeCtx, "tcp", client.Address)
	} else {
		connection, err = dialer.DialContext(probeCtx, "tcp", client.Address)
	}
	if err != nil {
		return err
	}
	defer connection.Close()
	return probeCtx.Err()
}
