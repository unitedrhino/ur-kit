import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemRoleAppGetList200Response } from '../models';
import type { RoleAppBatchUpdateReq } from '../models';
import type { RoleAppGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemRoleAppApi - axios parameter creator
 */

/**
* 业务说明：批量设置角色可访问的应用列表。控制角色能看到哪些应用入口。用于应用级权限控制，如限制普通用户只能访问特定模块的应用。
* @summary 更新APP权限
* @param {RoleAppBatchUpdateReq} roleAppBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleAppBatchUpdate (
roleAppBatchUpdateReq: RoleAppBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/app/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, roleAppBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询角色已授权的应用列表。用于查看角色当前应用权限配置、权限对比、授权编辑等场景。返回应用ID列表和总数。
* @summary 获取APP权限列表
* @param {RoleAppGetListReq} roleAppGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleAppGetList (
roleAppGetListReq: RoleAppGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/app/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemRoleAppGetList200Response>>(localVarPath, roleAppGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemRoleAppBatchUpdate operation in SystemRoleAppApi.
 */
export interface SystemRoleAppApiPostApiV1SystemRoleAppBatchUpdateRequest {
    readonly roleAppBatchUpdateReq: RoleAppBatchUpdateReq
}

/**
 * Request parameters for postApiV1SystemRoleAppGetList operation in SystemRoleAppApi.
 */
export interface SystemRoleAppApiPostApiV1SystemRoleAppGetListRequest {
    readonly roleAppGetListReq: RoleAppGetListReq
}
