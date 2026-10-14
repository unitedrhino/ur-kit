// 本文件实现可复用的 RTU CRC 帧交换，供串口和 TCP 网关接入使用。
package modbus

import (
	"encoding/binary"
	"errors"
	"fmt"
	"io"
)

// rtuCRC 计算 Modbus RTU 帧的低位优先 CRC16 校验值。
func rtuCRC(frame []byte) uint16 {
	crc := uint16(0xffff)
	for _, value := range frame {
		crc ^= uint16(value)
		for bit := 0; bit < 8; bit++ {
			if crc&1 != 0 {
				crc = crc>>1 ^ 0xa001
			} else {
				crc >>= 1
			}
		}
	}
	return crc
}

// exchangeRTU 写出带单元号和 CRC 的请求，并按功能码确定响应长度与边界。
func exchangeRTU(connection io.ReadWriter, unit byte, requestPDU []byte) ([]byte, error) {
	frame := make([]byte, 1+len(requestPDU)+2)
	frame[0] = unit
	copy(frame[1:], requestPDU)
	binary.LittleEndian.PutUint16(frame[len(frame)-2:], rtuCRC(frame[:len(frame)-2]))
	if err := writeFrame(connection, frame); err != nil {
		return nil, err
	}
	prefix := make([]byte, 3)
	if _, err := io.ReadFull(connection, prefix); err != nil {
		return nil, err
	}
	if prefix[0] != unit {
		return nil, errors.New("invalid modbus rtu unit")
	}
	responseLength := 0
	switch prefix[1] {
	case requestPDU[0] | 0x80:
		responseLength = 5
	case requestPDU[0]:
		switch requestPDU[0] {
		case 1, 2, 3, 4:
			if prefix[2] == 0 || prefix[2] > 250 {
				return nil, errors.New("invalid modbus rtu byte count")
			}
			responseLength = 3 + int(prefix[2]) + 2
		case 5, 6, 15, 16:
			responseLength = 8
		default:
			return nil, errors.New("unsupported modbus rtu function")
		}
	default:
		return nil, errors.New("invalid modbus rtu function")
	}
	response := make([]byte, responseLength)
	copy(response, prefix)
	if _, err := io.ReadFull(connection, response[len(prefix):]); err != nil {
		return nil, err
	}
	if binary.LittleEndian.Uint16(response[len(response)-2:]) != rtuCRC(response[:len(response)-2]) {
		return nil, errors.New("invalid modbus rtu crc")
	}
	if prefix[1] == requestPDU[0]|0x80 {
		return nil, fmt.Errorf("modbus exception code %d", prefix[2])
	}
	return response[1 : len(response)-2], nil
}
