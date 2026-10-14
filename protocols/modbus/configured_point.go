// 本文件将原 Modbus 点位 JSON 的寄存器类型和位域配置映射到独立 TCP 客户端。
package modbus

import (
	"context"
	"errors"
	"fmt"
	"strings"
)

// Point 描述线圈、离散输入、输入寄存器或保持寄存器的设备点位。
type Point struct {
	Identifier   string `json:"identifier"`
	Address      uint16 `json:"address"`
	RegisterType string `json:"registerType"`
	ValueType    string `json:"valueType"`
	StrLen       uint16 `json:"strLen"`
	Bit          uint8  `json:"bit"`
	BitLen       uint8  `json:"bitLen"`
	ByteSwap     bool   `json:"byteSwap"`
	WordSwap     bool   `json:"wordSwap"`
	MultiWrite   bool   `json:"multiWrite"`
}

// holding 转换为公共保持寄存器编解码配置，保留原点位线缆排列参数。
func (point Point) holding() HoldingPoint {
	return HoldingPoint{
		Address: point.Address, ValueType: point.ValueType, StrLen: point.StrLen,
		ByteSwap: point.ByteSwap, WordSwap: point.WordSwap, MultiWrite: point.MultiWrite,
	}
}

// bitMask 验证单个 16 位保持寄存器的位域范围，返回左移后的掩码。
func (point Point) bitMask() (uint16, error) {
	if strings.ToLower(point.ValueType) != "uint16" || point.BitLen == 0 || point.BitLen > 16 || int(point.Bit)+int(point.BitLen) > 16 {
		return 0, errors.New("bit field requires uint16 and a range inside one register")
	}
	return uint16((uint32(1)<<point.BitLen - 1) << point.Bit), nil
}

// ReadPoint 按点位的 registerType 读取布尔量或指定数值类型；位域返回 uint16。
func (client Client) ReadPoint(ctx context.Context, point Point) (any, error) {
	switch strings.ToUpper(point.RegisterType) {
	case "COIL", "DISCRETE_INPUT":
		if point.BitLen != 0 {
			return nil, errors.New("bit field is only supported for holding registers")
		}
		var values []bool
		var err error
		if strings.EqualFold(point.RegisterType, "COIL") {
			values, err = client.ReadCoils(ctx, point.Address, 1)
		} else {
			values, err = client.ReadDiscreteInputs(ctx, point.Address, 1)
		}
		if err != nil {
			return nil, err
		}
		return values[0], nil
	case "INPUT_REGISTER", "HOLDING_REGISTER":
		holding := point.holding()
		quantity, err := holding.quantity()
		if err != nil {
			return nil, err
		}
		if point.BitLen > 0 && (strings.ToUpper(point.RegisterType) != "HOLDING_REGISTER" || quantity != 1) {
			return nil, errors.New("bit field is only supported for one holding register")
		}
		var mask uint16
		if point.BitLen > 0 {
			mask, err = point.bitMask()
			if err != nil {
				return nil, err
			}
		}
		var registers []uint16
		if strings.EqualFold(point.RegisterType, "INPUT_REGISTER") {
			registers, err = client.ReadInputRegisters(ctx, point.Address, uint16(quantity))
		} else {
			registers, err = client.ReadHoldingRegisters(ctx, point.Address, uint16(quantity))
		}
		if err != nil {
			return nil, err
		}
		value, err := holding.Decode(registers)
		if err != nil || point.BitLen == 0 {
			return value, err
		}
		return (value.(uint16) & mask) >> point.Bit, nil
	default:
		return nil, fmt.Errorf("unsupported modbus register type %q", point.RegisterType)
	}
}

// WritePoint 写入线圈或保持寄存器；位域先读取原字并只替换选中的位。
func (client Client) WritePoint(ctx context.Context, point Point, value any) error {
	switch strings.ToUpper(point.RegisterType) {
	case "COIL":
		if point.BitLen != 0 {
			return errors.New("bit field is only supported for holding registers")
		}
		boolean, ok := value.(bool)
		if !ok {
			return errors.New("coil value must be bool")
		}
		return client.WriteSingleCoil(ctx, point.Address, boolean)
	case "HOLDING_REGISTER":
		holding := point.holding()
		if point.BitLen == 0 {
			return client.WriteHoldingPoint(ctx, holding, value)
		}
		mask, err := point.bitMask()
		if err != nil {
			return err
		}
		field, ok := value.(uint16)
		if !ok || uint32(field) >= uint32(1)<<point.BitLen {
			return errors.New("bit field value must be uint16 within configured width")
		}
		registers, err := client.ReadHoldingRegisters(ctx, point.Address, 1)
		if err != nil {
			return err
		}
		decoded, err := holding.Decode(registers)
		if err != nil {
			return err
		}
		merged := decoded.(uint16)&^mask | field<<point.Bit
		return client.WriteHoldingPoint(ctx, holding, merged)
	default:
		return fmt.Errorf("modbus register type %q is read-only or unsupported", point.RegisterType)
	}
}
