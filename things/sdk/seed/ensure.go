// 本文件提供 dmsvr 种子初始化的幂等 Ensure 机制函数。
// 全部实现提炼自 energy/parksvr 原有 ensure* 逻辑，不含任何业务种子数据；
// 每个函数遵循「先查重、缺失才创建」的幂等语义，可重复调用。
package seed

import (
	"context"
	"fmt"
	dm "github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm"

	"google.golang.org/protobuf/types/known/wrapperspb"
)

// EnsureCategory 按 Code 查重品类：已存在返回既有 ID，缺失时创建并返回新 ID。
// Category.ID 非 0 时显式指定品类 ID（避免占用自增 ID），否则交由 dmsvr 自动分配。
func EnsureCategory(ctx context.Context, productM dm.ProductManageClient, c Category) (int64, error) {
	resp, err := productM.ProductCategoryGetList(ctx, &dm.ProductCategoryGetListReq{Code: c.Code})
	if err != nil {
		return 0, err
	}
	if resp != nil && len(resp.List) > 0 {
		return resp.List[0].Id, nil // 已存在
	}
	created, err := productM.ProductCategoryCreate(ctx, &dm.ProductCategory{
		Id:       c.ID,
		ParentID: c.ParentID,
		Name:     c.Name,
		Code:     c.Code,
		Order:    1,
	})
	if err != nil {
		return 0, err
	}
	return created.Id, nil
}

// EnsureCommonSchema 按 identifier 查重通用物模型：已存在跳过，缺失时创建。
// 创建时 Desc 与 Name 一致，ExtendConfig 固定为 "{}"。
func EnsureCommonSchema(ctx context.Context, schemaM dm.SchemaManageClient, s CommonSchema) error {
	resp, err := schemaM.CommonSchemaGetList(ctx, &dm.CommonSchemaGetListReq{
		Identifiers: []string{s.Identifier},
	})
	if err != nil {
		return err
	}
	if resp != nil && len(resp.List) > 0 {
		return nil // 已存在
	}
	_, err = schemaM.CommonSchemaCreate(ctx, &dm.CommonSchemaCreateReq{
		Info: &dm.CommonSchemaInfo{
			Identifier:        s.Identifier,
			Type:              s.Type,
			Name:              wrapperspb.String(s.Name),
			Desc:              wrapperspb.String(s.Name),
			Required:          s.Required,
			IsCanSceneLinkage: s.IsCanSceneLinkage,
			FuncGroup:         s.FuncGroup,
			Affordance:        wrapperspb.String(s.Affordance),
			ExtendConfig:      "{}",
			Order:             s.Order,
		},
	})
	return err
}

// EnsureCategorySchemasReplace 覆盖式绑定品类-物模型关联（ProductCategorySchemaBatchUpdate）。
// 与 EnsureCategorySchemasAdd 的区别：Replace 按传入的标识符集合整体覆盖品类已有关联。
func EnsureCategorySchemasReplace(ctx context.Context, productM dm.ProductManageClient, categoryID int64, identifiers []string) error {
	_, err := productM.ProductCategorySchemaBatchUpdate(ctx, &dm.ProductCategorySchemaBatchSaveReq{
		ProductCategoryID: categoryID,
		Identifiers:       identifiers,
	})
	return err
}

// EnsureCategorySchemasAdd 追加式绑定品类-物模型关联（ProductCategorySchemaBatchCreate）。
// 接口内部按已存在标识符去重，天然幂等；不会删除品类已有的其他关联。
func EnsureCategorySchemasAdd(ctx context.Context, productM dm.ProductManageClient, categoryID int64, identifiers []string) error {
	_, err := productM.ProductCategorySchemaBatchCreate(ctx, &dm.ProductCategorySchemaBatchSaveReq{
		ProductCategoryID: categoryID,
		Identifiers:       identifiers,
	})
	return err
}

