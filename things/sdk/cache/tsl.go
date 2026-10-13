// 本文件通过公开 Things RPC 缓存并聚合产品与设备物模型 JSON，保留平台扩展字段。
package cache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/unitedrhino/ur-kit/cache/common"
	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// ProductTSLReader 是产品物模型缓存所需的公开 RPC 接口。
type ProductTSLReader interface {
	ProductSchemaTslGetOne(context.Context, *dm.ProductSchemaTslGetOneReq, ...grpc.CallOption) (*dm.ProductSchemaTslGetOneResp, error)
}

// DeviceTSLReader 是设备物模型缓存所需的公开 RPC 接口。
type DeviceTSLReader interface {
	DeviceSchemaTslGetOne(context.Context, *dm.DeviceSchemaTslGetOneReq, ...grpc.CallOption) (*dm.DeviceSchemaTslGetOneResp, error)
}

// TSLCache 按企业隔离物模型，并记录产品与设备缓存的失效关系。
type TSLCache struct {
	products  *common.Cache[ProductKey, []byte]
	devices   *common.Cache[DeviceKey, []byte]
	mu        sync.Mutex
	byProduct map[ProductKey]map[DeviceKey]struct{}
}

// NewTSLCache 用公开 RPC 客户端及正 TTL 建立产品与设备物模型缓存。
func NewTSLCache(ttl time.Duration, product ProductTSLReader, device DeviceTSLReader) (*TSLCache, error) {
	if product == nil || device == nil {
		return nil, errors.New("product and device TSL readers are required")
	}
	result := &TSLCache{byProduct: make(map[ProductKey]map[DeviceKey]struct{})}
	var err error
	result.products, err = common.NewCache(ttl, func(ctx context.Context, key ProductKey) ([]byte, bool, error) {
		response, err := product.ProductSchemaTslGetOne(ctx, &dm.ProductSchemaTslGetOneReq{ProductID: key.ProductID})
		if err != nil {
			return nil, false, err
		}
		if response == nil {
			return nil, false, errors.New("product TSL response is empty")
		}
		data, err := parseTSL(response.Tsl)
		return data, err == nil, err
	})
	if err != nil {
		return nil, err
	}
	result.devices, err = common.NewCache(ttl, func(ctx context.Context, key DeviceKey) ([]byte, bool, error) {
		response, err := device.DeviceSchemaTslGetOne(ctx, &dm.DeviceSchemaTslGetOneReq{ProductID: key.ProductID, DeviceName: key.DeviceName})
		if err != nil {
			return nil, false, err
		}
		if response == nil {
			return nil, false, errors.New("device TSL response is empty")
		}
		own, err := parseTSL(response.Tsl)
		if err != nil {
			return nil, false, err
		}
		parent, parentErr := result.product(ctx, ProductKey{TenantCode: key.TenantCode, ProductID: key.ProductID})
		if parentErr != nil && !hasFeatures(own) {
			return nil, false, parentErr
		}
		if parentErr != nil {
			return own, true, nil
		}
		merged, err := aggregateTSL(own, parent)
		return merged, err == nil, err
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// Product 返回产品物模型 JSON 的副本，调用方需提供匹配企业的认证上下文。
func (cache *TSLCache) Product(ctx context.Context, key ProductKey) ([]byte, error) {
	if cache == nil || cache.products == nil || strings.TrimSpace(key.TenantCode) == "" || strings.TrimSpace(key.ProductID) == "" {
		return nil, errors.New("product cache, tenant code and product ID are required")
	}
	return cache.product(ctx, key)
}

// product 读取已经校验过键的产品物模型并复制返回值。
func (cache *TSLCache) product(ctx context.Context, key ProductKey) ([]byte, error) {
	data, found, err := cache.products.Get(ctx, key)
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, errors.New("product TSL not found")
	}
	return append([]byte(nil), data...), nil
}

// Device 返回设备覆盖产品后的物模型 JSON 副本，空设备模型继承产品模型。
func (cache *TSLCache) Device(ctx context.Context, key DeviceKey) ([]byte, error) {
	if cache == nil || cache.devices == nil || strings.TrimSpace(key.TenantCode) == "" || strings.TrimSpace(key.ProductID) == "" || strings.TrimSpace(key.DeviceName) == "" {
		return nil, errors.New("device cache, tenant code, product ID and device name are required")
	}
	parent := ProductKey{TenantCode: key.TenantCode, ProductID: key.ProductID}
	cache.mu.Lock()
	if cache.byProduct[parent] == nil {
		cache.byProduct[parent] = make(map[DeviceKey]struct{})
	}
	cache.byProduct[parent][key] = struct{}{}
	cache.mu.Unlock()
	data, found, err := cache.devices.Get(ctx, key)
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, errors.New("device TSL not found")
	}
	return append([]byte(nil), data...), nil
}

// InvalidateProduct 删除产品及其已读取设备物模型，阻止旧 RPC 响应回填。
func (cache *TSLCache) InvalidateProduct(key ProductKey) {
	if cache == nil || cache.products == nil || cache.devices == nil {
		return
	}
	cache.mu.Lock()
	cache.products.Invalidate(key)
	for device := range cache.byProduct[key] {
		cache.devices.Invalidate(device)
	}
	delete(cache.byProduct, key)
	cache.mu.Unlock()
}

// InvalidateDevice 删除指定设备的物模型缓存。
func (cache *TSLCache) InvalidateDevice(key DeviceKey) {
	if cache != nil && cache.devices != nil {
		cache.devices.Invalidate(key)
	}
}

// parseTSL 校验 JSON 根对象；空设备物模型可用空对象表示。
func parseTSL(raw string) ([]byte, error) {
	if strings.TrimSpace(raw) == "" {
		raw = "{}"
	}
	var object map[string]json.RawMessage
	if err := json.Unmarshal([]byte(raw), &object); err != nil || object == nil {
		return nil, errors.New("TSL must be a JSON object")
	}
	for _, field := range []string{"properties", "events", "actions"} {
		entries, err := tslEntries(object[field])
		if err != nil {
			return nil, fmt.Errorf("TSL %s: %w", field, err)
		}
		for _, item := range entries {
			if _, err := tslIdentifier(item); err != nil {
				return nil, fmt.Errorf("TSL %s: %w", field, err)
			}
		}
	}
	return []byte(raw), nil
}

// hasFeatures 判断设备自身是否包含属性、事件或行为，用于产品 RPC 失败时降级。
func hasFeatures(raw []byte) bool {
	var object map[string]json.RawMessage
	if json.Unmarshal(raw, &object) != nil {
		return false
	}
	for _, field := range []string{"properties", "events", "actions"} {
		var entries []json.RawMessage
		if json.Unmarshal(object[field], &entries) == nil && len(entries) > 0 {
			return true
		}
	}
	return false
}

// aggregateTSL 将产品中未被设备定义覆盖的条目附加到设备 JSON，保留未知字段。
func aggregateTSL(device, product []byte) ([]byte, error) {
	var own, parent map[string]json.RawMessage
	if err := json.Unmarshal(device, &own); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(product, &parent); err != nil {
		return nil, err
	}
	for field, value := range parent {
		if _, exists := own[field]; !exists {
			own[field] = value
		}
	}
	seen := make(map[string]struct{})
	for _, field := range []string{"properties", "events", "actions"} {
		entries, err := tslEntries(own[field])
		if err != nil {
			return nil, fmt.Errorf("device %s: %w", field, err)
		}
		inherited, err := tslEntries(parent[field])
		if err != nil {
			return nil, fmt.Errorf("product %s: %w", field, err)
		}
		for _, item := range entries {
			identifier, err := tslIdentifier(item)
			if err != nil {
				return nil, err
			}
			seen[identifier] = struct{}{}
		}
		for _, item := range inherited {
			identifier, err := tslIdentifier(item)
			if err != nil {
				return nil, err
			}
			if _, exists := seen[identifier]; !exists {
				entries = append(entries, item)
				seen[identifier] = struct{}{}
			}
		}
		if len(entries) > 0 {
			own[field], err = json.Marshal(entries)
			if err != nil {
				return nil, err
			}
		}
	}
	return json.Marshal(own)
}

// tslEntries 解析模型条目列表，并拒绝非数组字段。
func tslEntries(raw json.RawMessage) ([]json.RawMessage, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return nil, nil
	}
	var entries []json.RawMessage
	if err := json.Unmarshal(raw, &entries); err != nil || entries == nil {
		return nil, errors.New("TSL feature list must be an array")
	}
	return entries, nil
}

// tslIdentifier 读取物模型条目标识，兼容历史 id 字段。
func tslIdentifier(raw json.RawMessage) (string, error) {
	var entry struct {
		Identifier string `json:"identifier"`
		ID         string `json:"id"`
	}
	if err := json.Unmarshal(raw, &entry); err != nil {
		return "", err
	}
	if entry.Identifier != "" {
		return entry.Identifier, nil
	}
	if entry.ID != "" {
		return entry.ID, nil
	}
	return "", errors.New("TSL feature identifier is required")
}
