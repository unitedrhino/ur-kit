// 本文件验证 sdk/seed 的幂等 Ensure 机制：品类/通用物模型/品类关联/产品/协议脚本/绑定。
// 测试使用 dmsvr client 官方 mock（NewXxxMock），断言覆盖 energy/parksvr 迁移前的
// 既有行为（查重跳过、缺失创建、create-then-update、内容不一致才更新等）。
package seed

import (
	"context"
	"testing"

	"gitee.com/unitedrhino/things/service/dmsvr/client/productmanage"
	"gitee.com/unitedrhino/things/service/dmsvr/client/protocolmanage"
	"gitee.com/unitedrhino/things/service/dmsvr/client/schemamanage"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

// TestEnsureCategory_Create 验证品类缺失时创建，且显式 ID 与 Order 透传。
func TestEnsureCategory_Create(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	productM.ProductCategoryGetListFn = func(ctx context.Context, in *productmanage.ProductCategoryGetListReq, _ ...grpc.CallOption) (*productmanage.ProductCategoryGetListResp, error) {
		require.Equal(t, "dianbiao", in.Code)
		return &productmanage.ProductCategoryGetListResp{}, nil
	}
	productM.ProductCategoryCreateFn = func(ctx context.Context, in *productmanage.ProductCategory, _ ...grpc.CallOption) (*productmanage.ProductManageWithID, error) {
		return &productmanage.ProductManageWithID{Id: 7}, nil
	}

	id, err := EnsureCategory(context.Background(), productM, Category{ID: 7, Code: "dianbiao", Name: "电表", ParentID: 1})
	require.NoError(t, err)
	require.Equal(t, int64(7), id)
	creates := productM.ProductCategoryCreateCalls()
	require.Len(t, creates, 1)
	require.Equal(t, int64(7), creates[0].Id, "显式 ID 应透传（避免占用自增 ID）")
	require.Equal(t, int64(1), creates[0].ParentID)
	require.Equal(t, "电表", creates[0].Name)
	require.Equal(t, "dianbiao", creates[0].Code)
}

// TestEnsureCategory_AlreadyExists 验证品类已存在时返回既有 ID 且不再创建。
func TestEnsureCategory_AlreadyExists(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	productM.ProductCategoryGetListFn = func(ctx context.Context, in *productmanage.ProductCategoryGetListReq, _ ...grpc.CallOption) (*productmanage.ProductCategoryGetListResp, error) {
		return &productmanage.ProductCategoryGetListResp{List: []*productmanage.ProductCategory{{Id: 123, Code: "ranqibiao"}}}, nil
	}

	id, err := EnsureCategory(context.Background(), productM, Category{Code: "ranqibiao", Name: "气表"})
	require.NoError(t, err)
	require.Equal(t, int64(123), id)
	require.Empty(t, productM.ProductCategoryCreateCalls(), "品类已存在时不应调用创建")
}

// TestEnsureCommonSchema_Create 验证物模型缺失时创建，字段完整透传。
func TestEnsureCommonSchema_Create(t *testing.T) {
	schemaM := schemamanage.NewSchemaManageMock()
	schemaM.CommonSchemaGetListFn = func(ctx context.Context, in *schemamanage.CommonSchemaGetListReq, _ ...grpc.CallOption) (*schemamanage.CommonSchemaGetListResp, error) {
		return &schemamanage.CommonSchemaGetListResp{}, nil
	}

	err := EnsureCommonSchema(context.Background(), schemaM, CommonSchema{
		Identifier: "TotalEnergy", Name: "组合有功总电能", Type: 1, Required: 2,
		IsCanSceneLinkage: 1, FuncGroup: 1, Order: 1, Affordance: `{"mode":"r"}`,
	})
	require.NoError(t, err)
	creates := schemaM.CommonSchemaCreateCalls()
	require.Len(t, creates, 1)
	info := creates[0].Info
	require.Equal(t, "TotalEnergy", info.Identifier)
	require.Equal(t, int64(1), info.Type, "应为 property 类型")
	require.Equal(t, int64(2), info.Required)
	require.Equal(t, int64(1), info.IsCanSceneLinkage)
	require.Equal(t, int64(1), info.FuncGroup)
	require.Equal(t, int64(1), info.Order)
	require.Equal(t, "组合有功总电能", info.Name.GetValue())
	require.Equal(t, "组合有功总电能", info.Desc.GetValue(), "Desc 应与 Name 一致")
	require.Equal(t, `{"mode":"r"}`, info.Affordance.GetValue())
}

// TestEnsureCommonSchema_AlreadyExists 验证物模型已存在时跳过创建。
func TestEnsureCommonSchema_AlreadyExists(t *testing.T) {
	schemaM := schemamanage.NewSchemaManageMock()
	schemaM.CommonSchemaGetListFn = func(ctx context.Context, in *schemamanage.CommonSchemaGetListReq, _ ...grpc.CallOption) (*schemamanage.CommonSchemaGetListResp, error) {
		return &schemamanage.CommonSchemaGetListResp{List: []*schemamanage.CommonSchemaInfo{{Identifier: "Ua"}}}, nil
	}

	err := EnsureCommonSchema(context.Background(), schemaM, CommonSchema{Identifier: "Ua", Name: "相电压Ua", Type: 1})
	require.NoError(t, err)
	require.Empty(t, schemaM.CommonSchemaCreateCalls(), "已存在时不应创建")
}

// TestEnsureCategorySchemasReplace 验证覆盖式关联调用 BatchUpdate。
func TestEnsureCategorySchemasReplace(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	err := EnsureCategorySchemasReplace(context.Background(), productM, 7, []string{"TotalEnergy", "EP"})
	require.NoError(t, err)
	updates := productM.ProductCategorySchemaBatchUpdateCalls()
	require.Len(t, updates, 1)
	require.Equal(t, int64(7), updates[0].ProductCategoryID)
	require.Equal(t, []string{"TotalEnergy", "EP"}, updates[0].Identifiers)
	require.Empty(t, productM.ProductCategorySchemaBatchCreateCalls())
}

// TestEnsureCategorySchemasAdd 验证追加式关联调用 BatchCreate。
func TestEnsureCategorySchemasAdd(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	err := EnsureCategorySchemasAdd(context.Background(), productM, 456, []string{"TotalGas", "TotalGasChange"})
	require.NoError(t, err)
	creates := productM.ProductCategorySchemaBatchCreateCalls()
	require.Len(t, creates, 1)
	require.Equal(t, int64(456), creates[0].ProductCategoryID)
	require.Equal(t, []string{"TotalGas", "TotalGasChange"}, creates[0].Identifiers)
	require.Empty(t, productM.ProductCategorySchemaBatchUpdateCalls())
}

// TestEnsureProduct_Create 验证产品缺失时创建，且请求补齐 init JSON 中 OnlineHandle 原值，
// 并显式携带 ProtocolCode=urMqtt（RPC 迁移时曾丢失这些字段）。
// ProductType 的 init 原值（1）经 DB 默认值生效，proto ProductInfo 无此字段，不在此断言。
func TestEnsureProduct_Create(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	productM.ProductInfoGetListFn = func(ctx context.Context, in *productmanage.ProductInfoGetListReq, _ ...grpc.CallOption) (*productmanage.ProductInfoGetListResp, error) {
		return &productmanage.ProductInfoGetListResp{}, nil
	}
	productM.ProductInfoCreateFn = func(ctx context.Context, in *productmanage.ProductInfo, _ ...grpc.CallOption) (*productmanage.ProductID, error) {
		return &productmanage.ProductID{ProductID: "meter-002"}, nil
	}

	productID, err := EnsureProduct(context.Background(), productM, Product{
		ProductName: "水表", CategoryID: 456, DeviceType: 3, AuthMode: 1,
		NetType: 1, AutoRegister: 3, ProtocolCode: "urMqtt", OnlineHandle: 1,
		DeviceSchemaMode: 1, BindLevel: 2, Desc: "水表",
	})
	require.NoError(t, err)
	require.Equal(t, "meter-002", productID)

	creates := productM.ProductInfoCreateCalls()
	require.Len(t, creates, 1)
	require.Equal(t, int64(1), creates[0].OnlineHandle, "OnlineHandle 应与 init JSON 电表/水表产品一致")
	require.Equal(t, "urMqtt", creates[0].ProtocolCode, "显式 urMqtt：init JSON 的『联犀MQTT协议』是显示名误存 code，照抄会丢表设备下行")
	require.Equal(t, int64(1), creates[0].DeviceSchemaMode, "DeviceSchemaMode 应与 init JSON 电表/水表产品一致")
	require.Equal(t, int64(2), creates[0].BindLevel, "BindLevel 应与 init JSON 电表/水表产品一致")
	require.Equal(t, "水表", creates[0].ProductName)
	require.Equal(t, "水表", creates[0].Desc.GetValue())
	require.Equal(t, int64(1), creates[0].Status)
	require.Equal(t, "rw", creates[0].SceneMode)
}

// TestEnsureProduct_AlreadyExists 验证产品已存在时返回既有 ID 且不再创建。
func TestEnsureProduct_AlreadyExists(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	productM.ProductInfoGetListFn = func(ctx context.Context, in *productmanage.ProductInfoGetListReq, _ ...grpc.CallOption) (*productmanage.ProductInfoGetListResp, error) {
		require.Equal(t, "气表", in.ProductName)
		return &productmanage.ProductInfoGetListResp{List: []*productmanage.ProductInfo{{ProductName: "气表", ProductID: "existing-001"}}}, nil
	}

	productID, err := EnsureProduct(context.Background(), productM, Product{ProductName: "气表"})
	require.NoError(t, err)
	require.Equal(t, "existing-001", productID)
	require.Empty(t, productM.ProductInfoCreateCalls(), "产品已存在时不应调用创建")
}

// TestEnsureProduct_TenantCodeCommon 验证 parksvr 口径：TenantCode 非空时透传给查询与创建。
func TestEnsureProduct_TenantCodeCommon(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	productM.ProductInfoGetListFn = func(ctx context.Context, in *productmanage.ProductInfoGetListReq, _ ...grpc.CallOption) (*productmanage.ProductInfoGetListResp, error) {
		require.Equal(t, "停车场相机", in.ProductName)
		require.Equal(t, "common", in.TenantCode, "查询应带公共租户")
		return &productmanage.ProductInfoGetListResp{}, nil
	}
	productM.ProductInfoCreateFn = func(ctx context.Context, in *productmanage.ProductInfo, _ ...grpc.CallOption) (*productmanage.ProductID, error) {
		return &productmanage.ProductID{ProductID: "park-cam-001"}, nil
	}

	productID, err := EnsureProduct(context.Background(), productM, Product{
		ProductName: "停车场相机", CategoryID: 88, DeviceType: 1, AuthMode: 1,
		NetType: 1, ProtocolCode: "urMqtt", TenantCode: "common",
	})
	require.NoError(t, err)
	require.Equal(t, "park-cam-001", productID)
	creates := productM.ProductInfoCreateCalls()
	require.Len(t, creates, 1)
	require.Equal(t, "common", creates[0].TenantCode, "创建应带公共租户")
}

// TestFindProductIDByName_Found 验证按名称找到产品。
func TestFindProductIDByName_Found(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	productM.ProductInfoGetListFn = func(ctx context.Context, in *productmanage.ProductInfoGetListReq, _ ...grpc.CallOption) (*productmanage.ProductInfoGetListResp, error) {
		require.Equal(t, "opengw网关", in.ProductName)
		return &productmanage.ProductInfoGetListResp{List: []*productmanage.ProductInfo{{ProductID: "65"}}}, nil
	}

	id, err := FindProductIDByName(context.Background(), productM, "opengw网关")
	require.NoError(t, err)
	require.Equal(t, "65", id)
}

// TestFindProductIDByName_NotFound 验证产品不存在时返回空且不报错。
func TestFindProductIDByName_NotFound(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	productM.ProductInfoGetListFn = func(ctx context.Context, in *productmanage.ProductInfoGetListReq, _ ...grpc.CallOption) (*productmanage.ProductInfoGetListResp, error) {
		return &productmanage.ProductInfoGetListResp{}, nil
	}

	id, err := FindProductIDByName(context.Background(), productM, "opengw网关")
	require.NoError(t, err)
	require.Empty(t, id)
}

// TestEnsureScript_AlreadyExistsSameScript 验证脚本已存在且内容一致时不更新（energy 口径）。
func TestEnsureScript_AlreadyExistsSameScript(t *testing.T) {
	protocolM := protocolmanage.NewProtocolManageMock()
	const src = "func Handle(...){}"
	protocolM.ProtocolScriptGetListFn = func(ctx context.Context, in *protocolmanage.ProtocolScriptGetListReq, _ ...grpc.CallOption) (*protocolmanage.ProtocolScriptGetListResp, error) {
		return &protocolmanage.ProtocolScriptGetListResp{List: []*protocolmanage.ProtocolScript{{Id: 99, Script: src}}}, nil
	}

	id, err := EnsureScript(context.Background(), protocolM, Script{Name: "差值", Script: src})
	require.NoError(t, err)
	require.Equal(t, int64(99), id)
	require.Empty(t, protocolM.ProtocolScriptUpdateCalls(), "脚本内容一致时不应更新")
	require.Empty(t, protocolM.ProtocolScriptCreateCalls(), "脚本已存在时不应创建")
}

// TestEnsureScript_AlreadyExistsDiffScript 验证脚本已存在但内容不一致时更新（energy 口径）。
func TestEnsureScript_AlreadyExistsDiffScript(t *testing.T) {
	protocolM := protocolmanage.NewProtocolManageMock()
	protocolM.ProtocolScriptGetListFn = func(ctx context.Context, in *protocolmanage.ProtocolScriptGetListReq, _ ...grpc.CallOption) (*protocolmanage.ProtocolScriptGetListResp, error) {
		return &protocolmanage.ProtocolScriptGetListResp{List: []*protocolmanage.ProtocolScript{{Id: 99, Script: "old"}}}, nil
	}

	const src = "func Handle(...){}"
	id, err := EnsureScript(context.Background(), protocolM, Script{Name: "差值", Script: src})
	require.NoError(t, err)
	require.Equal(t, int64(99), id)
	updates := protocolM.ProtocolScriptUpdateCalls()
	require.Len(t, updates, 1, "内容不一致时应更新")
	require.Equal(t, src, updates[0].Script)
}

// TestEnsureScript_ForceUpdate 验证 WithScriptForceUpdate 时已存在脚本也无条件更新（parksvr 口径）。
func TestEnsureScript_ForceUpdate(t *testing.T) {
	protocolM := protocolmanage.NewProtocolManageMock()
	const src = "func Handle(...){}"
	protocolM.ProtocolScriptGetListFn = func(ctx context.Context, in *protocolmanage.ProtocolScriptGetListReq, _ ...grpc.CallOption) (*protocolmanage.ProtocolScriptGetListResp, error) {
		return &protocolmanage.ProtocolScriptGetListResp{List: []*protocolmanage.ProtocolScript{{Id: 99, Script: src}}}, nil
	}

	id, err := EnsureScript(context.Background(), protocolM, Script{Name: "park-up", Script: src}, WithScriptForceUpdate())
	require.NoError(t, err)
	require.Equal(t, int64(99), id)
	updates := protocolM.ProtocolScriptUpdateCalls()
	require.Len(t, updates, 1, "强制更新时内容一致也应更新")
	require.Equal(t, src, updates[0].Script)
}

// TestEnsureScript_CreateThenUpdate 验证脚本缺失时先创建再更新为自定义脚本（模板覆盖坑）。
func TestEnsureScript_CreateThenUpdate(t *testing.T) {
	protocolM := protocolmanage.NewProtocolManageMock()
	protocolM.ProtocolScriptGetListFn = func(ctx context.Context, in *protocolmanage.ProtocolScriptGetListReq, _ ...grpc.CallOption) (*protocolmanage.ProtocolScriptGetListResp, error) {
		return &protocolmanage.ProtocolScriptGetListResp{}, nil
	}
	protocolM.ProtocolScriptCreateFn = func(ctx context.Context, in *protocolmanage.ProtocolScript, _ ...grpc.CallOption) (*protocolmanage.ProtocolManageWithID, error) {
		return &protocolmanage.ProtocolManageWithID{Id: 88}, nil
	}

	const src = "func Handle(...){}"
	id, err := EnsureScript(context.Background(), protocolM, Script{
		Name: "用气量差值新增", TriggerDir: 1, TriggerTimer: 1, TriggerHandle: "thing",
		TriggerType: "property", Script: src, Priority: 1,
	})
	require.NoError(t, err)
	require.Equal(t, int64(88), id)
	require.Len(t, protocolM.ProtocolScriptCreateCalls(), 1)
	require.Len(t, protocolM.ProtocolScriptUpdateCalls(), 1, "创建后需用自定义脚本更新（Create 会覆盖 Script）")
	updates := protocolM.ProtocolScriptUpdateCalls()
	require.Equal(t, src, updates[0].Script)
}

// TestEnsureScript_TenantCodeCommon 验证 parksvr 口径：TenantCode 非空时创建与更新均透传。
func TestEnsureScript_TenantCodeCommon(t *testing.T) {
	protocolM := protocolmanage.NewProtocolManageMock()
	protocolM.ProtocolScriptGetListFn = func(ctx context.Context, in *protocolmanage.ProtocolScriptGetListReq, _ ...grpc.CallOption) (*protocolmanage.ProtocolScriptGetListResp, error) {
		return &protocolmanage.ProtocolScriptGetListResp{}, nil
	}
	protocolM.ProtocolScriptCreateFn = func(ctx context.Context, in *protocolmanage.ProtocolScript, _ ...grpc.CallOption) (*protocolmanage.ProtocolManageWithID, error) {
		return &protocolmanage.ProtocolManageWithID{Id: 77}, nil
	}

	const src = "func Handle(...){}"
	_, err := EnsureScript(context.Background(), protocolM, Script{
		Name: "park-camera-up", TriggerDir: 1, TriggerTimer: 1, TriggerHandle: "thing",
		TriggerType: "__all__", Script: src, TenantCode: "common",
	})
	require.NoError(t, err)
	creates := protocolM.ProtocolScriptCreateCalls()
	require.Len(t, creates, 1)
	require.Equal(t, "common", creates[0].TenantCode, "创建应带公共租户")
	require.Equal(t, "__all__", creates[0].TriggerType)
	updates := protocolM.ProtocolScriptUpdateCalls()
	require.Len(t, updates, 1)
	require.Equal(t, "common", updates[0].TenantCode, "更新应带公共租户")
}

// TestEnsureScriptProductBind_AlreadyBound 验证产品级绑定已存在时不重复创建。
func TestEnsureScriptProductBind_AlreadyBound(t *testing.T) {
	protocolM := protocolmanage.NewProtocolManageMock()
	protocolM.ProtocolScriptDeviceGetListFn = func(ctx context.Context, in *protocolmanage.ProtocolScriptDeviceGetListReq, _ ...grpc.CallOption) (*protocolmanage.ProtocolScriptDeviceGetListResp, error) {
		return &protocolmanage.ProtocolScriptDeviceGetListResp{
			List: []*protocolmanage.ProtocolScriptDevice{{ScriptID: 5, ProductID: "p1", TriggerSrc: 1}},
		}, nil
	}

	err := EnsureScriptProductBind(context.Background(), protocolM, 5, "p1", 1)
	require.NoError(t, err)
	require.Empty(t, protocolM.ProtocolScriptDeviceCreateCalls(), "已绑定时不应重复创建")
}

// TestEnsureScriptProductBind_Create 验证绑定缺失时创建产品级绑定（含优先级）。
func TestEnsureScriptProductBind_Create(t *testing.T) {
	protocolM := protocolmanage.NewProtocolManageMock()
	protocolM.ProtocolScriptDeviceGetListFn = func(ctx context.Context, in *protocolmanage.ProtocolScriptDeviceGetListReq, _ ...grpc.CallOption) (*protocolmanage.ProtocolScriptDeviceGetListResp, error) {
		return &protocolmanage.ProtocolScriptDeviceGetListResp{}, nil
	}

	err := EnsureScriptProductBind(context.Background(), protocolM, 5, "p1", 3)
	require.NoError(t, err)
	creates := protocolM.ProtocolScriptDeviceCreateCalls()
	require.Len(t, creates, 1)
	require.Equal(t, int64(5), creates[0].ScriptID)
	require.Equal(t, "p1", creates[0].ProductID)
	require.Equal(t, int64(1), creates[0].TriggerSrc, "应为产品级绑定")
	require.Equal(t, int64(3), creates[0].Priority, "优先级应透传")
}

// TestEnsureProductSchemas 验证产品物模型按 identifier upsert：已存在走 Update，缺失批量 Create。
func TestEnsureProductSchemas(t *testing.T) {
	productM := productmanage.NewProductManageMock()
	productM.ProductSchemaGetListFn = func(ctx context.Context, in *productmanage.ProductSchemaGetListReq, _ ...grpc.CallOption) (*productmanage.ProductSchemaGetListResp, error) {
		return &productmanage.ProductSchemaGetListResp{List: []*productmanage.ProductSchemaInfo{
			{Identifier: "exist_id"},
		}}, nil
	}

	schemas := []*productmanage.ProductSchemaInfo{
		{ProductID: "p1", Identifier: "exist_id", Type: 1, Name: wrapperspb.String("已存在")},
		{ProductID: "p1", Identifier: "new_id_1", Type: 1, Name: wrapperspb.String("新增1")},
		{ProductID: "p1", Identifier: "new_id_2", Type: 2, Name: wrapperspb.String("新增2")},
	}
	err := EnsureProductSchemas(context.Background(), productM, "p1", schemas)
	require.NoError(t, err)

	updates := productM.ProductSchemaUpdateCalls()
	require.Len(t, updates, 1, "已存在标识符应逐个 Update")
	require.Equal(t, "exist_id", updates[0].Info.Identifier)

	creates := productM.ProductSchemaBatchCreateCalls()
	require.Len(t, creates, 1, "缺失标识符应批量 Create")
	require.Equal(t, "p1", creates[0].ProductID)
	require.Len(t, creates[0].List, 2)
}

// TestEnsureProductSchemaIdentifiers 验证通用物模型标识符会以幂等批量新增方式补到已有产品。
func TestEnsureProductSchemaIdentifiers(t *testing.T) {
	productM := productmanage.NewProductManageMock()

	err := EnsureProductSchemaIdentifiers(context.Background(), productM, "water-001", []string{
		"PostiveFlux", "PostiveFluxChange", "ValveStatus", "ValveCtrl",
	})
	require.NoError(t, err)

	creates := productM.ProductSchemaBatchCreateCalls()
	require.Len(t, creates, 1)
	require.Equal(t, "water-001", creates[0].ProductID)
	require.Equal(t, []string{"PostiveFlux", "PostiveFluxChange", "ValveStatus", "ValveCtrl"}, creates[0].Identifiers)
	require.Empty(t, creates[0].List)
}
