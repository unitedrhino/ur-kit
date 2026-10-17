// 本文件验证旧 Things protobuf 与公开纯值协议配置选择包可共同工作。
package protocol

import (
	"context"
	"testing"

	"gitee.com/unitedrhino/share/caches"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"github.com/alicebob/miniredis/v2"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

// TestProtocolConfigSelection 验证产品和设备配置在旧 protobuf 缓存下按主子协议选择。
func TestProtocolConfigSelection(t *testing.T) {
	server := miniredis.RunT(t)
	store := kv.NewStore(cache.ClusterConf{{RedisConf: redis.RedisConf{Host: server.Addr(), Type: redis.NodeType}, Weight: 100}})
	previous := caches.GetStore()
	caches.SetStoreForTest(store)
	t.Cleanup(func() { caches.SetStoreForTest(previous) })
	product := &dm.ProductInfo{
		ProductID:       "product-1",
		SubProtocolCode: wrapperspb.String("modbus"),
		ProtocolConf:    map[string]string{"source": "main-product"},
		SubProtocolConf: map[string]string{"source": "sub-product"},
	}
	cache, err := caches.NewCache(caches.CacheConfig[dm.ProductInfo, string]{
		KeyType: "test-protocol-config-selection",
		GetData: func(_ context.Context, key string) (*dm.ProductInfo, error) {
			if key != product.ProductID {
				t.Fatalf("产品缓存键错误: %q", key)
			}
			return product, nil
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	device := &dm.DeviceInfo{
		ProductID:       product.ProductID,
		ProtocolConf:    map[string]string{"source": "main-device"},
		SubProtocolConf: map[string]string{"source": "sub-device"},
	}
	protocol := &CoreProtocol{Pi: &dm.ProtocolInfo{Code: "modbus"}, CoreSvrClient: CoreSvrClient{ProductCache: cache}}
	if got := protocol.GetProtocolConf(product); got["source"] != "sub-product" {
		t.Fatalf("产品子协议配置错误: %v", got)
	}
	if got, err := protocol.GetDevProtocolConf(context.Background(), device); err != nil || got["source"] != "sub-device" {
		t.Fatalf("设备子协议配置错误: %v, %v", got, err)
	}
	protocol.Pi.Code = "mqtt"
	if got := protocol.GetProtocolConf(product); got["source"] != "main-product" {
		t.Fatalf("产品主协议配置错误: %v", got)
	}
	if got, err := protocol.GetDevProtocolConf(context.Background(), device); err != nil || got["source"] != "main-device" {
		t.Fatalf("设备主协议配置错误: %v, %v", got, err)
	}
	protocol.Pi.Code = ""
	product.SubProtocolCode = wrapperspb.String("")
	if got := protocol.GetProtocolConf(product); got["source"] != "sub-product" {
		t.Fatalf("显式空子协议代码的旧语义丢失: %v", got)
	}
	product.SubProtocolCode = nil
	if got := protocol.GetProtocolConf(product); got["source"] != "main-product" {
		t.Fatalf("未配置子协议应选主配置: %v", got)
	}
}
