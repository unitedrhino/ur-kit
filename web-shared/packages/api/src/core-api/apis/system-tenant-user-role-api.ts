import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemTenantUserRoleGetList200Response } from '../models';
import type { TenantUserRoleBatchUpdateReq } from '../models';
import type { TenantUserRoleGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantUserRoleApi - axios parameter creator
 */

/**
* 业务说明：批量更新指定用户在租户中的角色分配，可新增或移除角色。仅租户管理员可操作，用于用户角色管理功能。
* @summary 更新租户用户的角色列表
* @param {TenantUserRoleBatchUpdateReq} tenantUserRoleBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserRoleBatchUpdate (
tenantUserRoleBatchUpdateReq: TenantUserRoleBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/role/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantUserRoleBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定用户在租户中已分配的角色列表。用于用户管理页面展示用户角色、编辑角色分配时的初始数据加载。
* @summary 获取租户用户角色列表
* @param {TenantUserRoleGetListReq} tenantUserRoleGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserRoleGetList (
tenantUserRoleGetListReq: TenantUserRoleGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/role/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantUserRoleGetList200Response>>(localVarPath, tenantUserRoleGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantUserRoleBatchUpdate operation in SystemTenantUserRoleApi.
 */
export interface SystemTenantUserRoleApiPostApiV1SystemTenantUserRoleBatchUpdateRequest {
    readonly tenantUserRoleBatchUpdateReq: TenantUserRoleBatchUpdateReq
}

/**
 * Request parameters for postApiV1SystemTenantUserRoleGetList operation in SystemTenantUserRoleApi.
 */
export interface SystemTenantUserRoleApiPostApiV1SystemTenantUserRoleGetListRequest {
    readonly tenantUserRoleGetListReq: TenantUserRoleGetListReq
}
