import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemRoleMenuGetList200Response } from '../models';
import type { RoleMenuBatchUpdateReq } from '../models';
import type { RoleMenuGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemRoleMenuApi - axios parameter creator
 */

/**
* 业务说明：批量设置角色在指定应用下可访问的菜单列表。控制角色能看到哪些菜单项和页面入口。用于菜单级权限控制，如隐藏管理菜单、限制敏感功能入口等。
* @summary 更新角色对应菜单列表
* @param {RoleMenuBatchUpdateReq} roleMenuBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleMenuBatchUpdate (
roleMenuBatchUpdateReq: RoleMenuBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/menu/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, roleMenuBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询角色在指定应用下已授权的菜单列表。用于查看角色当前菜单权限配置、菜单权限对比、授权编辑等场景。返回菜单ID数组。
* @summary 获取角色对应菜单列表
* @param {RoleMenuGetListReq} roleMenuGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleMenuGetList (
roleMenuGetListReq: RoleMenuGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/menu/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemRoleMenuGetList200Response>>(localVarPath, roleMenuGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemRoleMenuBatchUpdate operation in SystemRoleMenuApi.
 */
export interface SystemRoleMenuApiPostApiV1SystemRoleMenuBatchUpdateRequest {
    readonly roleMenuBatchUpdateReq: RoleMenuBatchUpdateReq
}

/**
 * Request parameters for postApiV1SystemRoleMenuGetList operation in SystemRoleMenuApi.
 */
export interface SystemRoleMenuApiPostApiV1SystemRoleMenuGetListRequest {
    readonly roleMenuGetListReq: RoleMenuGetListReq
}
