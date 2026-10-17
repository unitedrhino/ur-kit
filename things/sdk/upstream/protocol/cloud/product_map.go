// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件提供独立协议服务的外部产品 ID 映射，支持完整分页刷新与原子替换。
package cloud

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// ProductIDMap 保存外部产品 ID 到平台产品 ID 的最近一次完整快照。
type ProductIDMap struct {
	mu       sync.RWMutex
	byRemote map[string]string
	platform []string
}

// Refresh 按协议分页读取产品；读取或校验失败时保留原快照。
// source 提供平台 RPC、协议代码和页大小，field 指明协议配置中的外部产品 ID 字段。
func (mapping *ProductIDMap) Refresh(ctx context.Context, source GRPCProductSource, field string) error {
	if mapping == nil || source.Client == nil || source.ProtocolCode == "" || field == "" {
		return errors.New("product map, client, protocol code and ID field are required")
	}
	size := source.PageSize
	if size <= 0 {
		size = 100
	}
	byRemote := make(map[string]string)
	seenProducts := make(map[string]struct{})
	platform := make([]string, 0)
	var processed int64
	total := int64(-1)
	for page := int64(1); ; page++ {
		response, err := source.Client.ProductInfoGetList(ctx, &dm.ProductInfoGetListReq{
			Page: &dm.PageInfo{Page: page, Size: size}, ProtocolCode: source.ProtocolCode,
		}, grpc.WaitForReady(true))
		if err != nil {
			return fmt.Errorf("fetch protocol products page %d: %w", page, err)
		}
		if response == nil || response.Total < 0 || int64(len(response.List)) > size ||
			total >= 0 && response.Total != total ||
			len(response.List) == 0 && processed < response.Total ||
			processed+int64(len(response.List)) > response.Total {
			return fmt.Errorf("invalid protocol products page %d", page)
		}
		total = response.Total
		for _, product := range response.List {
			if product == nil || product.ProductID == "" {
				return fmt.Errorf("invalid protocol product on page %d", page)
			}
			if _, exists := seenProducts[product.ProductID]; exists {
				return fmt.Errorf("duplicate protocol product %s on page %d", product.ProductID, page)
			}
			seenProducts[product.ProductID] = struct{}{}
			properties := product.ProtocolConf
			if product.GetSubProtocolCode().GetValue() == source.ProtocolCode {
				properties = product.SubProtocolConf
			}
			remoteID := properties[field]
			if remoteID == "" {
				continue
			}
			if previous, exists := byRemote[remoteID]; exists && previous != product.ProductID {
				return fmt.Errorf("duplicate external product ID %q", remoteID)
			}
			byRemote[remoteID] = product.ProductID
			platform = append(platform, product.ProductID)
		}
		processed += int64(len(response.List))
		if processed >= total {
			break
		}
	}
	mapping.mu.Lock()
	mapping.byRemote = byRemote
	mapping.platform = platform
	mapping.mu.Unlock()
	return nil
}

// Get 返回外部产品 ID 对应的平台产品 ID；不存在时返回空字符串。
func (mapping *ProductIDMap) Get(remoteID string) string {
	if mapping == nil {
		return ""
	}
	mapping.mu.RLock()
	defer mapping.mu.RUnlock()
	return mapping.byRemote[remoteID]
}

// PlatformIDs 返回当前快照内的平台产品 ID 副本。
func (mapping *ProductIDMap) PlatformIDs() []string {
	if mapping == nil {
		return nil
	}
	mapping.mu.RLock()
	defer mapping.mu.RUnlock()
	return append([]string(nil), mapping.platform...)
}
