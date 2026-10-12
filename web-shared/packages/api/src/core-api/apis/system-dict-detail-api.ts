import type { DictDetail } from '../models';
import type { DictDetailGetListReq } from '../models';
import type { DictDetailGetOneReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemDictDetailGetList200Response } from '../models';
import type { PostApiV1SystemDictDetailGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemDictDetailApi - axios parameter creator
 */

/**
* 业务说明：为指定字典类型添加具体的字典项，包括展示值、字典值、排序、父子关系等。字典详情是字典分类下的具体选项，用于下拉选择、枚举映射等场景。
* @summary 添加字典详情
* @param {DictDetail} dictDetail
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictDetailCreate (
dictDetail: DictDetail,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/detail/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, dictDetail, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的字典项，删除后该选项不再出现在相关下拉选择中。删除前需确认无业务数据引用该字典值，避免数据完整性问题。树型字典删除父节点会级联影响子节点。
* @summary 删除字典详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictDetailDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/detail/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定字典类型下的字典项列表，支持按父节点、状态、标签、值等条件筛选。用于字典管理页面展示字典项，或前端下拉组件获取选项数据。
* @summary 获取字典详情列表
* @param {DictDetailGetListReq} dictDetailGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictDetailGetList (
dictDetailGetListReq: DictDetailGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/detail/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDictDetailGetList200Response>>(localVarPath, dictDetailGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个字典项的详细信息，支持按ID或字典编码+值查询。可选返回父级或子级字典项，用于字典项编辑页面加载初始数据，或级联选择器获取子级选项。
* @summary 获取字典详情单个
* @param {DictDetailGetOneReq} dictDetailGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictDetailGetOne (
dictDetailGetOneReq: DictDetailGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/detail/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDictDetailGetOne200Response>>(localVarPath, dictDetailGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改字典项配置，包括标签、值、排序、状态等，支持部分更新。用于调整字典项的显示顺序、启用禁用状态，变更后立即影响相关业务字段的选择范围。
* @summary 更新字典详情
* @param {DictDetail} dictDetail
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDictDetailUpdate (
dictDetail: DictDetail,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dict/detail/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, dictDetail, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemDictDetailCreate operation in SystemDictDetailApi.
 */
export interface SystemDictDetailApiPostApiV1SystemDictDetailCreateRequest {
    readonly dictDetail: DictDetail
}

/**
 * Request parameters for postApiV1SystemDictDetailDelete operation in SystemDictDetailApi.
 */
export interface SystemDictDetailApiPostApiV1SystemDictDetailDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemDictDetailGetList operation in SystemDictDetailApi.
 */
export interface SystemDictDetailApiPostApiV1SystemDictDetailGetListRequest {
    readonly dictDetailGetListReq: DictDetailGetListReq
}

/**
 * Request parameters for postApiV1SystemDictDetailGetOne operation in SystemDictDetailApi.
 */
export interface SystemDictDetailApiPostApiV1SystemDictDetailGetOneRequest {
    readonly dictDetailGetOneReq: DictDetailGetOneReq
}

/**
 * Request parameters for postApiV1SystemDictDetailUpdate operation in SystemDictDetailApi.
 */
export interface SystemDictDetailApiPostApiV1SystemDictDetailUpdateRequest {
    readonly dictDetail: DictDetail
}
