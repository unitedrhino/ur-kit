import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProductSchemaGetList200Response } from '../models';
import type { PostApiV1ThingsProductSchemaTslRead200Response } from '../models';
import type { ProductSchemaBatchCreateReq } from '../models';
import type { ProductSchemaDeleteReq } from '../models';
import type { ProductSchemaGetListReq } from '../models';
import type { ProductSchemaInfo } from '../models';
import type { ProductSchemaTslGetOneReq } from '../models';
import type { ProductSchemaTslImportReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProductSchemaApi - axios parameter creator
 */

/**
* 业务说明：批量创建产品物模型功能点。可通过标识符列表批量创建，或直接传入功能点定义列表。用于物模型快速初始化
* @summary 批量创建产品物模型
* @param {ProductSchemaBatchCreateReq} productSchemaBatchCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductSchemaBatchCreate (
productSchemaBatchCreateReq: ProductSchemaBatchCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/schema/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productSchemaBatchCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：为产品创建物模型功能点。功能类型：1=属性【传感器数据、状态参数】、2=事件【告警、故障上报】、3=行为【控制命令、服务调用】。定义标识符、数据类型、取值范围、读写属性等
* @summary 创建产品物模型
* @param {ProductSchemaInfo} productSchemaInfo /_*物模型条目*_/
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductSchemaCreate (
productSchemaInfo: ProductSchemaInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/schema/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productSchemaInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除产品物模型功能点。必选标签【tag=3】的功能点不可删除。删除后设备上报该标识符数据不再解析
* @summary 删除产品物模型
* @param {ProductSchemaDeleteReq} productSchemaDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductSchemaDelete (
productSchemaDeleteReq: ProductSchemaDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/schema/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productSchemaDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询产品物模型功能点列表。支持按类型【属性、事件、行为】、标签【自定义、可选、必选】、标识符过滤。返回功能点定义详情包括数据类型、取值范围、读写属性、场景联动支持等
* @summary 获取产品物模型
* @param {ProductSchemaGetListReq} productSchemaGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductSchemaGetList (
productSchemaGetListReq: ProductSchemaGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/schema/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductSchemaGetList200Response>>(localVarPath, productSchemaGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从TSL JSON格式导入产品物模型定义。TSL包含属性、事件、行为三种类型功能点。用于物模型批量迁移、模板导入
* @summary 导入产品物模型tsl
* @param {ProductSchemaTslImportReq} productSchemaTslImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductSchemaTslImport (
productSchemaTslImportReq: ProductSchemaTslImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/schema/tsl-import`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productSchemaTslImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取产品物模型的TSL JSON格式定义。TSL格式符合物联网平台物模型规范，用于物模型导出、第三方系统集成
* @summary 获取产品物模型tsl
* @param {ProductSchemaTslGetOneReq} productSchemaTslGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductSchemaTslRead (
productSchemaTslGetOneReq: ProductSchemaTslGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/schema/tsl-read`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductSchemaTslRead200Response>>(localVarPath, productSchemaTslGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改产品物模型功能点定义。支持更新名称、描述、数据类型、取值范围、读写属性等。标识符不可修改
* @summary 更新产品物模型
* @param {ProductSchemaInfo} productSchemaInfo /_*物模型条目*_/
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductSchemaUpdate (
productSchemaInfo: ProductSchemaInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/schema/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productSchemaInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProductSchemaBatchCreate operation in ThingsProductSchemaApi.
 */
export interface ThingsProductSchemaApiPostApiV1ThingsProductSchemaBatchCreateRequest {
    readonly productSchemaBatchCreateReq: ProductSchemaBatchCreateReq
}

/**
 * Request parameters for postApiV1ThingsProductSchemaCreate operation in ThingsProductSchemaApi.
 */
export interface ThingsProductSchemaApiPostApiV1ThingsProductSchemaCreateRequest {
    /**
     * /_*物模型条目*_/
     */
    readonly productSchemaInfo: ProductSchemaInfo
}

/**
 * Request parameters for postApiV1ThingsProductSchemaDelete operation in ThingsProductSchemaApi.
 */
export interface ThingsProductSchemaApiPostApiV1ThingsProductSchemaDeleteRequest {
    readonly productSchemaDeleteReq: ProductSchemaDeleteReq
}

/**
 * Request parameters for postApiV1ThingsProductSchemaGetList operation in ThingsProductSchemaApi.
 */
export interface ThingsProductSchemaApiPostApiV1ThingsProductSchemaGetListRequest {
    readonly productSchemaGetListReq: ProductSchemaGetListReq
}

/**
 * Request parameters for postApiV1ThingsProductSchemaTslImport operation in ThingsProductSchemaApi.
 */
export interface ThingsProductSchemaApiPostApiV1ThingsProductSchemaTslImportRequest {
    readonly productSchemaTslImportReq: ProductSchemaTslImportReq
}

/**
 * Request parameters for postApiV1ThingsProductSchemaTslRead operation in ThingsProductSchemaApi.
 */
export interface ThingsProductSchemaApiPostApiV1ThingsProductSchemaTslReadRequest {
    readonly productSchemaTslGetOneReq: ProductSchemaTslGetOneReq
}

/**
 * Request parameters for postApiV1ThingsProductSchemaUpdate operation in ThingsProductSchemaApi.
 */
export interface ThingsProductSchemaApiPostApiV1ThingsProductSchemaUpdateRequest {
    /**
     * /_*物模型条目*_/
     */
    readonly productSchemaInfo: ProductSchemaInfo
}
