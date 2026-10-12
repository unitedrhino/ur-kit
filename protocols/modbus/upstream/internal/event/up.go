package event

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/share/def"
	"gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/utils"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"gitee.com/unitedrhino/things/share/devices"
	"gitee.com/unitedrhino/things/share/domain/deviceMsg/msgThing"
	"gitee.com/unitedrhino/things/share/domain/schema"
	"github.com/simonvetter/modbus"
	"github.com/spf13/cast"
	"github.com/zeromicro/go-zero/core/logx"
	"math"
	"gitee.com/unitedrhino/protocol/modbus/internal/domain"
	"gitee.com/unitedrhino/protocol/modbus/internal/svc"
	"strings"
	"time"
)

func NewDeviceInfo(ctx context.Context, svcCtx *svc.ServiceContext, di *dm.DeviceInfo) (*domain.DevInfo, error) {
	cfg, err := svcCtx.Protocol.GetDevProtocolConf(ctx, di)
	if err != nil {
		return nil, err
	}
	if cfg == nil {
		return nil, errors.Parameter.AddMsgf("没有定义协议配置")
	}
	dev := devices.Core{ProductID: di.ProductID, DeviceName: di.DeviceName}
	cli, err := ClientInit(ctx, svcCtx, dev)
	if err != nil {
		return nil, err
	}
	Duration := cast.ToInt64(cfg["duration"])
	if Duration == 0 {
		Duration = 10000
	}
	ss, err := svcCtx.Protocol.SchemaCache.GetData(ctx, dev)
	if err != nil {
		return nil, err
	}
	Close, c := context.WithCancel(ctx)
	var devInfo = domain.DevInfo{Di: di, Cli: cli, Close: Close, C: c, Duration: Duration, Point: BuildPoints(ctx, svcCtx, di, ss.Properties)}
	utils.Go(ctx, func() {
		Timer(svcCtx, &devInfo)
	})
	return &devInfo, nil
}

func Timer(svcCtx *svc.ServiceContext, info *domain.DevInfo) {
	t := time.NewTicker(time.Duration(info.Duration) * time.Millisecond)
	// 设备关闭后循环经 info.Close.Done() 退出;ticker 不 Stop 会随设备反复上下线
	// 每个生命周期泄漏一个定时器,与 opcua 的 Timer 同构写法对齐,退出时释放
	defer t.Stop()
	run := func() {
		ctx := ctxs.WithRoot(context.Background())
		if info.Cli == nil {
			cli, err := ClientInit(ctx, svcCtx, devices.Core{ProductID: info.Di.ProductID, DeviceName: info.Di.DeviceName})
			if err != nil {
				logx.WithContext(ctx).Error(err.Error())
				return
			}
			info.Cli = cli
		}
		if info.Cli == nil {
			return
		}
		ret, err := ReadDev(ctx, info)
		if err != nil {
			info.ErrCount++
			logx.WithContext(ctx).Error(err.Error())
			if info.ErrCount > 3 {
				info.Cli = nil
				info.ErrCount = 0
			}
			return
		}
		err = svcCtx.Protocol.DevPubMsg(ctx, &devices.DevPublish{
			Timestamp:  time.Now().UnixMilli(),
			ProductID:  info.Di.ProductID,
			DeviceName: info.Di.DeviceName,
			Handle:     devices.Thing,
			Type:       msgThing.TypeProperty,
			Payload: []byte(fmt.Sprintf(`{
  "method":"report",
  "sys": { "noAsk": true},
  "msgToken":"%v",
  "timestamp":%v,
  "params":%s
}`, svcCtx.MsgToken.Add(1), time.Now().UnixMilli(), utils.MarshalNoErr(ret))),
			ProtocolCode: svcCtx.Protocol.Pi.Code,
		})
		if err != nil {
			logx.Error(err)
		}
	}
	run()
	for {
		select {
		case <-t.C:
			run()
		case <-info.Close.Done():
			return
		}
	}

}

