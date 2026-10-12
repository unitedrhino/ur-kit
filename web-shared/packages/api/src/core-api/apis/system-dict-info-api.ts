import type { DictInfo } from '../models';
import type { DictInfoGetListReq } from '../models';
import type { DictInfoGetOneReq } from '../models';
import type { DictInfoMultExportReq } from '../models';
import type { DictInfoMultImportReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemDictInfoBatchExport200Response } from '../models';
import type { PostApiV1SystemDictInfoBatchImport200Response } from '../models';
import type { PostApiV1SystemDictInfoGetList200Response } from '../models';
import type { PostApiV1SystemDictInfoGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemDictInfoApi - axios parameter creator
 */

/**
* 业务说明：批量导出字典分类和字典项数据为JSON格式，用于数据备份或跨系统迁移。可指定导出的字典编码列表，不指定则导出全部。导出数据可直接用于批量导入接口。
* @summary 批量导出字典信息
* @param {DictInfoMultExportReq} dictInfoMultExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictInfoBatchExport (
dictInfoMultExportReq: DictInfoMultExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/info/batch-export`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDictInfoBatchExport200Response>>(localVarPath, dictInfoMultExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量导入字典分类和字典项数据，用于系统初始化或数据迁移场景。传入JSON格式的字典数据，返回导入统计（成功数、失败数、忽略数）。支持覆盖或跳过已存在的字典。
* @summary 批量导入字典信息
* @param {DictInfoMultImportReq} dictInfoMultImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictInfoBatchImport (
dictInfoMultImportReq: DictInfoMultImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/info/batch-import`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDictInfoBatchImport200Response>>(localVarPath, dictInfoMultImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建新的字典分类，包括字典名称、编码、分组、结构类型（列表/树型）等。字典分类是字典项的容器，用于组织和管理业务枚举值，如设备类型、状态码等。
* @summary 添加字典信息
* @param {DictInfo} dictInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictInfoCreate (
dictInfo: DictInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, dictInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的字典分类，删除后该分类及下属所有字典项均不可用。删除前需确认无业务数据引用该字典分类下的字典值，避免数据完整性问题。此操作不可恢复。
* @summary 删除字典信息
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询字典分类列表，支持按名称、分组、状态等条件筛选。可选同时返回每个字典分类下的详情项（withDetail参数）。用于字典管理页面的分类列表展示。
* @summary 获取字典信息列表
* @param {DictInfoGetListReq} dictInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictInfoGetList (
dictInfoGetListReq: DictInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDictInfoGetList200Response>>(localVarPath, dictInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个字典分类的完整配置信息，支持按ID或编码查询。用于字典分类编辑页面加载初始数据，或查看字典分类的详细配置和关联的详情项。
* @summary 获取字典信息详情
* @param {DictInfoGetOneReq} dictInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictInfoGetOne (
dictInfoGetOneReq: DictInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDictInfoGetOne200Response>>(localVarPath, dictInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改字典分类配置，包括名称、描述、状态等，支持部分更新。结构类型（列表/树型）创建后不可修改。用于调整字典分类的基本信息和启用禁用状态。
* @summary 更新字典信息
* @param {DictInfo} dictInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictInfoUpdate (
dictInfo: DictInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, dictInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemDictInfoBatchExport operation in SystemDictInfoApi.
 */
export interface SystemDictInfoApiPostApiV1SystemDictInfoBatchExportRequest {
    readonly dictInfoMultExportReq: DictInfoMultExportReq
}

/**
 * Request parameters for postApiV1SystemDictInfoBatchImport operation in SystemDictInfoApi.
 */
export interface SystemDictInfoApiPostApiV1SystemDictInfoBatchImportRequest {
    readonly dictInfoMultImportReq: DictInfoMultImportReq
}

/**
 * Request parameters for postApiV1SystemDictInfoCreate operation in SystemDictInfoApi.
 */
export interface SystemDictInfoApiPostApiV1SystemDictInfoCreateRequest {
    readonly dictInfo: DictInfo
}

/**
 * Request parameters for postApiV1SystemDictInfoDelete operation in SystemDictInfoApi.
 */
export interface SystemDictInfoApiPostApiV1SystemDictInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemDictInfoGetList operation in SystemDictInfoApi.
 */
export interface SystemDictInfoApiPostApiV1SystemDictInfoGetListRequest {
    readonly dictInfoGetListReq: DictInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemDictInfoGetOne operation in SystemDictInfoApi.
 */
export interface SystemDictInfoApiPostApiV1SystemDictInfoGetOneRequest {
    readonly dictInfoGetOneReq: DictInfoGetOneReq
}

/**
 * Request parameters for postApiV1SystemDictInfoUpdate operation in SystemDictInfoApi.
 */
export interface SystemDictInfoApiPostApiV1SystemDictInfoUpdateRequest {
    readonly dictInfo: DictInfo
}
