import type { MenuInfo } from '../models';
import type { MenuInfoGetListReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemAppMenuGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemAppMenuApi - axios parameter creator
 */

/**
* 业务说明：为指定应用创建新的菜单项，包括菜单路径、权限码、图标等配置。菜单是应用的功能导航结构，用于控制用户可见的功能入口和权限粒度。
* @summary 添加菜单
* @param {MenuInfo} menuInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppMenuCreate (
menuInfo: MenuInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/menu/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, menuInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的菜单项，删除后该菜单及关联的权限配置将不可用。删除前需确认无角色绑定该菜单权限，避免权限失效。
* @summary 删除菜单
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppMenuDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/menu/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定应用下的菜单列表，支持按路径筛选、返回树形结构、筛选收藏菜单等。用于应用菜单管理页面的菜单树展示和权限配置。
* @summary 获取菜单列表
* @param {MenuInfoGetListReq} menuInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppMenuGetList (
menuInfoGetListReq: MenuInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/menu/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppMenuGetList200Response>>(localVarPath, menuInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改菜单配置（名称、路径、图标、排序等），支持部分更新。用于菜单结构调整和权限码变更，变更后立即影响用户可见的功能入口。
* @summary 更新菜单
* @param {MenuInfo} menuInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppMenuUpdate (
menuInfo: MenuInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/menu/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, menuInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemAppMenuCreate operation in SystemAppMenuApi.
 */
export interface SystemAppMenuApiPostApiV1SystemAppMenuCreateRequest {
    readonly menuInfo: MenuInfo
}

/**
 * Request parameters for postApiV1SystemAppMenuDelete operation in SystemAppMenuApi.
 */
export interface SystemAppMenuApiPostApiV1SystemAppMenuDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemAppMenuGetList operation in SystemAppMenuApi.
 */
export interface SystemAppMenuApiPostApiV1SystemAppMenuGetListRequest {
    readonly menuInfoGetListReq: MenuInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemAppMenuUpdate operation in SystemAppMenuApi.
 */
export interface SystemAppMenuApiPostApiV1SystemAppMenuUpdateRequest {
    readonly menuInfo: MenuInfo
}
