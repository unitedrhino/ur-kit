import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemUserSelfAccessTokenCreate200Response } from '../models';
import type { PostApiV1SystemUserSelfAccessTokenGetList200Response } from '../models';
import type { UserAccessTokenCreateReq } from '../models';
import type { UserAccessTokenGetListReq } from '../models';
import type { UserAccessTokenUpdateReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemUserSelfAccessTokenApi - axios parameter creator
 */

/**
* 业务说明：为当前用户创建个人访问令牌（类似GitHub PAT），用于API调用认证、脚本自动化等场景。可设置可访问的租户范围、到期时间和用途描述。创建成功后返回完整的访问密钥，密钥仅在创建时可见，后续查询只显示访问密钥标识。
* @summary 创建访问令牌
* @param {UserAccessTokenCreateReq} userAccessTokenCreateReq  创建访问令牌请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfAccessTokenCreate (
userAccessTokenCreateReq: UserAccessTokenCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/access-token/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfAccessTokenCreate200Response>>(localVarPath, userAccessTokenCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的访问令牌。删除后该令牌立即失效，使用该令牌的API调用将认证失败。用于令牌不再需要、安全风险清理等场景。
* @summary 删除访问令牌
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfAccessTokenDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/access-token/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户创建的所有访问令牌列表，支持按访问密钥标识过滤。返回令牌基本信息（不含密钥本身）。用于令牌管理界面展示、查看已有令牌等场景。
* @summary 获取访问令牌列表
* @param {UserAccessTokenGetListReq} userAccessTokenGetListReq  获取访问令牌列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfAccessTokenGetList (
userAccessTokenGetListReq: UserAccessTokenGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/access-token/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfAccessTokenGetList200Response>>(localVarPath, userAccessTokenGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取指定访问令牌的详细信息，包括访问密钥标识、可访问租户范围、到期时间、创建时间等。注意：访问密钥（secret）仅在创建时返回，后续查询不显示。用于令牌管理、查看令牌配置等场景。
* @summary 获取访问令牌详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfAccessTokenGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/access-token/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfAccessTokenCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新指定访问令牌的配置，包括可访问租户范围、到期时间、用途描述等。用于调整令牌权限范围、延长或缩短有效期等场景。不支持更新访问密钥本身。
* @summary 更新访问令牌
* @param {UserAccessTokenUpdateReq} userAccessTokenUpdateReq  更新访问令牌请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfAccessTokenUpdate (
userAccessTokenUpdateReq: UserAccessTokenUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/access-token/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userAccessTokenUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemUserSelfAccessTokenCreate operation in SystemUserSelfAccessTokenApi.
 */
export interface SystemUserSelfAccessTokenApiPostApiV1SystemUserSelfAccessTokenCreateRequest {
    /**
     *  创建访问令牌请求
     */
    readonly userAccessTokenCreateReq: UserAccessTokenCreateReq
}

/**
 * Request parameters for postApiV1SystemUserSelfAccessTokenDelete operation in SystemUserSelfAccessTokenApi.
 */
export interface SystemUserSelfAccessTokenApiPostApiV1SystemUserSelfAccessTokenDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemUserSelfAccessTokenGetList operation in SystemUserSelfAccessTokenApi.
 */
export interface SystemUserSelfAccessTokenApiPostApiV1SystemUserSelfAccessTokenGetListRequest {
    /**
     *  获取访问令牌列表请求
     */
    readonly userAccessTokenGetListReq: UserAccessTokenGetListReq
}

/**
 * Request parameters for postApiV1SystemUserSelfAccessTokenGetOne operation in SystemUserSelfAccessTokenApi.
 */
export interface SystemUserSelfAccessTokenApiPostApiV1SystemUserSelfAccessTokenGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemUserSelfAccessTokenUpdate operation in SystemUserSelfAccessTokenApi.
 */
export interface SystemUserSelfAccessTokenApiPostApiV1SystemUserSelfAccessTokenUpdateRequest {
    /**
     *  更新访问令牌请求
     */
    readonly userAccessTokenUpdateReq: UserAccessTokenUpdateReq
}
