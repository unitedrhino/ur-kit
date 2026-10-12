import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemTenantAppMenuGetList200Response } from '../models';
import type { TenantMenu } from '../models';
import type { TenantMenuGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantAppMenuApi - axios parameter creator
 */

/**
* 业务说明：查询租户在指定应用下的菜单配置列表，支持返回树形结构。用于应用菜单配置管理页面，可查看和编辑租户对应用菜单的定制。
* @summary 获取租户应用菜单列表
* @param {TenantMenuGetListReq} tenantMenuGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAppMenuGetList (
tenantMenuGetListReq: TenantMenuGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/app/menu/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantAppMenuGetList200Response>>(localVarPath, tenantMenuGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改租户应用菜单的配置，如菜单名称、图标、排序、是否收藏/隐藏等。租户管理员可修改本租户的菜单配置，平台管理员可修改任意租户的菜单配置。
* @summary 更新租户应用菜单
* @param {TenantMenu} tenantMenu
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAppMenuUpdate (
tenantMenu: TenantMenu,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/app/menu/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, tenantMenu, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantAppMenuGetList operation in SystemTenantAppMenuApi.
 */
export interface SystemTenantAppMenuApiPostApiV1SystemTenantAppMenuGetListRequest {
    readonly tenantMenuGetListReq: TenantMenuGetListReq
}

/**
 * Request parameters for postApiV1SystemTenantAppMenuUpdate operation in SystemTenantAppMenuApi.
 */
export interface SystemTenantAppMenuApiPostApiV1SystemTenantAppMenuUpdateRequest {
    readonly tenantMenu: TenantMenu
}
