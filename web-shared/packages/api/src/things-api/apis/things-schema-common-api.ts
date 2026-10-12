import type { CommonSchemaDeleteReq } from '../models';
import type { CommonSchemaExportReq } from '../models';
import type { CommonSchemaGetListReq } from '../models';
import type { CommonSchemaImportReq } from '../models';
import type { CommonSchemaInfo } from '../models';
import type { CommonSchemaMockGenReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProductCategoryBatchImport200Response } from '../models';
import type { PostApiV1ThingsSchemaCommonBatchExport200Response } from '../models';
import type { PostApiV1ThingsSchemaCommonGetList200Response } from '../models';
import type { PostApiV1ThingsSchemaCommonMockGen200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsSchemaCommonApi - axios parameter creator
 */

/**
* 业务说明：将选中的通用物模型模板导出为ZIP压缩包。用于物模型模板备份、跨平台迁移
* @summary 批量导出通用物模型
* @param {CommonSchemaExportReq} commonSchemaExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSchemaCommonBatchExport (
commonSchemaExportReq: CommonSchemaExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/schema/common/batch-export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsSchemaCommonBatchExport200Response>>(localVarPath, commonSchemaExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从ZIP压缩包批量导入通用物模型模板数据。用于物模型模板库迁移、第三方物模型库导入
* @summary 批量导入通用物模型
* @param {CommonSchemaImportReq} commonSchemaImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSchemaCommonBatchImport (
commonSchemaImportReq: CommonSchemaImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/schema/common/batch-import`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCategoryBatchImport200Response>>(localVarPath, commonSchemaImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建通用物模型功能点模板。可用于多个产品快速引用，避免重复定义。定义标识符、名称、数据类型、取值范围等
* @summary 新增通用物模型
* @param {CommonSchemaInfo} commonSchemaInfo /_*物模型条目*_/
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSchemaCommonCreate (
commonSchemaInfo: CommonSchemaInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/schema/common/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, commonSchemaInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除通用物模型功能点模板。删除后不影响已引用该功能点的产品，但新产品无法再引用。谨慎操作
* @summary 删除通用物模型
* @param {CommonSchemaDeleteReq} commonSchemaDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSchemaCommonDelete (
commonSchemaDeleteReq: CommonSchemaDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/schema/common/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, commonSchemaDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询通用物模型模板列表。支持按类型【属性、事件、行为】、标识符、品类过滤。可提取多个产品共有的物模型、品类物模型等。用于物模型模板库管理
* @summary 获取通用物模型列表
* @param {CommonSchemaGetListReq} commonSchemaGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSchemaCommonGetList (
commonSchemaGetListReq: CommonSchemaGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/schema/common/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsSchemaCommonGetList200Response>>(localVarPath, commonSchemaGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：初始化系统预置的通用物模型模板库。包含常见设备类型的标准功能点定义【如开关、亮度、温度等】。用于快速创建产品物模型
* @summary 初始化通用物模型
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSchemaCommonInit (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/schema/common/init`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据传入的参数结构自动生成物模型功能点定义。输入属性参数或事件参数生成对应的物模型Affordance JSON。用于快速创建物模型
* @summary 从参数生成物模型定义
* @param {CommonSchemaMockGenReq} commonSchemaMockGenReq  CommonSchemaMockGenReq 从参数生成物模型定义请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSchemaCommonMockGen (
commonSchemaMockGenReq: CommonSchemaMockGenReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/schema/common/mock-gen`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsSchemaCommonMockGen200Response>>(localVarPath, commonSchemaMockGenReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改通用物模型功能点定义。通用物模型可被多个产品引用，修改后影响所有引用该功能点的产品。谨慎操作
* @summary 更新通用物模型
* @param {CommonSchemaInfo} commonSchemaInfo /_*物模型条目*_/
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSchemaCommonUpdate (
commonSchemaInfo: CommonSchemaInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/schema/common/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, commonSchemaInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsSchemaCommonBatchExport operation in ThingsSchemaCommonApi.
 */
export interface ThingsSchemaCommonApiPostApiV1ThingsSchemaCommonBatchExportRequest {
    readonly commonSchemaExportReq: CommonSchemaExportReq
}

/**
 * Request parameters for postApiV1ThingsSchemaCommonBatchImport operation in ThingsSchemaCommonApi.
 */
export interface ThingsSchemaCommonApiPostApiV1ThingsSchemaCommonBatchImportRequest {
    readonly commonSchemaImportReq: CommonSchemaImportReq
}

/**
 * Request parameters for postApiV1ThingsSchemaCommonCreate operation in ThingsSchemaCommonApi.
 */
export interface ThingsSchemaCommonApiPostApiV1ThingsSchemaCommonCreateRequest {
    /**
     * /_*物模型条目*_/
     */
    readonly commonSchemaInfo: CommonSchemaInfo
}

/**
 * Request parameters for postApiV1ThingsSchemaCommonDelete operation in ThingsSchemaCommonApi.
 */
export interface ThingsSchemaCommonApiPostApiV1ThingsSchemaCommonDeleteRequest {
    readonly commonSchemaDeleteReq: CommonSchemaDeleteReq
}

/**
 * Request parameters for postApiV1ThingsSchemaCommonGetList operation in ThingsSchemaCommonApi.
 */
export interface ThingsSchemaCommonApiPostApiV1ThingsSchemaCommonGetListRequest {
    readonly commonSchemaGetListReq: CommonSchemaGetListReq
}

/**
 * Request parameters for postApiV1ThingsSchemaCommonMockGen operation in ThingsSchemaCommonApi.
 */
export interface ThingsSchemaCommonApiPostApiV1ThingsSchemaCommonMockGenRequest {
    /**
     *  CommonSchemaMockGenReq 从参数生成物模型定义请求
     */
    readonly commonSchemaMockGenReq: CommonSchemaMockGenReq
}

/**
 * Request parameters for postApiV1ThingsSchemaCommonUpdate operation in ThingsSchemaCommonApi.
 */
export interface ThingsSchemaCommonApiPostApiV1ThingsSchemaCommonUpdateRequest {
    /**
     * /_*物模型条目*_/
     */
    readonly commonSchemaInfo: CommonSchemaInfo
}
