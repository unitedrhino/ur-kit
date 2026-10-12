import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemTenantUserGetList200Response } from '../models';
import type { PostApiV1SystemTenantUserGetOne200Response } from '../models';
import type { PostApiV1SystemTenantUserInviteCodeGen200Response } from '../models';
import type { PostApiV1SystemTenantUserInvitePendingGetList200Response } from '../models';
import type { TenantUserBatchCreateReq } from '../models';
import type { TenantUserGetListReq } from '../models';
import type { TenantUserInviteCodeGenReq } from '../models';
import type { TenantUserInvitePendingDeleteReq } from '../models';
import type { TenantUserInvitePendingGetListReq } from '../models';
import type { TenantUserInviteReq } from '../models';
import type { TenantUserInviteSendReq } from '../models';
import type { UserTenant } from '../models';
import type { WithTenantUserID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantUserApi - axios parameter creator
 */

/**
* 业务说明：批量将用户添加到租户，可设置状态、部门、角色、标签等。仅租户管理员可操作，用于批量导入用户或系统初始化场景。
* @summary 批量添加用户加入租户
* @param {TenantUserBatchCreateReq} tenantUserBatchCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserBatchCreate (
tenantUserBatchCreateReq: TenantUserBatchCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantUserBatchCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将用户从租户中移除，用户将无法访问该租户的资源。仅租户管理员可操作，用于用户管理中的移除功能。
* @summary 删除租户用户
* @param {WithTenantUserID} withTenantUserID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserDelete (
withTenantUserID: WithTenantUserID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withTenantUserID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询租户下的用户列表，支持按状态、用户名、手机号、邮箱、部门、角色过滤。用于用户管理列表页，租户管理员可管理本租户用户。
* @summary 获取租户用户列表
* @param {TenantUserGetListReq} tenantUserGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserGetList (
tenantUserGetListReq: TenantUserGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantUserGetList200Response>>(localVarPath, tenantUserGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个租户用户的完整信息，包括用户基本信息、角色分配、部门归属等。用于用户详情页或编辑表单初始化。
* @summary 获取租户用户详情,会同时返回所拥有的角色列表
* @param {WithTenantUserID} withTenantUserID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserGetOne (
withTenantUserID: WithTenantUserID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantUserGetOne200Response>>(localVarPath, withTenantUserID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：邀请已注册用户加入当前租户，可指定分配的角色。被邀请用户将收到通知，确认后成为租户成员。用于用户邀请功能。
* @summary 邀请用户加入租户
* @param {TenantUserInviteReq} tenantUserInviteReq  租户用户邀请相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserInvite (
tenantUserInviteReq: TenantUserInviteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/invite`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantUserInviteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：生成租户邀请码，可设置有效期和默认角色。邀请码可用于邀请新用户加入租户，用户注册时填写邀请码自动分配角色。
* @summary 生成租户用户邀请码
* @param {TenantUserInviteCodeGenReq} tenantUserInviteCodeGenReq  租户用户邀请码相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserInviteCodeGen (
tenantUserInviteCodeGenReq: TenantUserInviteCodeGenReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/invite-code/gen`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantUserInviteCodeGen200Response>>(localVarPath, tenantUserInviteCodeGenReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询租户当前有效的邀请码信息，包括邀请码、有效期、关联角色。用于邀请码管理页面展示。
* @summary 获取当前有效的租户用户邀请码
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserInviteCodeGetOne (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/invite-code/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantUserInviteCodeGen200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：撤销已发送的邀请，被邀请用户将无法通过该邀请加入租户。用于邀请管理中的撤销功能。
* @summary 删除待处理邀请
* @param {TenantUserInvitePendingDeleteReq} tenantUserInvitePendingDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserInvitePendingDelete (
tenantUserInvitePendingDeleteReq: TenantUserInvitePendingDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/invite-pending/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantUserInvitePendingDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询租户已发送但尚未被接受的邀请列表，支持按邀请类型（邮件/手机号）过滤。用于邀请状态管理和撤销功能。
* @summary 获取待处理邀请列表
* @param {TenantUserInvitePendingGetListReq} tenantUserInvitePendingGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserInvitePendingGetList (
tenantUserInvitePendingGetListReq: TenantUserInvitePendingGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/invite-pending/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantUserInvitePendingGetList200Response>>(localVarPath, tenantUserInvitePendingGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：通过邮件或手机号向未注册用户发送租户邀请，系统自动识别地址类型。被邀请用户收到邀请链接/短信，注册后自动加入租户。
* @summary 发送邀请（支持邮件和手机号）
* @param {TenantUserInviteSendReq} tenantUserInviteSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserInviteSend (
tenantUserInviteSendReq: TenantUserInviteSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/invite-send`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantUserInviteSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改租户用户的信息，如状态、部门、角色、标签等。仅租户管理员可操作，用于用户编辑功能。
* @summary 更新租户用户
* @param {UserTenant} userTenant
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantUserUpdate (
userTenant: UserTenant,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/user/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userTenant, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantUserBatchCreate operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserBatchCreateRequest {
    readonly tenantUserBatchCreateReq: TenantUserBatchCreateReq
}

/**
 * Request parameters for postApiV1SystemTenantUserDelete operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserDeleteRequest {
    readonly withTenantUserID: WithTenantUserID
}

/**
 * Request parameters for postApiV1SystemTenantUserGetList operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserGetListRequest {
    readonly tenantUserGetListReq: TenantUserGetListReq
}

/**
 * Request parameters for postApiV1SystemTenantUserGetOne operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserGetOneRequest {
    readonly withTenantUserID: WithTenantUserID
}

/**
 * Request parameters for postApiV1SystemTenantUserInvite operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserInviteRequest {
    /**
     *  租户用户邀请相关
     */
    readonly tenantUserInviteReq: TenantUserInviteReq
}

/**
 * Request parameters for postApiV1SystemTenantUserInviteCodeGen operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserInviteCodeGenRequest {
    /**
     *  租户用户邀请码相关
     */
    readonly tenantUserInviteCodeGenReq: TenantUserInviteCodeGenReq
}

/**
 * Request parameters for postApiV1SystemTenantUserInvitePendingDelete operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserInvitePendingDeleteRequest {
    readonly tenantUserInvitePendingDeleteReq: TenantUserInvitePendingDeleteReq
}

/**
 * Request parameters for postApiV1SystemTenantUserInvitePendingGetList operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserInvitePendingGetListRequest {
    readonly tenantUserInvitePendingGetListReq: TenantUserInvitePendingGetListReq
}

/**
 * Request parameters for postApiV1SystemTenantUserInviteSend operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserInviteSendRequest {
    readonly tenantUserInviteSendReq: TenantUserInviteSendReq
}

/**
 * Request parameters for postApiV1SystemTenantUserUpdate operation in SystemTenantUserApi.
 */
export interface SystemTenantUserApiPostApiV1SystemTenantUserUpdateRequest {
    readonly userTenant: UserTenant
}
