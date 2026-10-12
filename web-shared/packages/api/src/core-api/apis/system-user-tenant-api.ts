import type { PostApiV1SystemUserTenantGetList200Response } from '../models';
import type { UserTenantGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemUserTenantApi - axios parameter creator
 */

/**
* 业务说明：查询指定用户所属的所有租户信息，返回租户编码、用户在该租户的状态、角色等信息。用于管理员查看用户的租户归属、跨租户用户管理等场景。可同时返回用户在各租户的角色信息。
* @summary 用户所处的租户列表
* @param {UserTenantGetListReq} userTenantGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserTenantGetList (
userTenantGetListReq: UserTenantGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/tenant/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserTenantGetList200Response>>(localVarPath, userTenantGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemUserTenantGetList operation in SystemUserTenantApi.
 */
export interface SystemUserTenantApiPostApiV1SystemUserTenantGetListRequest {
    readonly userTenantGetListReq: UserTenantGetListReq
}