func ClientInit(ctx context.Context, svcCtx *svc.ServiceContext, dev devices.Core) (*modbus.ModbusClient, error) {
	di, err := svcCtx.Protocol.DeviceCache.GetData(ctx, dev)
	if err != nil {
		return nil, err
	}
	cfg, err := svcCtx.Protocol.GetDevProtocolConf(ctx, di)
	if err != nil {
		return nil, err
	}
	if cfg == nil {
		return nil, errors.Parameter.AddMsgf("没有定义协议配置")
	}
	timeout := cast.ToUint(cfg["timeout"])
	if timeout == 0 {
		timeout = 1000
	}
	client, err := modbus.NewClient(&modbus.ClientConfiguration{
		URL:      fmt.Sprintf("%s://%s", cfg["mode"], cfg["address"]),
		Speed:    cast.ToUint(cfg["baudRate"]),
		DataBits: cast.ToUint(cfg["dataBits"]),
		Parity:   cast.ToUint(cfg["parity"]),
		StopBits: cast.ToUint(cfg["stopBits"]),
		Timeout:  time.Duration(timeout) * time.Millisecond,
	})
	if err != nil {
		if di.IsOnline == def.True {
			err := svcCtx.Protocol.ReportDevConn(ctx, devices.DevConn{
				Timestamp:  time.Now().UnixMilli(),
				Reason:     "设备下线",
				Action:     devices.ActionDisconnected,
				ProductID:  di.ProductID,
				DeviceName: di.DeviceName,
			})
			if err != nil {
				logx.WithContext(ctx).Error(err.Error())
			}
		}
		return nil, err
	}
	err = client.Open()
	if err != nil {
		if di.IsOnline == def.True {
			err := svcCtx.Protocol.ReportDevConn(ctx, devices.DevConn{
				Timestamp:  time.Now().UnixMilli(),
				Reason:     "设备连接失败",
				Action:     devices.ActionDisconnected,
				ProductID:  di.ProductID,
				DeviceName: di.DeviceName,
			})
			if err != nil {
				logx.WithContext(ctx).Error(err.Error())
			}
		}
		return nil, nil
	}
	if di.IsOnline == def.False {
		err := svcCtx.Protocol.ReportDevConn(ctx, devices.DevConn{
			Timestamp:  time.Now().UnixMilli(),
			Action:     devices.ActionConnected,
			ProductID:  di.ProductID,
			DeviceName: di.DeviceName,
		})
		if err != nil {
			logx.WithContext(ctx).Error(err.Error())
		}
	}
	return client, nil
}

func AddPoint(property schema.Property) (*domain.Point, error) {
	var p domain.Point
	err := json.Unmarshal([]byte(property.ExtendConfig), &p)
	if err != nil {
		return nil, err
	}
	p.Schema = property
	if err := p.InitQuantity(); err != nil {
		return nil, err
	}
	return &p, nil
}

// ProductPointsKey 产品协议配置(dm_product_info.protocol_conf)中点位映射 JSON 的键名,
// 值为 Point 数组 JSON(每个点位需带 identifier 关联物模型属性)。
const ProductPointsKey = "points"

// BuildPoints 构建设备的点位映射:优先读产品协议配置中的 points JSON(新方式),
// 未配置时回退到物模型属性的 extendConfig(旧方式,保持兼容)。
func BuildPoints(ctx context.Context, svcCtx *svc.ServiceContext, di *dm.DeviceInfo, properties []schema.Property) map[string]*domain.Point {
	if pi, err := svcCtx.Protocol.ProductCache.GetData(ctx, di.ProductID); err == nil {
		if pointsJSON := svcCtx.Protocol.GetProtocolConf(pi)[ProductPointsKey]; pointsJSON != "" {
			points, err := ParsePointsJSON(properties, pointsJSON)
			if err != nil {
				logx.WithContext(ctx).Errorf("modbus product points json unmarshal err:%v", err)
			} else {
				return points
			}
		}
	}
	// 兼容旧方式:从物模型属性的 extendConfig 读取点位配置
	var points = map[string]*domain.Point{}
	for _, s := range properties {
		p, err := AddPoint(s)
		if err != nil {
			logx.WithContext(ctx).Errorf("add point err:%v", err)
			continue
		}
		points[p.Schema.Identifier] = p
	}
	return points
}

// ParsePointsJSON 解析产品协议配置中的点位 JSON(Point 数组,每个点位带 identifier),
// 按 identifier 关联物模型属性并计算寄存器数量。identifier 不在物模型中或
// 点位参数非法时跳过该点位并记录日志;JSON 解析失败时整体返回错误。
func ParsePointsJSON(properties []schema.Property, pointsJSON string) (map[string]*domain.Point, error) {
	var pts []*domain.Point
	if err := json.Unmarshal([]byte(pointsJSON), &pts); err != nil {
		return nil, err
	}
	propMap := make(map[string]schema.Property, len(properties))
	for _, s := range properties {
		propMap[s.Identifier] = s
	}
	var points = map[string]*domain.Point{}
	for _, p := range pts {
		prop, ok := propMap[p.Identifier]
		if !ok {
			logx.Errorf("modbus point identifier:%v not in product schema", p.Identifier)
			continue
		}
		p.Schema = prop
		if err := p.InitQuantity(); err != nil {
			logx.Errorf("modbus point identifier:%v init quantity err:%v", p.Identifier, err)
			continue
		}
		points[p.Identifier] = p
	}
	return points, nil
}

var (
	RegMap = map[domain.RegisterType]modbus.RegType{
		domain.HoldingRegister: modbus.HOLDING_REGISTER,
		domain.InputRegister:   modbus.INPUT_REGISTER,
	}
)

