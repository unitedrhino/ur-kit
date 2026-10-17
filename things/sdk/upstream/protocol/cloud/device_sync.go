// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件将平台产品配置、设备分页与协议周期任务连接为可复用的设备同步入口。
package cloud

import (
	"context"
	"errors"
	"time"

	"gitee.com/unitedrhino/things/sdk/protocol/core"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
)

// DeviceSyncHandler 按产品配置处理单个设备；返回错误时继续处理同产品的其他设备。
type DeviceSyncHandler[C any] func(context.Context, C, *dm.ProductInfo, *dm.DeviceInfo) error

// RegisterDeviceSync 将产品与设备分页同步登记到协议周期任务；应在云协议启动前调用。
// field 是产品主/子协议配置中指向云配置的字段，handler 执行具体设备同步动作。
func RegisterDeviceSync[C any](timer *core.Timer, products GRPCProductSource, devices GRPCDeviceSource, field string, manager *ConfigManager[C], handler DeviceSyncHandler[C]) error {
	if timer == nil || products.Client == nil || products.ProtocolCode == "" || devices.Client == nil || field == "" || manager == nil || handler == nil {
		return errors.New("timer, product and device clients, protocol code, field, manager and handler are required")
	}
	return timer.RegisterHandler(func(ctx context.Context, _ time.Time) error {
		return ForEachConfig(ctx, products, field, manager, func(ctx context.Context, config C, product *dm.ProductInfo) error {
			return devices.ForEachDevice(ctx, product.ProductID, func(ctx context.Context, device *dm.DeviceInfo) error {
				return handler(ctx, config, product, device)
			})
		})
	})
}
