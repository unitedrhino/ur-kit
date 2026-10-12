// Package seed 提供 dmsvr 种子初始化的公共「机制代码」：品类、通用物模型、品类-物模型关联、
// 产品、协议脚本与脚本产品绑定的幂等补齐（Ensure）逻辑。
//
// 背景：energy 与 parksvr 各自维护过一套几乎相同的 ensure* 实现（查重 → 创建 → 绑定），
// 本包将机制收敛为公共 SDK，调用方只需在自己的种子文件中声明种子数据常量，再调用本包
// Ensure 函数即可，避免重复实现漂移。
//
// 边界：本包只包含机制代码，不包含任何业务种子数据（品类树、物模型列表、产品清单、
// 脚本源码常量均留在各服务原文件）。
//
// 依赖：只依赖 dmsvr client 包接口（productmanage/schemamanage/protocolmanage），
// 兼容 grpc 客户端与 dmdirect 直连两种实现；单元测试使用官方 mock。
//
// 最小调用示例：
//
//	clients := seed.Clients{
//		Product:  svcCtx.ProductManage, // 接口类型，grpc 与 dmdirect 实现均可
//		Schema:   svcCtx.SchemaManage,
//		Protocol: svcCtx.ProtocolManage,
//	}
//	rootCtx := ctxs.WithRoot(ctx) // 种子同步通常需要 root 租户上下文
//
//	// 1. 品类（按 Code 查重；ID 传 0 自动分配，非 0 显式指定避免占用自增 ID）
//	catID, err := seed.EnsureCategory(rootCtx, clients.Product, seed.Category{
//		Code: "dianbiao", Name: "电表", ParentID: def.RootNode,
//	})
//	// 2. 品类-物模型关联（覆盖式 BatchUpdate / 追加式 BatchCreate 两种）
//	err = seed.EnsureCategorySchemasReplace(rootCtx, clients.Product, catID, []string{"TotalEnergy"})
//	// 3. 通用物模型（按 identifier 查重）
//	err = seed.EnsureCommonSchema(rootCtx, clients.Schema, seed.CommonSchema{
//		Identifier: "TotalEnergy", Name: "组合有功总电能", Type: 1, Required: 2,
//		IsCanSceneLinkage: 1, FuncGroup: 1, Order: 1, Affordance: `{"mode":"r"}`,
//	})
//	// 4. 产品（按名称查重，全字段透传；TenantCode 空=ctx 默认租户）
//	pid, err := seed.EnsureProduct(rootCtx, clients.Product, seed.Product{
//		ProductName: "电表", CategoryID: catID, DeviceType: 3, AuthMode: 1,
//		NetType: 1, AutoRegister: 3, ProtocolCode: "urMqtt", BindLevel: 2,
//	})
//	// 5. 协议脚本（按名称查重；ProtocolScriptCreate 会用内置模板覆盖 Script，
//	//    SDK 内部 create-then-Update 修正，真正写入脚本内容）
//	scriptID, err := seed.EnsureScript(rootCtx, clients.Protocol, seed.Script{
//		Name: "差值脚本", TriggerDir: 1, TriggerTimer: 1, TriggerHandle: "thing",
//		TriggerType: "property", Script: src, Priority: 1,
//	})
//	// 6. 脚本绑定产品（TriggerSrc=1 产品级幂等绑定）
//	err = seed.EnsureScriptProductBind(rootCtx, clients.Protocol, scriptID, pid, 1)
//
// 口径差异兼容：
//   - 租户：TenantCode 为空走 ctx 默认租户（energy），非空显式透传（parksvr 用 "common"）
//   - 脚本命中更新策略：默认仅内容不一致才更新（energy），
//     传 WithScriptForceUpdate 无条件更新（parksvr 可重放修正口径）
package seed