func ReadDev(ctx context.Context, dev *domain.DevInfo) (map[string]any, error) {
	if dev.Cli == nil {
		return nil, nil
	}
	var errCount int64
	var readCount int64
	var retMap = make(map[string]any)
	for _, p := range dev.Point {
		readCount++
		var value interface{}
		switch p.RegisterType {
		case domain.Coil:
			val, err := dev.Cli.ReadCoil(p.Address)
			if err != nil {
				logx.WithContext(ctx).Error(err.Error())
				errCount++
				continue
			}
			value = val
		case domain.DiscreteInput:
			val, err := dev.Cli.ReadDiscreteInput(p.Address)
			if err != nil {
				logx.WithContext(ctx).Error(err.Error())
				errCount++
				continue
			}
			value = val
		case domain.InputRegister, domain.HoldingRegister:
			values, err := dev.Cli.ReadRegisters(p.Address, p.Quantity, RegMap[p.RegisterType])
			if err != nil {
				errCount++
				logx.WithContext(ctx).Error(err.Error())
				continue
			}
			rawValues := values
			switch strings.ToUpper(string(p.ValueType)) {
			case strings.ToUpper(domain.ValueTypeUint16), strings.ToUpper(domain.ValueTypeInt16):
				out := getBytesFromUint16s(rawValues, p.ByteSwap)
				val := binary.BigEndian.Uint16(out)
				// 根据bit位读取数据
				if p.BitLen > 0 {
					value = getBitsFromPosition(val, p.Bit, p.BitLen)
				} else {
					if strings.ToUpper(p.ValueType) == strings.ToUpper(domain.ValueTypeInt16) {
						value = int16(val)
					} else {
						value = val
					}
				}
			case strings.ToUpper(domain.ValueTypeUint32), strings.ToUpper(domain.ValueTypeInt32), strings.ToUpper(domain.ValueTypeFloat32):
				out := getBytesFromUint16s(rawValues, p.ByteSwap)
				out = swapWords(out, p.WordSwap)
				val := binary.BigEndian.Uint32(out)
				switch strings.ToUpper(p.ValueType) {
				case strings.ToUpper(domain.ValueTypeUint32):
					value = val
				case strings.ToUpper(domain.ValueTypeInt32):
					value = int32(val)
				case strings.ToUpper(domain.ValueTypeFloat32):
					value = math.Float32frombits(val)
				}
			case strings.ToUpper(domain.ValueTypeUint64), strings.ToUpper(domain.ValueTypeInt64), strings.ToUpper(domain.ValueTypeFloat64):
				out := getBytesFromUint16s(rawValues, p.ByteSwap)
				out = swapWords(out, p.WordSwap)
				val := binary.BigEndian.Uint64(out)
				switch strings.ToUpper(p.ValueType) {
				case strings.ToUpper(domain.ValueTypeUint64):
					value = val
				case strings.ToUpper(domain.ValueTypeInt64):
					value = int32(val)
				case strings.ToUpper(domain.ValueTypeFloat64):
					value = math.Float64frombits(val)
				}
			case strings.ToUpper(domain.ValueTypeString):
				out := getBytesFromUint16s(rawValues, p.ByteSwap)
				out = swapWords(out, p.WordSwap)
				value = string(out)
			default:
				logx.WithContext(ctx).Error(fmt.Sprintf("unsupported raw type: %v", p))
				errCount++
				continue
			}
		}
		retMap[p.Schema.Identifier] = value
	}
	if errCount > 0 && readCount == errCount {
		return nil, errors.Default
	}
	return retMap, nil
}

func getBytesFromUint16s(values []uint16, byteSwap bool) (out []byte) {
	for _, value := range values {
		bytes := make([]byte, 2)
		if byteSwap {
			binary.LittleEndian.PutUint16(bytes, value)
		} else {
			binary.BigEndian.PutUint16(bytes, value)
		}
		out = append(out, bytes...)
	}
	return
}

func swapWords(in []byte, wordSwap bool) (out []byte) {
	if len(in) >= 4 {
		for i := 0; i < len(in); i += 4 {
			if wordSwap {
				out = append(out, []byte{
					in[i+2], in[i+3], in[i], in[i+1],
				}...)
			} else {
				out = append(out, []byte{
					in[i], in[i+1], in[i+2], in[i+3],
				}...)
			}
		}
	} else {
		out = in
	}
	return
}

// 获取从指定位置开始的指定位数的值
func getBitsFromPosition(num uint16, startPos, bitCount uint8) uint16 {
	// 将指定位置后的位清零
	mask := uint16(((1 << bitCount) - 1) << startPos)
	num = num & mask
	num = num >> startPos
	return num
}

func mergeBitsIntoUint16(num int, startPos, bitCount uint8, regValue uint16) uint16 {
	// 创建掩码，用于清除要替换的位
	mask := uint16((1<<bitCount)-1) << startPos

	// 清除要替换的位
	clearedValue := regValue &^ mask

	// 将v的二进制表示左移i位，然后与清除后的值进行按位或操作
	replacedValue := clearedValue | uint16(num<<startPos)

	return replacedValue
}
