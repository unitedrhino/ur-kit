// 本文件在公开协议 SDK 中选择设备的主协议或子协议配置。
package cloud

import (
	"context"
	"errors"
	"fmt"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
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
	if product.GetSubProtocolCode().GetValue() == protocolCode {
		return device.SubProtocolConf, nil
	}
	return device.ProtocolConf, nil
}
