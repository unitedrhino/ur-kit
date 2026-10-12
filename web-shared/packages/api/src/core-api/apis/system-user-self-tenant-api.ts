import type { PostApiV1SystemTenantUserGetOne200Response } from '../models';
import type { PostApiV1SystemUserSelfTenantDelete200Response } from '../models';
import type { PostApiV1SystemUserSelfTenantGetList200Response } from '../models';
import type { TenantUserJoinReq } from '../models';
import type { UserSelfTenantGetListReq } from '../models';
import type { UserSelfTenantGetOneReq } from '../models';
import type { UserTenant } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemUserSelfTenantApi - axios parameter creator
 */

/**
* 业务说明：当前用户退出当前所在的租户。退出后用户不再属于该租户，失去该租户的所有权限和数据访问资格。用于用户主动离开租户、清理租户归属等场景。退出后需切换到其他租户或重新加入。
* @summary 退出当前租户
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfTenantDelete (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/tenant/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfTenantDelete200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询当前登录用户所属的所有租户列表，返回租户编码、用户在各租户的状态、角色等信息。用于用户切换租户、查看可访问的租户范围等场景。可同时返回角色详情。
* @summary 获取用户所处的租户列表
* @param {UserSelfTenantGetListReq} userSelfTenantGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfTenantGetList (
userSelfTenantGetListReq: UserSelfTenantGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/tenant/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfTenantGetList200Response>>(localVarPath, userSelfTenantGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取当前登录用户在当前请求租户下的详细信息，包括用户状态、部门归属、角色列表、标签等。可指定是否同时返回角色详情和用户基本信息。用于用户个人中心展示、当前租户权限查看等场景。
* @summary 获取当前用户在当前租户的详情
* @param {UserSelfTenantGetOneReq} userSelfTenantGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfTenantGetOne (
userSelfTenantGetOneReq: UserSelfTenantGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/tenant/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantUserGetOne200Response>>(localVarPath, userSelfTenantGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：用户加入指定租户。支持多种加入方式：code（邀请码）、email（邮件邀请）、phone（手机邀请）、client（客户端应用直接加入）。client 方式无需邀请码，只需传入 tenantCode 和 method=client，角色自动使用租户配置的注册角色。加入成功后用户成为该租户成员，获得对应权限。
* @summary 用户加入租户（通过邀请码、邮件、手机或客户端应用）
* @param {TenantUserJoinReq} tenantUserJoinReq  用户加入租户请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfTenantJoin (
tenantUserJoinReq: TenantUserJoinReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/tenant/join`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfTenantDelete200Response>>(localVarPath, tenantUserJoinReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新当前用户在当前租户下的个人信息，如公共标签（pubTags）等用户可自行修改的字段。管理员设置的私有标签（tags）用户无权修改。用于用户设置个人偏好标签等场景。
* @summary 更新当前用户在当前租户的信息
* @param {UserTenant} userTenant
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfTenantUpdate (
userTenant: UserTenant,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/tenant/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfTenantDelete200Response>>(localVarPath, userTenant, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemUserSelfTenantGetList operation in SystemUserSelfTenantApi.
 */
export interface SystemUserSelfTenantApiPostApiV1SystemUserSelfTenantGetListRequest {
    readonly userSelfTenantGetListReq: UserSelfTenantGetListReq
}

/**
 * Request parameters for postApiV1SystemUserSelfTenantGetOne operation in SystemUserSelfTenantApi.
 */
export interface SystemUserSelfTenantApiPostApiV1SystemUserSelfTenantGetOneRequest {
    readonly userSelfTenantGetOneReq: UserSelfTenantGetOneReq
}

/**
 * Request parameters for postApiV1SystemUserSelfTenantJoin operation in SystemUserSelfTenantApi.
 */
export interface SystemUserSelfTenantApiPostApiV1SystemUserSelfTenantJoinRequest {
    /**
     *  用户加入租户请求
     */
    readonly tenantUserJoinReq: TenantUserJoinReq
}

/**
 * Request parameters for postApiV1SystemUserSelfTenantUpdate operation in SystemUserSelfTenantApi.
 */
export interface SystemUserSelfTenantApiPostApiV1SystemUserSelfTenantUpdateRequest {
    readonly userTenant: UserTenant
}