// EnsureProduct 按产品名查重产品：已存在返回既有 ProductID，缺失时创建并返回新 ProductID。
// 创建时补齐 Status=1 / SceneMode=rw / 空 Tags / 空 ProtocolConf 等固定取值；
// Product.TenantCode 非空时透传给查询与创建（如 parksvr 的 common），为空走 ctx 默认租户。
func EnsureProduct(ctx context.Context, productM dm.ProductManageClient, p Product) (string, error) {
	req := &dm.ProductInfoGetListReq{ProductName: p.ProductName}
	if p.TenantCode != "" {
		req.TenantCode = p.TenantCode
	}
	resp, err := productM.ProductInfoGetList(ctx, req)
	if err != nil {
		return "", err
	}
	if resp != nil && len(resp.List) > 0 {
		return resp.List[0].ProductID, nil // 已存在
	}
	info := &dm.ProductInfo{
		ProductName:      p.ProductName,
		AuthMode:         p.AuthMode,
		DeviceType:       p.DeviceType,
		CategoryID:       p.CategoryID,
		NetType:          p.NetType,
		AutoRegister:     p.AutoRegister,
		ProtocolCode:     p.ProtocolCode,
		OnlineHandle:     p.OnlineHandle,
		DeviceSchemaMode: p.DeviceSchemaMode,
		BindLevel:        p.BindLevel,
		Status:           1,
		SceneMode:        "rw",
		Tags:             map[string]string{},
		ProtocolConf:     map[string]string{},
		SubProtocolConf:  map[string]string{},
	}
	if p.Desc != "" {
		info.Desc = wrapperspb.String(p.Desc)
	}
	if p.TenantCode != "" {
		info.TenantCode = p.TenantCode
	}
	created, err := productM.ProductInfoCreate(ctx, info)
	if err != nil {
		return "", err
	}
	return created.ProductID, nil
}

// FindProductIDByName 按产品名查找产品 ID；不存在时返回空字符串（不视为错误）。
func FindProductIDByName(ctx context.Context, productM dm.ProductManageClient, productName string) (string, error) {
	resp, err := productM.ProductInfoGetList(ctx, &dm.ProductInfoGetListReq{ProductName: productName})
	if err != nil {
		return "", err
	}
	if resp == nil || len(resp.List) == 0 {
		return "", nil
	}
	return resp.List[0].ProductID, nil
}

// scriptOption 是 EnsureScript 的可选行为控制。
type scriptOption struct {
	forceUpdate bool
}

// ScriptOption 调整 EnsureScript 的行为（可选参数，可传多个）。
type ScriptOption func(*scriptOption)

// WithScriptForceUpdate 命中已存在脚本时无条件 Update（parksvr 口径：
// 已存在即覆盖，保证脚本内容可重放修正）；不传时仅内容不一致才更新（energy 口径）。
func WithScriptForceUpdate() ScriptOption {
	return func(o *scriptOption) { o.forceUpdate = true }
}

// EnsureScript 按 Name + 触发参数查重协议脚本：已存在时默认仅当脚本内容与种子不一致才更新，
// 传入 WithScriptForceUpdate 则无条件更新；缺失时先创建再 Update。
// 注意：ProtocolScriptCreate 会用内置模板覆盖 Script 字段，因此创建后必须再次
// ProtocolScriptUpdate 才能真正写入脚本内容（本函数已封装该步骤）。返回脚本 ID。
func EnsureScript(ctx context.Context, protocolM dm.ProtocolManageClient, s Script, opts ...ScriptOption) (int64, error) {
	var opt scriptOption
	for _, o := range opts {
		o(&opt)
	}

	// 1. 按名称 + 触发参数查重。
	listResp, err := protocolM.ProtocolScriptGetList(ctx, &dm.ProtocolScriptGetListReq{
		Name:          s.Name,
		TriggerDir:    s.TriggerDir,
		TriggerTimer:  s.TriggerTimer,
		TriggerHandle: s.TriggerHandle,
		TriggerType:   s.TriggerType,
	})
	if err != nil {
		return 0, err
	}

	if listResp != nil && len(listResp.List) > 0 {
		existing := listResp.List[0]
		// 脚本内容一致且不强制更新时直接复用。
		if !opt.forceUpdate && existing.Script == s.Script {
			return existing.Id, nil
		}
		// 内容不一致（或强制更新）时全字段覆盖，保证与种子定义一致。
		update := &dm.ProtocolScript{
			Id:            existing.Id,
			Name:          s.Name,
			TriggerDir:    s.TriggerDir,
			TriggerTimer:  s.TriggerTimer,
			TriggerHandle: s.TriggerHandle,
			TriggerType:   s.TriggerType,
			Script:        s.Script,
			Status:        1,
		}
		if s.TenantCode != "" {
			update.TenantCode = s.TenantCode
		}
		if _, err := protocolM.ProtocolScriptUpdate(ctx, update); err != nil {
			return 0, fmt.Errorf("update protocol script: %w", err)
		}
		return existing.Id, nil
	}

	// 2. 创建（Create 会用内置模板覆盖 Script，随后 Update 修正）。
	created, err := protocolM.ProtocolScriptCreate(ctx, &dm.ProtocolScript{
		Name:          s.Name,
		TriggerDir:    s.TriggerDir,
		TriggerTimer:  s.TriggerTimer,
		TriggerHandle: s.TriggerHandle,
		TriggerType:   s.TriggerType,
		Script:        s.Script,
		Status:        1,
		TenantCode:    s.TenantCode,
	})
	if err != nil {
		return 0, fmt.Errorf("create protocol script: %w", err)
	}

	// 3. 用自定义脚本内容覆盖（Create 落库的是模板脚本）。
	update := &dm.ProtocolScript{Id: created.Id, Script: s.Script}
	if s.TenantCode != "" {
		update.TenantCode = s.TenantCode
	}
	if _, err := protocolM.ProtocolScriptUpdate(ctx, update); err != nil {
		return 0, fmt.Errorf("update protocol script after create: %w", err)
	}
	return created.Id, nil
}

