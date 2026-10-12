import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemRoleResourceGetList200Response } from '../models';
import type { RoleResourceActionBatchUpdateReq } from '../models';
import type { RoleResourceActionGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemRoleResourceApi - axios parameter creator
 */

/**
* 业务说明：全量替换指定角色的资源动作权限绑定，传入完整的资源-动作列表，未包含的权限将被撤销。
* @summary 批量更新角色资源动作权限
* @param {RoleResourceActionBatchUpdateReq} roleResourceActionBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleResourceBatchUpdate (
roleResourceActionBatchUpdateReq: RoleResourceActionBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/resource/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, roleResourceActionBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定角色已绑定的资源动作权限列表，用于角色编辑页权限回填显示。返回该角色下所有资源-动作对。
* @summary 获取角色资源动作权限列表
* @param {RoleResourceActionGetListReq} roleResourceActionGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleResourceGetList (
roleResourceActionGetListReq: RoleResourceActionGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/resource/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemRoleResourceGetList200Response>>(localVarPath, roleResourceActionGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemRoleResourceBatchUpdate operation in SystemRoleResourceApi.
 */
export interface SystemRoleResourceApiPostApiV1SystemRoleResourceBatchUpdateRequest {
    readonly roleResourceActionBatchUpdateReq: RoleResourceActionBatchUpdateReq
}

/**
 * Request parameters for postApiV1SystemRoleResourceGetList operation in SystemRoleResourceApi.
 */
export interface SystemRoleResourceApiPostApiV1SystemRoleResourceGetListRequest {
    readonly roleResourceActionGetListReq: RoleResourceActionGetListReq
}
