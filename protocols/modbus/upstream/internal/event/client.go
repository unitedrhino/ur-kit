// 本文件把平台设备协议配置转换为公开 Modbus SDK 的连接参数。
package event

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/spf13/cast"
	sdkmodbus "github.com/unitedrhino/ur-kit/protocols/modbus"
)

// clientConfig 按旧驱动线缆默认值构建 SDK 客户端；站号默认为 0。
func clientConfig(cfg map[string]string) (sdkmodbus.Client, error) {
	timeout := cast.ToUint(cfg["timeout"])
	if timeout == 0 {
		timeout = 1000
	}
	client := sdkmodbus.Client{Address: cfg["address"], Timeout: time.Duration(timeout) * time.Millisecond}
	switch strings.ToLower(strings.TrimSpace(cfg["mode"])) {
	case "tcp":
	case "udp":
		client.UDP = true
	case "rtuovertcp":
		client.RTUOverTCP = true
	case "rtuoverudp":
		client.RTUOverUDP = true
	case "rtu":
		parity := "N"
		switch cast.ToUint(cfg["parity"]) {
		case 0:
		case 1:
			parity = "E"
		case 2:
			parity = "O"
		default:
			return client, errors.New("unsupported modbus serial parity")
		}
		stopBits := int(cast.ToUint(cfg["stopBits"]))
		if stopBits == 0 {
			stopBits = 1
			if parity == "N" {
				stopBits = 2
			}
		}
		baudRate := int(cast.ToUint(cfg["baudRate"]))
		if baudRate == 0 {
			baudRate = 19200
		}
		dataBits := int(cast.ToUint(cfg["dataBits"]))
		if dataBits == 0 {
			dataBits = 8
		}
		client.Serial = &sdkmodbus.SerialConfig{BaudRate: baudRate, DataBits: dataBits, StopBits: stopBits, Parity: parity}
	case "tcp+tls":
		return client, errors.New("tcp+tls requires a client certificate and trusted root certificate")
	default:
		return client, fmt.Errorf("unsupported modbus mode: %s", cfg["mode"])
	}
	return client, nil
}
