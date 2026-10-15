// 本文件把平台属性控制请求映射为公开 Modbus SDK 的设备写入。
package event

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"gitee.com/unitedrhino/protocol/modbus/internal/domain"
	"gitee.com/unitedrhino/protocol/modbus/internal/svc"
	"gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/utils"
	"gitee.com/unitedrhino/things/share/devices"
	"gitee.com/unitedrhino/things/share/domain/deviceMsg/msgThing"
	"github.com/spf13/cast"
	sdkmodbus "github.com/unitedrhino/ur-kit/protocols/modbus"
	"github.com/zeromicro/go-zero/core/logx"
	"math"
	"strconv"
	"strings"
	"time"
)

// MsgDown 校验设备会话与点位类型，执行线圈或保持寄存器写入。
func MsgDown(ctx context.Context, svcCtx *svc.ServiceContext, info *devices.InnerPublish) error {
	log := logx.WithContext(ctx)
	log.Info(info)
	if info.Handle != devices.Thing || info.Type != msgThing.TypeProperty {
		return errors.NotRealize
	}
	var req msgThing.Req
	err := json.Unmarshal(info.Payload, &req)
	if err != nil {
		return err
	}
	if !utils.SliceIn(req.Method, "control") {
		return nil
	}
	dev := devices.Core{ProductID: info.ProductID, DeviceName: info.DeviceName}
	c, ok := svcCtx.DevCli[dev]
	var client *sdkmodbus.Client
	if ok {
		client = c.Client()
	}
	if client == nil {
		err = ErrResp(ctx, svcCtx, info, &req, errors.NotFind)
		if err != nil {
			return err
		}
		return nil
	}
	for k, value := range req.Params {
		p := c.Point[k]
		if p == nil {
			continue
		}
		switch p.RegisterType {
		case domain.Coil: // 线圈固定长度1
			err := client.WriteSingleCoil(ctx, p.Address, cast.ToBool(value))
			if err != nil {
				log.Error(err.Error())
			}
		case domain.HoldingRegister:
			var values []uint16
			err := func() error {
				valueStr := fmt.Sprintf("%v", value)
				switch strings.ToUpper(p.ValueType) {
				case strings.ToUpper(domain.ValueTypeInt16), strings.ToUpper(domain.ValueTypeUint16):
					v, err := strconv.ParseUint(valueStr, 10, 16)
					if err != nil {
						return err
					}
					if p.BitLen > 0 {
						if v > (1<<p.BitLen - 1) {
							return fmt.Errorf("too large value %value to set in %d bits", v, p.BitLen)
						} else if v < 0 {
							return fmt.Errorf("negative value %value not allowed to set in bits", v)
						}
						var uint16s []uint16
						var err error
						uint16s, err = readRegisters(ctx, *client, p.Address, p.Quantity, p.RegisterType)
						if err != nil {
							return fmt.Errorf("read original register error: %value", err)
						}
						uint16Val := uint16s[0]
						if p.ByteSwap {
							uint16Val = (uint16Val << 8) | (uint16Val >> 8)
						}
						intoUint16 := mergeBitsIntoUint16(int(v), p.Bit, p.BitLen, uint16Val)
						if p.ByteSwap {
							intoUint16 = (intoUint16 << 8) | (intoUint16 >> 8)
						}
						values = []uint16{intoUint16}
						break
					}
					out := make([]byte, 2)
					if p.ByteSwap {
						binary.LittleEndian.PutUint16(out, uint16(v))
					} else {
						binary.BigEndian.PutUint16(out, uint16(v))
					}
					values = []uint16{binary.BigEndian.Uint16(out)}
				case strings.ToUpper(domain.ValueTypeUint32):
					v, err := strconv.ParseUint(valueStr, 10, 32)
					if err != nil {
						return fmt.Errorf("convert value %value to uint32 error: %value", value, err)
					}
					out := make([]byte, 4)
					if p.ByteSwap {
						binary.LittleEndian.PutUint32(out, uint32(v))
					} else {
						binary.BigEndian.PutUint32(out, uint32(v))
					}
					if p.WordSwap {
						out[0], out[1], out[2], out[3] =
							out[2], out[3], out[0], out[1]
					}
					values = []uint16{binary.BigEndian.Uint16([]byte{out[2], out[3]}),
						binary.BigEndian.Uint16([]byte{out[0], out[1]})}
				case strings.ToUpper(domain.ValueTypeInt32):
					v, err := strconv.ParseInt(valueStr, 10, 32)
					if err != nil {
						return fmt.Errorf("convert value %value to int32 error: %value", value, err)
					}
					out := make([]byte, 4)
					if p.ByteSwap {
						binary.LittleEndian.PutUint32(out, uint32(v))
					} else {
						binary.BigEndian.PutUint32(out, uint32(v))
					}
					if p.WordSwap {
						out[0], out[1], out[2], out[3] =
							out[2], out[3], out[0], out[1]
					}
					values = []uint16{binary.BigEndian.Uint16([]byte{out[2], out[3]}),
						binary.BigEndian.Uint16([]byte{out[0], out[1]})}
				case strings.ToUpper(domain.ValueTypeFloat32):
					v, err := strconv.ParseFloat(valueStr, 32)
					if err != nil {
						return fmt.Errorf("convert value %value to float32 error: %value", value, err)
					}
					v32 := float32(v)
					bits := math.Float32bits(v32)
					out := make([]byte, 4)
					if p.ByteSwap {
						binary.LittleEndian.PutUint32(out, bits)
					} else {
						binary.BigEndian.PutUint32(out, bits)
					}
					if p.WordSwap {
						out[0], out[1], out[2], out[3] =
							out[2], out[3], out[0], out[1]
					}
					values = []uint16{binary.BigEndian.Uint16([]byte{out[2], out[3]}),
						binary.BigEndian.Uint16([]byte{out[0], out[1]})}
				case strings.ToUpper(domain.ValueTypeUint64):
					v, err := strconv.ParseUint(valueStr, 10, 64)
					if err != nil {
						return fmt.Errorf("convert value %value to uint64 error: %value", value, err)
					}
					out := make([]byte, 8)
					if p.ByteSwap {
						binary.LittleEndian.PutUint64(out, v)
					} else {
						binary.BigEndian.PutUint64(out, v)
					}
					if p.WordSwap {
						out[0], out[1], out[2], out[3], out[4], out[5], out[6], out[7] =
							out[2], out[3], out[0], out[1], out[6], out[7], out[4], out[5]
					}
					values = []uint16{
						binary.BigEndian.Uint16([]byte{out[6], out[7]}),
						binary.BigEndian.Uint16([]byte{out[4], out[5]}),
						binary.BigEndian.Uint16([]byte{out[2], out[3]}),
						binary.BigEndian.Uint16([]byte{out[0], out[1]}),
					}
				case strings.ToUpper(domain.ValueTypeInt64):
					v, err := strconv.ParseInt(valueStr, 10, 64)
					if err != nil {
						return fmt.Errorf("convert value %value to int64 error: %value", value, err)
					}
					out := make([]byte, 8)
					if p.ByteSwap {
						binary.LittleEndian.PutUint64(out, uint64(v))
					} else {
						binary.BigEndian.PutUint64(out, uint64(v))
					}
					if p.WordSwap {
						out[0], out[1], out[2], out[3], out[4], out[5], out[6], out[7] =
							out[2], out[3], out[0], out[1], out[6], out[7], out[4], out[5]
					}
					values = []uint16{
						binary.BigEndian.Uint16([]byte{out[6], out[7]}),
						binary.BigEndian.Uint16([]byte{out[4], out[5]}),
						binary.BigEndian.Uint16([]byte{out[2], out[3]}),
						binary.BigEndian.Uint16([]byte{out[0], out[1]}),
					}
				case strings.ToUpper(domain.ValueTypeFloat64):
					v, err := strconv.ParseFloat(valueStr, 64)
					if err != nil {
						return fmt.Errorf("convert value %value to float64 error: %value", value, err)
					}
					out := make([]byte, 8)
					if p.ByteSwap {
						binary.LittleEndian.PutUint64(out, math.Float64bits(v))
					} else {
						binary.BigEndian.PutUint64(out, math.Float64bits(v))
					}
					if p.WordSwap {
						out[0], out[1], out[2], out[3], out[4], out[5], out[6], out[7] =
							out[2], out[3], out[0], out[1], out[6], out[7], out[4], out[5]
					}
					values = []uint16{
						binary.BigEndian.Uint16([]byte{out[6], out[7]}),
						binary.BigEndian.Uint16([]byte{out[4], out[5]}),
						binary.BigEndian.Uint16([]byte{out[2], out[3]}),
						binary.BigEndian.Uint16([]byte{out[0], out[1]}),
					}
				case strings.ToUpper(domain.ValueTypeString):
					valueBytes := []byte(valueStr)
					if len(valueBytes) > int(p.Quantity*2) {
						return fmt.Errorf("too long string [%value] to set in %d registers", valueStr, p.Quantity)
					}
					if p.ByteSwap {
						for i := 0; i < len(valueBytes); i += 2 {
							if i+1 < len(valueBytes) {
								valueBytes[i], valueBytes[i+1] = valueBytes[i+1], valueBytes[i]
							}
						}
					}
					if p.WordSwap {
						for i := 0; i < len(valueBytes); i += 4 {
							if i+3 < len(valueBytes) {
								valueBytes[i], valueBytes[i+1], valueBytes[i+2], valueBytes[i+3] =
									valueBytes[i+2], valueBytes[i+3], valueBytes[i], valueBytes[i+1]
							}
						}
					}
					values = make([]uint16, p.Quantity)
					for i := 0; i < len(valueBytes); i += 2 {
						if i+1 < len(valueBytes) {
							values[i/2] = binary.BigEndian.Uint16(valueBytes[i : i+2])
						} else {
							values[i/2] = binary.BigEndian.Uint16([]byte{valueBytes[i], 0})
						}
					}
					for i := 0; i < len(values)/2; i++ {
						values[i], values[len(values)-1-i] = values[len(values)-1-i], values[i]
					}
				default:
					return fmt.Errorf("unsupported raw type: %value", p)
				}

				return nil
			}()
			if err != nil {
				ErrResp(ctx, svcCtx, info, &req, err)
				return nil
			}
			if len(values) > 0 {
				err := client.WriteMultipleRegisters(ctx, p.Address, values)
				if err != nil {
					return err
				}
			}
		default:
			return fmt.Errorf("unsupported write register type: %value", p)
		}
	}
	ErrResp(ctx, svcCtx, info, &req, errors.OK)
	return nil
}

var (
	ControlSucc = `
{
  "method":"%v",
  "msgToken":"%s",
  "code":%v,
  "msg":"%v"
}
 
`
)

var respMap = map[string]string{
	"getReport": "getReportReply",
	"control":   "controlReply",
}

func ErrResp(ctx context.Context, svcCtx *svc.ServiceContext, info *devices.InnerPublish, req *msgThing.Req, err error) error {
	e := errors.Fmt(err)
	err = svcCtx.Protocol.DevPubMsg(ctx, &devices.DevPublish{
		Timestamp:  time.Now().UnixMilli(),
		ProductID:  info.ProductID,
		DeviceName: info.DeviceName,
		Handle:     info.Handle,
		Type:       info.Type,
		Payload:    []byte(fmt.Sprintf(ControlSucc, respMap[req.Method], req.MsgToken, e.Code, e.GetMsg())),
	})
	if err != nil {
		return err
	}
	return err
}
