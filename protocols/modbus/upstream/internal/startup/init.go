package startup

import (
	"context"
	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"gitee.com/unitedrhino/things/share/devices"
	"github.com/zeromicro/go-zero/core/logx"
	"gitee.com/unitedrhino/protocol/modbus/internal/event"
	"gitee.com/unitedrhino/protocol/modbus/internal/svc"
)

func Init(svcCtx *svc.ServiceContext) {
	logx.Must(svcCtx.Protocol.Start())
	ConnInit(svcCtx)
	svcCtx.Protocol.RegisterDeviceMsgDownHandler(func(ctx context.Context, info *devices.InnerPublish) error {
		return event.MsgDown(ctx, svcCtx, info)
	})
}

func ConnInit(svcCtx *svc.ServiceContext) {
	ctx := ctxs.WithRoot(context.Background())
	dis, err := svcCtx.Protocol.DeviceM.DeviceInfoGetList(ctx, &dm.DeviceInfoGetListReq{ProtocolCode: svcCtx.Protocol.Pi.Code})
	logx.Must(err)
	for _, di := range dis.List {
		devInfo, err := event.NewDeviceInfo(ctx, svcCtx, di)
		if err != nil {
			logx.Error(di, err)
			continue
		}
		svcCtx.DevCli[devices.Core{ProductID: di.ProductID, DeviceName: di.DeviceName}] = devInfo
	}
}

//func DevInit(ctx context.Context, svcCtx *svc.ServiceContext, di *dm.DeviceInfo) error {
//	cfg, err := svcCtx.Protocol.GetDevProtocolConf(ctx, di)
//	if err != nil {
//		return err
//	}
//	if cfg == nil {
//		return nil
//	}
//	timeout := cast.ToUint(cfg["timeout"])
//	if timeout == 0 {
//		timeout = 1000
//	}
//	client, err := modbus.NewClient(&modbus.ClientConfiguration{
//		URL:      fmt.Sprintf("%s://%s", cfg["mode"], cfg["address"]),
//		Speed:    cast.ToUint(cfg["baudRate"]),
//		DataBits: cast.ToUint(cfg["dataBits"]),
//		Parity:   cast.ToUint(cfg["parity"]),
//		StopBits: cast.ToUint(cfg["stopBits"]),
//		Timeout:  time.Duration(timeout) * time.Millisecond,
//	})
//	if err != nil {
//		return err
//	}
//	err = client.Open()
//	if err != nil {
//		return err
//	}
//	value, err := client.ReadRegisters(0, 5, modbus.HOLDING_REGISTER)
//	fmt.Print(value, err)
//	value2, err := client.ReadCoils(0, 5)
//	fmt.Print(value2, err)
//	svcCtx.DevCliMutex.Lock()
//	defer svcCtx.DevCliMutex.Unlock()
//	svcCtx.DevCli[devices.Core{ProductID: di.ProductID, DeviceName: di.DeviceName}] = client
//	return nil
//}
