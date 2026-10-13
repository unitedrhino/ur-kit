// 本文件使用公开 Things protobuf 客户端读取云协议配置，并交给配置管理器原子更新。
package cloud

import (
	"context"
	"errors"
	"fmt"

	"github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
)

// GRPCConfigSource 读取指定协议的全部配置；调用方负责在上下文中提供平台授权身份。
type GRPCConfigSource[C any] struct {
	Client       dm.ProtocolManageClient
	ProtocolCode string
	Decode       func(map[string]string) (C, error)
	PageSize     int64
}

// Fetch 分页拉取配置并解码，任何一页失败时不返回部分配置。
func (source GRPCConfigSource[C]) Fetch(ctx context.Context) ([]C, error) {
	if source.Client == nil || source.ProtocolCode == "" || source.Decode == nil {
		return nil, errors.New("protocol client, code and config decoder are required")
	}
	size := source.PageSize
	if size <= 0 {
		size = 100
	}
	var configs []C
	for page := int64(1); ; page++ {
		resp, err := source.Client.ProtocolConfigGetList(ctx, &dm.ProtocolConfigGetListReq{
			Page: &dm.PageInfo{Page: page, Size: size}, ProtocolCode: source.ProtocolCode,
		}, grpc.WaitForReady(true))
		if err != nil {
			return nil, fmt.Errorf("fetch protocol config page %d: %w", page, err)
		}
		if resp == nil {
			return nil, errors.New("protocol config response is empty")
		}
		if len(resp.List) == 0 && int64(len(configs)) < resp.Total {
			return nil, errors.New("protocol config pagination ended before total")
		}
		for _, item := range resp.List {
			if item == nil {
				return nil, errors.New("protocol config contains an empty item")
			}
			config, err := source.Decode(item.Config)
			if err != nil {
				return nil, fmt.Errorf("decode protocol config %d: %w", item.Id, err)
			}
			configs = append(configs, config)
		}
		if int64(len(configs)) >= resp.Total {
			return configs, nil
		}
	}
}

// Refresh 完整拉取后才更新管理器，避免 RPC 或解码失败时清空已生效配置。
func (source GRPCConfigSource[C]) Refresh(ctx context.Context, manager *ConfigManager[C]) error {
	if manager == nil {
		return errors.New("cloud configuration manager is required")
	}
	configs, err := source.Fetch(ctx)
	if err != nil {
		return err
	}
	return manager.Reconcile(ctx, configs)
}
