package runtimeconfig

import (
	"gitee.com/unitedrhino/share/conf"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/configmerge"
	storecache "github.com/zeromicro/go-zero/core/stores/cache"
)

// Config 汇集协议运行时可由存储配置覆写的服务参数。
type Config struct {
	TimedJobRpc conf.RpcClientConf     `json:"timedJobRpc,omitempty"`
	Event       conf.EventConf         `json:"event,omitempty"`
	CacheRedis  storecache.ClusterConf `json:"cacheRedis,omitempty"`
	DevLink     conf.DevLinkConf       `json:"devLink,omitempty"`
}

// MergeConfigJSON 将显式提供的 JSON 字段应用到基础配置，非空覆写时返回独立副本。
func MergeConfigJSON[T any](base T, configJSON string) (T, error) {
	return configmerge.MergeConfigJSON(base, configJSON)
}

// MergeDevLinkConfigJSON 只返回设备连接部分的合并配置。
func MergeDevLinkConfigJSON(base conf.DevLinkConf, configJSON string) (conf.DevLinkConf, error) {
	out, err := MergeConfigJSON(Config{DevLink: base}, configJSON)
	if err != nil {
		return conf.DevLinkConf{}, err
	}
	return out.DevLink, nil
}
