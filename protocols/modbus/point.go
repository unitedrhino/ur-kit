// 本文件提供与原 Modbus 点位配置相容的保持寄存器数值转换，不依赖 Things 服务内部包。
package modbus

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"math"
	"strings"
)

// HoldingPoint 描述保持寄存器点位的地址、数值类型及设备字节排列。
type HoldingPoint struct {
	Address    uint16 `json:"address"`
	ValueType  string `json:"valueType"`
	StrLen     uint16 `json:"strLen"`
	ByteSwap   bool   `json:"byteSwap"`
	WordSwap   bool   `json:"wordSwap"`
	MultiWrite bool   `json:"multiWrite"`
}

// quantity 返回点位占用的寄存器数量，并拒绝超出 Modbus 单次读取范围的配置。
func (point HoldingPoint) quantity() (int, error) {
	var count int
	switch strings.ToLower(point.ValueType) {
	case "uint16", "int16":
		count = 1
	case "uint32", "int32", "float32":
		count = 2
	case "uint64", "int64", "float64":
		count = 4
	case "string":
		count = int(point.StrLen)
	default:
		return 0, fmt.Errorf("unsupported modbus value type %q", point.ValueType)
	}
	if count < 1 || count > 125 || uint32(point.Address)+uint32(count) > 65536 {
		return 0, errors.New("point register range must contain 1..125 values within address space")
	}
	return count, nil
}

// ReadHoldingPoint 读取点位并将寄存器按配置转换为 Go 的有符号数、无符号数、浮点数或字符串。
func (client Client) ReadHoldingPoint(ctx context.Context, point HoldingPoint) (any, error) {
	quantity, err := point.quantity()
	if err != nil {
		return nil, err
	}
	registers, err := client.ReadHoldingRegisters(ctx, point.Address, uint16(quantity))
	if err != nil {
		return nil, err
	}
	return point.Decode(registers)
}

// WriteHoldingPoint 将给定 Go 值按点位配置编码，使用功能码 6 或 16 写入设备。
func (client Client) WriteHoldingPoint(ctx context.Context, point HoldingPoint, value any) error {
	registers, err := point.Encode(value)
	if err != nil {
		return err
	}
	if len(registers) == 1 && !point.MultiWrite {
		return client.WriteSingleRegister(ctx, point.Address, registers[0])
	}
	return client.WriteMultipleRegisters(ctx, point.Address, registers)
}

// Decode 将设备字序的寄存器转换为点位指定的 Go 值；寄存器数量必须与配置相等。
func (point HoldingPoint) Decode(registers []uint16) (any, error) {
	quantity, err := point.quantity()
	if err != nil {
		return nil, err
	}
	if len(registers) != quantity {
		return nil, fmt.Errorf("point requires %d registers, got %d", quantity, len(registers))
	}
	data := make([]byte, quantity*2)
	for index, value := range registers {
		binary.BigEndian.PutUint16(data[index*2:], value)
	}
	point.reorder(data)
	switch strings.ToLower(point.ValueType) {
	case "uint16":
		return binary.BigEndian.Uint16(data), nil
	case "int16":
		return int16(binary.BigEndian.Uint16(data)), nil
	case "uint32":
		return binary.BigEndian.Uint32(data), nil
	case "int32":
		return int32(binary.BigEndian.Uint32(data)), nil
	case "float32":
		return math.Float32frombits(binary.BigEndian.Uint32(data)), nil
	case "uint64":
		return binary.BigEndian.Uint64(data), nil
	case "int64":
		return int64(binary.BigEndian.Uint64(data)), nil
	case "float64":
		return math.Float64frombits(binary.BigEndian.Uint64(data)), nil
	case "string":
		return strings.TrimRight(string(data), "\x00"), nil
	default:
		return nil, fmt.Errorf("unsupported modbus value type %q", point.ValueType)
	}
}

// Encode 将点位指定类型的 Go 值转换为设备字序的寄存器，拒绝隐式截断和类型转换。
func (point HoldingPoint) Encode(value any) ([]uint16, error) {
	quantity, err := point.quantity()
	if err != nil {
		return nil, err
	}
	if quantity > 123 {
		return nil, errors.New("point exceeds Modbus multiple-write limit of 123 registers")
	}
	data := make([]byte, quantity*2)
	switch strings.ToLower(point.ValueType) {
	case "uint16":
		v, ok := value.(uint16)
		if !ok {
			return nil, errors.New("point value must be uint16")
		}
		binary.BigEndian.PutUint16(data, v)
	case "int16":
		v, ok := value.(int16)
		if !ok {
			return nil, errors.New("point value must be int16")
		}
		binary.BigEndian.PutUint16(data, uint16(v))
	case "uint32":
		v, ok := value.(uint32)
		if !ok {
			return nil, errors.New("point value must be uint32")
		}
		binary.BigEndian.PutUint32(data, v)
	case "int32":
		v, ok := value.(int32)
		if !ok {
			return nil, errors.New("point value must be int32")
		}
		binary.BigEndian.PutUint32(data, uint32(v))
	case "float32":
		v, ok := value.(float32)
		if !ok {
			return nil, errors.New("point value must be float32")
		}
		binary.BigEndian.PutUint32(data, math.Float32bits(v))
	case "uint64":
		v, ok := value.(uint64)
		if !ok {
			return nil, errors.New("point value must be uint64")
		}
		binary.BigEndian.PutUint64(data, v)
	case "int64":
		v, ok := value.(int64)
		if !ok {
			return nil, errors.New("point value must be int64")
		}
		binary.BigEndian.PutUint64(data, uint64(v))
	case "float64":
		v, ok := value.(float64)
		if !ok {
			return nil, errors.New("point value must be float64")
		}
		binary.BigEndian.PutUint64(data, math.Float64bits(v))
	case "string":
		v, ok := value.(string)
		if !ok {
			return nil, errors.New("point value must be string")
		}
		if len(v) > len(data) {
			return nil, errors.New("point string exceeds configured register length")
		}
		copy(data, v)
	}
	point.reorder(data)
	registers := make([]uint16, quantity)
	for index := range registers {
		registers[index] = binary.BigEndian.Uint16(data[index*2:])
	}
	return registers, nil
}

// reorder 对称交换每个寄存器内的字节和相邻寄存器的字序，奇数个寄存器保留末尾单字。
func (point HoldingPoint) reorder(data []byte) {
	if point.ByteSwap {
		for index := 0; index < len(data); index += 2 {
			data[index], data[index+1] = data[index+1], data[index]
		}
	}
	if point.WordSwap {
		for index := 0; index+3 < len(data); index += 4 {
			data[index], data[index+2] = data[index+2], data[index]
			data[index+1], data[index+3] = data[index+3], data[index+1]
		}
	}
}
