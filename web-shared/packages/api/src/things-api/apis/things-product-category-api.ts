import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProductCategoryBatchExport200Response } from '../models';
import type { PostApiV1ThingsProductCategoryBatchImport200Response } from '../models';
import type { PostApiV1ThingsProductCategoryGetList200Response } from '../models';
import type { PostApiV1ThingsProductCategoryGetOne200Response } from '../models';
import type { PostApiV1ThingsProductCategorySchemaGetList200Response } from '../models';
import type { ProductCategory } from '../models';
import type { ProductCategoryExportReq } from '../models';
import type { ProductCategoryGetListReq } from '../models';
import type { ProductCategoryImportReq } from '../models';
import type { ProductCategorySchemaBatchSaveReq } from '../models';
import type { ProductCategorySchemaGetListReq } from '../models';
import type { WithID } from '../models';
import type { WithIDChildren } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProductCategoryApi - axios parameter creator
 */

/**
* 业务说明：将选中的品类数据导出为ZIP压缩包。压缩包包含品类树形结构、物模型定义、图片资源。用于品类数据备份、跨平台迁移
* @summary 批量导出产品品类
* @param {ProductCategoryExportReq} productCategoryExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategoryBatchExport (
productCategoryExportReq: ProductCategoryExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/batch-export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCategoryBatchExport200Response>>(localVarPath, productCategoryExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从ZIP压缩包批量导入品类数据。压缩包包含品类树形结构JSON和物模型定义文件。用于品类数据迁移、模板批量部署
* @summary 批量导入产品品类
* @param {ProductCategoryImportReq} productCategoryImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategoryBatchImport (
productCategoryImportReq: ProductCategoryImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/batch-import`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCategoryBatchImport200Response>>(localVarPath, productCategoryImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建产品品类分类节点，用于组织管理产品。品类支持层级结构，可设置父品类。品类编码全局唯一，创建后不可修改。品类可用于筛选设备统计、产品分类展示
* @summary 新增产品品类
* @param {ProductCategory} productCategory
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategoryCreate (
productCategory: ProductCategory,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productCategory, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除产品品类节点。如品类有子品类或关联产品，需先清理关联数据。删除后品类下的设备统计不再显示
* @summary 删除产品品类
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategoryDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询产品品类树形列表。支持按名称、编码、父品类过滤。返回品类基本信息、层级路径、设备数量统计。可加载子品类树形结构
* @summary 获取产品品类列表
* @param {ProductCategoryGetListReq} productCategoryGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategoryGetList (
productCategoryGetListReq: ProductCategoryGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCategoryGetList200Response>>(localVarPath, productCategoryGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据品类ID查询品类完整信息。返回品类名称、编码、描述、图片、层级路径。可选择同时加载子品类列表
* @summary 获取产品品类详情
* @param {WithIDChildren} withIDChildren
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategoryGetOne (
withIDChildren: WithIDChildren,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCategoryGetOne200Response>>(localVarPath, withIDChildren, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：向品类追加物模型标识符。标识符对应物模型中的属性、事件、服务定义。用于丰富品类功能模板
* @summary 批量新增产品品类物模型
* @param {ProductCategorySchemaBatchSaveReq} productCategorySchemaBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategorySchemaBatchCreate (
productCategorySchemaBatchSaveReq: ProductCategorySchemaBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/schema/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productCategorySchemaBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从品类移除物模型标识符。移除后不影响已创建的产品，仅影响后续新建产品的默认物模型继承
* @summary 批量删除产品品类物模型
* @param {ProductCategorySchemaBatchSaveReq} productCategorySchemaBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategorySchemaBatchDelete (
productCategorySchemaBatchSaveReq: ProductCategorySchemaBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/schema/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productCategorySchemaBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新品类关联的物模型标识符列表。品类物模型用于定义该品类产品的标准功能点，创建产品时可继承品类物模型模板
* @summary 批量更新产品品类物模型
* @param {ProductCategorySchemaBatchSaveReq} productCategorySchemaBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategorySchemaBatchUpdate (
productCategorySchemaBatchSaveReq: ProductCategorySchemaBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/schema/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productCategorySchemaBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询品类关联的物模型标识符列表。返回标识符ID、名称。可选择加载父品类的物模型继承链。用于品类物模型模板查看
* @summary 获取产品品类物模型列表
* @param {ProductCategorySchemaGetListReq} productCategorySchemaGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategorySchemaGetList (
productCategorySchemaGetListReq: ProductCategorySchemaGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/schema/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCategorySchemaGetList200Response>>(localVarPath, productCategorySchemaGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改品类名称、描述、图片、排序等属性。支持部分更新，空值字段保持原值不变。品类编码不可修改
* @summary 更新产品品类
* @param {ProductCategory} productCategory
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCategoryUpdate (
productCategory: ProductCategory,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/category/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productCategory, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProductCategoryBatchExport operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategoryBatchExportRequest {
    readonly productCategoryExportReq: ProductCategoryExportReq
}

/**
 * Request parameters for postApiV1ThingsProductCategoryBatchImport operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategoryBatchImportRequest {
    readonly productCategoryImportReq: ProductCategoryImportReq
}

/**
 * Request parameters for postApiV1ThingsProductCategoryCreate operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategoryCreateRequest {
    readonly productCategory: ProductCategory
}

/**
 * Request parameters for postApiV1ThingsProductCategoryDelete operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategoryDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsProductCategoryGetList operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategoryGetListRequest {
    readonly productCategoryGetListReq: ProductCategoryGetListReq
}

/**
 * Request parameters for postApiV1ThingsProductCategoryGetOne operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategoryGetOneRequest {
    readonly withIDChildren: WithIDChildren
}

/**
 * Request parameters for postApiV1ThingsProductCategorySchemaBatchCreate operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategorySchemaBatchCreateRequest {
    readonly productCategorySchemaBatchSaveReq: ProductCategorySchemaBatchSaveReq
}

/**
 * Request parameters for postApiV1ThingsProductCategorySchemaBatchDelete operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategorySchemaBatchDeleteRequest {
    readonly productCategorySchemaBatchSaveReq: ProductCategorySchemaBatchSaveReq
}

/**
 * Request parameters for postApiV1ThingsProductCategorySchemaBatchUpdate operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategorySchemaBatchUpdateRequest {
    readonly productCategorySchemaBatchSaveReq: ProductCategorySchemaBatchSaveReq
}

/**
 * Request parameters for postApiV1ThingsProductCategorySchemaGetList operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategorySchemaGetListRequest {
    readonly productCategorySchemaGetListReq: ProductCategorySchemaGetListReq
}

/**
 * Request parameters for postApiV1ThingsProductCategoryUpdate operation in ThingsProductCategoryApi.
 */
export interface ThingsProductCategoryApiPostApiV1ThingsProductCategoryUpdateRequest {
    readonly productCategory: ProductCategory
}
