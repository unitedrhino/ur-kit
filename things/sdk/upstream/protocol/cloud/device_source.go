// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件提供云协议按产品同步设备时使用的本仓 Things RPC 分页适配器。
package cloud

import (
	"context"
	"errors"
	"fmt"

	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// GRPCDeviceSource 读取单个产品的设备；调用方提供已授权的平台 RPC 客户端。
type GRPCDeviceSource struct {
	Client   dm.DeviceManageClient
	PageSize int64
}

// ForEachDevice 分页遍历产品设备；逐个处理失败时继续并汇总错误，分页失败时立即停止。
// ctx 承载平台授权上下文，productID 限定目标产品，handle 处理单个设备并返回错误。
func (source GRPCDeviceSource) ForEachDevice(ctx context.Context, productID string, handle func(context.Context, *dm.DeviceInfo) error) error {
	if source.Client == nil || productID == "" || handle == nil {
		return errors.New("device client, product ID and handler are required")
	}
	size := source.PageSize
	if size <= 0 {
		size = 100
	}
	var processed, total int64
	var failures []error
	seen := make(map[string]struct{})
	for page := int64(1); ; page++ {
		if err := ctx.Err(); err != nil {
			return errors.Join(append(failures, err)...)
		}
		response, err := source.Client.DeviceInfoGetList(ctx, &dm.DeviceInfoGetListReq{
			Page: &dm.PageInfo{Page: page, Size: size}, ProductID: productID,
		}, grpc.WaitForReady(true))
		if err != nil {
			return errors.Join(append(failures, fmt.Errorf("fetch devices page %d: %w", page, err))...)
		}
		if response == nil || response.Total < 0 || int64(len(response.List)) > size ||
			page > 1 && response.Total != total ||
			len(response.List) == 0 && processed < response.Total ||
			processed+int64(len(response.List)) > response.Total {
			return errors.Join(append(failures, fmt.Errorf("invalid devices page %d", page))...)
		}
		total = response.Total
		for _, device := range response.List {
			if device == nil || device.ProductID != productID || device.DeviceName == "" {
				return errors.Join(append(failures, fmt.Errorf("invalid device on page %d", page))...)
			}
			if _, exists := seen[device.DeviceName]; exists {
				return errors.Join(append(failures, fmt.Errorf("duplicate device %s/%s on page %d", productID, device.DeviceName, page))...)
			}
			seen[device.DeviceName] = struct{}{}
			if err := handle(ctx, device); err != nil {
				failures = append(failures, fmt.Errorf("sync device %s/%s: %w", productID, device.DeviceName, err))
			}
		}
		processed += int64(len(response.List))
		if processed >= total {
			return errors.Join(failures...)
		}
	}
}
