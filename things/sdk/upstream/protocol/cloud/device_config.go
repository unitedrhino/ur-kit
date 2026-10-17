// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件在本仓协议 SDK 中选择设备的主协议或子协议配置。
package cloud

import (
	"context"
	"errors"
	"fmt"

	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/configselect"
)

// ProductLookup 由接入方提供产品查询，可使用平台 RPC 或调用方缓存。
type ProductLookup func(context.Context, string) (*dm.ProductInfo, error)

// DeviceProtocolConfig 根据产品的子协议归属选择设备对应的配置字段。
// lookup 查询设备所属产品，protocolCode 是当前协议代码，device 是待查询设备。
func DeviceProtocolConfig(ctx context.Context, lookup ProductLookup, protocolCode string, device *dm.DeviceInfo) (map[string]string, error) {
	if lookup == nil || protocolCode == "" || device == nil || device.ProductID == "" {
		return nil, errors.New("product lookup, protocol code and device product ID are required")
	}
	product, err := lookup(ctx, device.ProductID)
	if err != nil {
		return nil, fmt.Errorf("lookup product %s: %w", device.ProductID, err)
	}
	if product == nil || product.ProductID != device.ProductID {
		return nil, errors.New("device product lookup returned a mismatched product")
	}
	var subCode *string
	if product.SubProtocolCode != nil {
		value := product.SubProtocolCode.GetValue()
		subCode = &value
	}
	return configselect.Select(protocolCode, subCode, device.ProtocolConf, device.SubProtocolConf), nil
}