// EnsureScriptProductBind 确保产品级脚本绑定存在（TriggerSrc=1 产品，对产品下所有设备生效）。
// 按 TriggerSrc/ProductID/ScriptID 查重，已存在跳过，缺失时创建；priority 为执行优先级（>0）。
func EnsureScriptProductBind(ctx context.Context, protocolM dm.ProtocolManageClient, scriptID int64, productID string, priority int64) error {
	listResp, err := protocolM.ProtocolScriptDeviceGetList(ctx, &dm.ProtocolScriptDeviceGetListReq{
		TriggerSrc: 1,
		ProductID:  productID,
		ScriptID:   scriptID,
	})
	if err != nil {
		return err
	}
	if listResp != nil && len(listResp.List) > 0 {
		return nil // 已绑定
	}
	_, err = protocolM.ProtocolScriptDeviceCreate(ctx, &dm.ProtocolScriptDevice{
		TriggerSrc: 1, // 产品级
		ProductID:  productID,
		ScriptID:   scriptID,
		Priority:   priority,
		Status:     1,
	})
	return err
}

// EnsureProductSchemas 产品物模型幂等导入：已存在的标识符逐个 Update（保证 affordance 修正
// 可重放），不存在的批量 Create。供 parksvr 等需要按 identifier upsert 产品物模型的调用方使用。
func EnsureProductSchemas(ctx context.Context, productM dm.ProductManageClient, productID string, schemas []*dm.ProductSchemaInfo) error {
	exist, err := productM.ProductSchemaGetList(ctx, &dm.ProductSchemaGetListReq{ProductID: productID})
	if err != nil {
		return fmt.Errorf("query schema list: %w", err)
	}
	existIDs := map[string]bool{}
	for _, item := range exist.List {
		existIDs[item.Identifier] = true
	}
	var creates []*dm.ProductSchemaInfo
	for _, item := range schemas {
		if existIDs[item.Identifier] {
			if _, err := productM.ProductSchemaUpdate(ctx, &dm.ProductSchemaUpdateReq{Info: item}); err != nil {
				return fmt.Errorf("update schema %s: %w", item.Identifier, err)
			}
		} else {
			creates = append(creates, item)
		}
	}
	if len(creates) > 0 {
		if _, err := productM.ProductSchemaBatchCreate(ctx, &dm.ProductSchemaBatchCreateReq{
			ProductID: productID,
			List:      creates,
		}); err != nil {
			return fmt.Errorf("batch create schema: %w", err)
		}
	}
	return nil
}

// EnsureProductSchemaIdentifiers 将通用物模型按标识符幂等补到指定产品。
// dmsvr 的批量创建接口会忽略产品中已存在的标识符，因此既能修复旧种子遗漏，
// 也不会覆盖平台管理员已经维护的产品物模型内容。
func EnsureProductSchemaIdentifiers(ctx context.Context, productM dm.ProductManageClient, productID string, identifiers []string) error {
	if len(identifiers) == 0 {
		return nil
	}
	_, err := productM.ProductSchemaBatchCreate(ctx, &dm.ProductSchemaBatchCreateReq{
		ProductID:   productID,
		Identifiers: identifiers,
	})
	return err
}
