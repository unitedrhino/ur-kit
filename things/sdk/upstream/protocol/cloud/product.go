// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件通过本仓 Things RPC 将产品的协议配置键映射到已生效的云协议配置。
package cloud

import (
	"context"
	"errors"
	"fmt"

	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// GRPCProductSource 按协议代码读取平台产品；调用方负责提供具备读取权限的 RPC 上下文。
type GRPCProductSource struct {
	Client       dm.ProductManageClient
	ProtocolCode string
	PageSize     int64
}

// ForEachConfig 遍历使用指定配置字段的产品，单个产品处理失败时继续处理其他产品。
func ForEachConfig[C any](ctx context.Context, source GRPCProductSource, field string, manager *ConfigManager[C], handle func(context.Context, C, *dm.ProductInfo) error) error {
	if source.Client == nil || source.ProtocolCode == "" || field == "" || manager == nil || handle == nil {
		return errors.New("product client, protocol code, field, config manager and handler are required")
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
		resp, err := source.Client.ProductInfoGetList(ctx, &dm.ProductInfoGetListReq{
			Page: &dm.PageInfo{Page: page, Size: size}, ProtocolCode: source.ProtocolCode,
		}, grpc.WaitForReady(true))
		if err != nil {
			return errors.Join(append(failures, fmt.Errorf("fetch protocol products page %d: %w", page, err))...)
		}
		if resp == nil || resp.Total < 0 || int64(len(resp.List)) > size ||
			page > 1 && resp.Total != total ||
			len(resp.List) == 0 && processed < resp.Total ||
			processed+int64(len(resp.List)) > resp.Total {
			return errors.Join(append(failures, fmt.Errorf("invalid products page %d", page))...)
		}
		total = resp.Total
		for _, product := range resp.List {
			if product == nil || product.ProductID == "" {
				return errors.Join(append(failures, fmt.Errorf("invalid product on page %d", page))...)
			}
			if _, exists := seen[product.ProductID]; exists {
				return errors.Join(append(failures, fmt.Errorf("duplicate product %s on page %d", product.ProductID, page))...)
			}
			seen[product.ProductID] = struct{}{}
			properties := product.ProtocolConf
			if product.GetSubProtocolCode().GetValue() == source.ProtocolCode {
				properties = product.SubProtocolConf
			}
			config, exists := manager.Get(properties[field])
			if !exists {
				continue
			}
			if err := handle(ctx, config, product); err != nil {
				failures = append(failures, fmt.Errorf("sync product %s: %w", product.ProductID, err))
			}
		}
		processed += int64(len(resp.List))
		if processed >= total {
			return errors.Join(failures...)
		}
	}
}
