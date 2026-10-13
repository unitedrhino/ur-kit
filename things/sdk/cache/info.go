// 本文件把 Things 产品与设备资料的公开 RPC 查询封装为可失效的独立 TTL 缓存。
package cache

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/unitedrhino/ur-kit/cache/common"
	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/proto"
)

// ProductInfoReader 是产品资料缓存所需的最小公开 RPC 接口。
type ProductInfoReader interface {
	ProductInfoGetOne(context.Context, *dm.ProductInfoGetOneReq, ...grpc.CallOption) (*dm.ProductInfo, error)
}

// ProductKey 用企业编码与产品 ID 隔离公开产品资料缓存。
type ProductKey struct {
	TenantCode string
	ProductID  string
}

// ProductInfoCache 在企业和产品 ID 维度缓存完整产品资料，失效由接入方在变更事件中调用。
type ProductInfoCache struct {
	cache *common.Cache[ProductKey, *dm.ProductInfo]
}

// NewProductInfoCache 用明确 TTL 和公开 RPC 客户端构建产品资料缓存。
func NewProductInfoCache(ttl time.Duration, reader ProductInfoReader) (*ProductInfoCache, error) {
	if reader == nil {
		return nil, errors.New("product info reader is required")
	}
	loaded, err := common.NewCache(ttl, func(ctx context.Context, key ProductKey) (*dm.ProductInfo, bool, error) {
		info, err := reader.ProductInfoGetOne(ctx, &dm.ProductInfoGetOneReq{ProductID: key.ProductID, WithCategory: true, WithProtocol: true})
		if err == nil && info != nil && info.TenantCode != "" && info.TenantCode != key.TenantCode && info.TenantCode != "common" {
			return nil, false, errors.New("product belongs to another tenant")
		}
		return info, info != nil, err
	})
	if err != nil {
		return nil, err
	}
	return &ProductInfoCache{cache: loaded}, nil
}

// Get 查询指定产品资料，向调用方返回副本以免修改缓存值。
func (cache *ProductInfoCache) Get(ctx context.Context, key ProductKey) (*dm.ProductInfo, error) {
	if cache == nil || cache.cache == nil || strings.TrimSpace(key.TenantCode) == "" || strings.TrimSpace(key.ProductID) == "" {
		return nil, errors.New("product cache, tenant code and product ID are required")
	}
	info, found, err := cache.cache.Get(ctx, key)
	if err != nil {
		return nil, err
	}
	if !found || info == nil {
		return nil, errors.New("product not found")
	}
	return proto.Clone(info).(*dm.ProductInfo), nil
}

// Invalidate 在产品资料更新后删除缓存，并阻止在途旧 RPC 响应回填。
func (cache *ProductInfoCache) Invalidate(key ProductKey) {
	if cache != nil && cache.cache != nil {
		cache.cache.Invalidate(key)
	}
}

// DeviceKey 用企业、产品 ID 和设备名隔离 Things 设备资料。
type DeviceKey struct {
	TenantCode string
	ProductID  string
	DeviceName string
}

// DeviceInfoReader 是设备资料缓存所需的最小公开 RPC 接口。
type DeviceInfoReader interface {
	DeviceInfoGetOne(context.Context, *dm.DeviceInfoGetOneReq, ...grpc.CallOption) (*dm.DeviceInfo, error)
}

// DeviceInfoCache 在产品和设备双字段维度缓存完整设备资料。
type DeviceInfoCache struct {
	cache *common.Cache[DeviceKey, *dm.DeviceInfo]
}

// NewDeviceInfoCache 用明确 TTL 和公开 RPC 客户端构建设备资料缓存。
func NewDeviceInfoCache(ttl time.Duration, reader DeviceInfoReader) (*DeviceInfoCache, error) {
	if reader == nil {
		return nil, errors.New("device info reader is required")
	}
	loaded, err := common.NewCache(ttl, func(ctx context.Context, key DeviceKey) (*dm.DeviceInfo, bool, error) {
		info, err := reader.DeviceInfoGetOne(ctx, &dm.DeviceInfoGetOneReq{ProductID: key.ProductID, DeviceName: key.DeviceName})
		if err == nil && info != nil && info.TenantCode != "" && info.TenantCode != key.TenantCode {
			return nil, false, errors.New("device belongs to another tenant")
		}
		return info, info != nil, err
	})
	if err != nil {
		return nil, err
	}
	return &DeviceInfoCache{cache: loaded}, nil
}

// Get 查询指定设备资料，向调用方返回副本以免修改缓存值。
func (cache *DeviceInfoCache) Get(ctx context.Context, key DeviceKey) (*dm.DeviceInfo, error) {
	if cache == nil || cache.cache == nil || strings.TrimSpace(key.TenantCode) == "" || strings.TrimSpace(key.ProductID) == "" || strings.TrimSpace(key.DeviceName) == "" {
		return nil, errors.New("device cache, tenant code, product ID and device name are required")
	}
	info, found, err := cache.cache.Get(ctx, key)
	if err != nil {
		return nil, err
	}
	if !found || info == nil {
		return nil, errors.New("device not found")
	}
	return proto.Clone(info).(*dm.DeviceInfo), nil
}

// Invalidate 在设备资料更新后删除缓存，并阻止在途旧 RPC 响应回填。
func (cache *DeviceInfoCache) Invalidate(key DeviceKey) {
	if cache != nil && cache.cache != nil {
		cache.cache.Invalidate(key)
	}
}
