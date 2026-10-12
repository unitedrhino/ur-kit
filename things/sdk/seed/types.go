// 本文件定义 dmsvr 种子初始化的公共参数类型与客户端聚合结构。
// 调用方（energy/parksvr 等服务）在自己的种子文件中声明种子数据常量，
// 再通过本包 Ensure 系列函数幂等补齐到 dmsvr；本包不含任何业务种子数据。
package seed

import (
	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"
)

// Clients 聚合 dmsvr 三个客户端接口（产品/通用物模型/协议脚本）。
// SDK 只依赖接口，兼容 grpc 客户端与 dmdirect 直连两种实现（两者都实现了同名接口）。
type Clients struct {
	// Product 产品管理客户端（品类/产品/产品物模型）
	Product dm.ProductManageClient
	// Schema 物模型管理客户端（通用物模型）
	Schema dm.SchemaManageClient
	// Protocol 协议脚本管理客户端（脚本与产品绑定）
	Protocol dm.ProtocolManageClient
}

// Category 品类种子参数。
// ID 为显式品类 ID（传 0 表示交给 dmsvr 自动分配）；Code 全局唯一，创建后不可修改。
type Category struct {
	// ID 显式品类 ID（0 = 自动分配；需要与 allInOne init JSON 对齐时显式指定，避免占用自增 ID）
	ID int64
	// Code 品类编码，全局唯一
	Code string
	// Name 品类名称
	Name string
	// ParentID 父品类 ID（根节点传 def.RootNode 或调用方自己的根值）
	ParentID int64
	// Schemas 品类关联的通用物模型标识符列表（绑定由 EnsureCategorySchemasReplace/Add 完成）
	Schemas []string
}

// CommonSchema 通用物模型种子参数。
type CommonSchema struct {
	// Identifier 物模型标识符，全局唯一
	Identifier string
	// Name 物模型名称（同时作为描述写入）
	Name string
	// Type 物模型类型：1=property 属性, 2=event 事件, 3=action 行为
	Type int64
	// Required 是否必填：1=是, 2=否
	Required int64
	// IsCanSceneLinkage 是否支持场景联动：1=支持, 2=不支持
	IsCanSceneLinkage int64
	// FuncGroup 功能分组：1=基础功能, 2=高级功能
	FuncGroup int64
	// Order 排序值
	Order int64
	// Affordance 能力定义 JSON（由 Type 决定结构，格式见 dmsvr proto 注释）
	Affordance string
}

// Product 产品种子参数。
// TenantCode 为空时走 ctx 上下文默认租户（如 root），非空时显式指定租户（如 parksvr 的 common）。
type Product struct {
	// ProductName 产品名称，全局唯一
	ProductName string
	// CategoryID 产品所属品类 ID
	CategoryID int64
	// DeviceType 设备类型：1=设备, 2=网关, 3=子设备
	DeviceType int64
	// AuthMode 认证方式：1=账密认证, 2=密钥认证
	AuthMode int64
	// NetType 通讯方式：1=其他, 2=Wi-Fi, 3=2G/3G/4G, 4=5G, 5=BLE, 6=LoRaWAN
	NetType int64
	// AutoRegister 动态注册：1=关闭, 2=打开, 3=打开并自动创建设备
	AutoRegister int64
	// ProtocolCode 协议 code（如 urMqtt；现行下行路由仅对 urMqtt/urHttp 走 MQTT 直发）
	ProtocolCode string
	// OnlineHandle 在线处理：1=自动, 2=永远在线
	OnlineHandle int64
	// DeviceSchemaMode 设备物模型模式：1=关闭, 2=设备自动创建
	DeviceSchemaMode int64
	// BindLevel 绑定级别：1=强绑定, 2=中绑定, 3=弱绑定
	BindLevel int64
	// Desc 产品描述（为空时不写入）
	Desc string
	// TenantCode 租户号：空=ctx 默认租户, 非空显式指定（如 common）
	TenantCode string
}

// Script 协议脚本种子参数。
type Script struct {
	// Name 脚本名称（dmsvr 中全局唯一）
	Name string
	// TriggerDir 触发方向：1=up, 2=down
	TriggerDir int64
	// TriggerTimer 触发时机：1=before, 2=after
	TriggerTimer int64
	// TriggerHandle 触发句柄（对应 mqtt topic 第一段：thing/ota/config 等）
	TriggerHandle string
	// TriggerType 操作类型（物模型下为 property/event/action；parksvr 用 "__all__" 匹配全部）
	TriggerType string
	// Script 脚本源码
	Script string
	// Priority 产品绑定的执行优先级（>0）
	Priority int64
	// TenantCode 租户号：空=ctx 默认租户, 非空显式指定（如 common）
	TenantCode string
}
