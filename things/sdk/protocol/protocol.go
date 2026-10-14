// 本文件保留原 Things 协议 SDK 的常用入口名称，并把运行依赖交给公开模块注入。
package protocol

import (
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/cloud"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/core"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/mqtt"
)

// DefaultConf 表示不需要逐设备配置的协议默认值。
type DefaultConf struct{}

// GenKey 返回空键，使无配置协议只有一份默认配置。
func (DefaultConf) GenKey() string { return "" }

// Equal 判断两份无字段默认配置相等。
func (DefaultConf) Equal(DefaultConf) bool { return true }

// CoreProtocol 是独立协议服务的注册、心跳和上下行核心。
type CoreProtocol = core.Protocol

// CoreProtocolConf 通过公开接口注入平台 RPC、事件总线和运行配置。
type CoreProtocolConf = core.Options

// NewCoreProtocol 创建独立协议核心；调用方负责注入平台和消息总线适配器。
func NewCoreProtocol(options CoreProtocolConf) (*CoreProtocol, error) {
	return core.NewProtocol(options)
}

// MqttProtocol 是在独立协议核心上组合 MQTT 传输的实现。
type MqttProtocol = mqtt.Protocol

// NewMqttProtocol 创建 MQTT 协议，传输层、事件总线和在线跟踪均由调用方提供。
func NewMqttProtocol(base *CoreProtocol, transport mqtt.Transport, bus core.Bus, tracker mqtt.SessionTracker, sharedPrefix string) (*MqttProtocol, error) {
	return mqtt.NewProtocol(base, transport, bus, tracker, sharedPrefix)
}

// NewCloudProtocol 创建云协议配置运行时，保留原 SDK 构造入口的名称。
func NewCloudProtocol[C any](options cloud.RuntimeOptions[C]) (*cloud.Runtime[C], error) {
	return cloud.NewRuntime(options)
}
