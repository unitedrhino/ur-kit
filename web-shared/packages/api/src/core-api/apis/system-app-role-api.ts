import type { AppRoleInfo } from '../models';
import type { AppRoleInfoGetListReq } from '../models';
import type { AppRoleMenuBatchUpdateReq } from '../models';
import type { AppRoleMenuGetListReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemAppRoleGetList200Response } from '../models';
import type { PostApiV1SystemAppRoleMenuGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemAppRoleApi - axios parameter creator
 */

/**
* 业务说明:创建应用自定义角色并绑定关联应用(apps,可多选),角色名称与编码全局唯一;绑定应用时自动复制角色记录到角色表(Scope=app)接入既有角色链路。仅平台管理员可操作。
* @summary 添加应用角色
* @param {AppRoleInfo} appRoleInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppRoleCreate (
appRoleInfo: AppRoleInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/role/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, appRoleInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明:删除应用自定义角色,并级联清理其复制到角色表的记录、关联应用与菜单权限。仅平台管理员可操作。
* @summary 删除应用角色
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppRoleDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/role/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明:分页查询应用自定义角色,支持按关联应用、名称、编码过滤。仅平台管理员可查看。
* @summary 获取应用角色列表
* @param {AppRoleInfoGetListReq} appRoleInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppRoleGetList (
appRoleInfoGetListReq: AppRoleInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/role/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppRoleGetList200Response>>(localVarPath, appRoleInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明:全量替换应用角色在某关联应用下的菜单权限(落角色菜单关联表)。仅平台管理员可操作。
* @summary 批量更新应用角色菜单权限
* @param {AppRoleMenuBatchUpdateReq} appRoleMenuBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppRoleMenuBatchUpdate (
appRoleMenuBatchUpdateReq: AppRoleMenuBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/role/menu/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, appRoleMenuBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明:查询应用角色在某关联应用下已授权的菜单ID列表。仅平台管理员可查看。
* @summary 获取应用角色菜单权限
* @param {AppRoleMenuGetListReq} appRoleMenuGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppRoleMenuGetList (
appRoleMenuGetListReq: AppRoleMenuGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/role/menu/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppRoleMenuGetList200Response>>(localVarPath, appRoleMenuGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明:修改应用角色的名称、编码、描述、完全授权标记,并全量调整关联应用(新增关联自动复制角色记录,移除关联级联清理)。仅平台管理员可操作。
* @summary 更新应用角色
* @param {AppRoleInfo} appRoleInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppRoleUpdate (
appRoleInfo: AppRoleInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/role/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, appRoleInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemAppRoleCreate operation in SystemAppRoleApi.
 */
export interface SystemAppRoleApiPostApiV1SystemAppRoleCreateRequest {
    readonly appRoleInfo: AppRoleInfo
}

/**
 * Request parameters for postApiV1SystemAppRoleDelete operation in SystemAppRoleApi.
 */
export interface SystemAppRoleApiPostApiV1SystemAppRoleDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemAppRoleGetList operation in SystemAppRoleApi.
 */
export interface SystemAppRoleApiPostApiV1SystemAppRoleGetListRequest {
    readonly appRoleInfoGetListReq: AppRoleInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemAppRoleMenuBatchUpdate operation in SystemAppRoleApi.
 */
export interface SystemAppRoleApiPostApiV1SystemAppRoleMenuBatchUpdateRequest {
    readonly appRoleMenuBatchUpdateReq: AppRoleMenuBatchUpdateReq
}

/**
 * Request parameters for postApiV1SystemAppRoleMenuGetList operation in SystemAppRoleApi.
 */
export interface SystemAppRoleApiPostApiV1SystemAppRoleMenuGetListRequest {
    readonly appRoleMenuGetListReq: AppRoleMenuGetListReq
}

/**
 * Request parameters for postApiV1SystemAppRoleUpdate operation in SystemAppRoleApi.
 */
export interface SystemAppRoleApiPostApiV1SystemAppRoleUpdateRequest {
    readonly appRoleInfo: AppRoleInfo
}
