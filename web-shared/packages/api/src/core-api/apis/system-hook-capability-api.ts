import type { HookCapabilityGetListReq } from '../models';
import type { HookCapabilityInfo } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemHookCapabilityGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemHookCapabilityApi - axios parameter creator
 */

/**
* 业务说明：声明Hook服务支持的能力点，由code和subCode组成能力标识。code标识业务场景（如dataFilter、userSubscribe），subCode标识具体子场景。业务代码通过code+subCode调用对应Hook服务。
* @summary 新增Hook能力
* @param {HookCapabilityInfo} hookCapabilityInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookCapabilityCreate (
hookCapabilityInfo: HookCapabilityInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/capability/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, hookCapabilityInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除Hook能力声明。删除后业务代码调用该能力将找不到对应服务，可能导致功能降级或失败。建议先下线相关业务流程再删除。
* @summary 删除Hook能力
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookCapabilityDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/capability/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询Hook能力列表，支持按服务ID、code、subCode筛选。用于能力管理页面、服务能力绑定等场景。返回能力标识和关联服务信息。
* @summary 获取Hook能力列表
* @param {HookCapabilityGetListReq} hookCapabilityGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookCapabilityGetList (
hookCapabilityGetListReq: HookCapabilityGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/capability/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemHookCapabilityGetList200Response>>(localVarPath, hookCapabilityGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改已声明的Hook能力配置，支持更新描述、关联服务等。code和subCode通常不可修改以保持业务引用稳定性。
* @summary 更新Hook能力
* @param {HookCapabilityInfo} hookCapabilityInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookCapabilityUpdate (
hookCapabilityInfo: HookCapabilityInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/capability/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, hookCapabilityInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemHookCapabilityCreate operation in SystemHookCapabilityApi.
 */
export interface SystemHookCapabilityApiPostApiV1SystemHookCapabilityCreateRequest {
    readonly hookCapabilityInfo: HookCapabilityInfo
}

/**
 * Request parameters for postApiV1SystemHookCapabilityDelete operation in SystemHookCapabilityApi.
 */
export interface SystemHookCapabilityApiPostApiV1SystemHookCapabilityDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemHookCapabilityGetList operation in SystemHookCapabilityApi.
 */
export interface SystemHookCapabilityApiPostApiV1SystemHookCapabilityGetListRequest {
    readonly hookCapabilityGetListReq: HookCapabilityGetListReq
}

/**
 * Request parameters for postApiV1SystemHookCapabilityUpdate operation in SystemHookCapabilityApi.
 */
export interface SystemHookCapabilityApiPostApiV1SystemHookCapabilityUpdateRequest {
    readonly hookCapabilityInfo: HookCapabilityInfo
}
