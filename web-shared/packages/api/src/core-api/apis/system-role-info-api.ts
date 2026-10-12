import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemRoleInfoGetList200Response } from '../models';
import type { RoleInfo } from '../models';
import type { RoleInfoGetListReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemRoleInfoApi - axios parameter creator
 */

/**
* 业务说明：创建新的角色定义。角色是权限管理的核心单元，用于批量授权用户访问特定功能和数据。创建时可设置角色名称、编码、状态和描述等信息。
* @summary 添加角色
* @param {RoleInfo} roleInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleInfoCreate (
roleInfo: RoleInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, roleInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除角色定义。删除前需确保无用户绑定该角色，否则删除失败。用于清理废弃角色、权限体系重构等场景。删除后相关权限配置需重新分配。
* @summary 删除角色
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询角色列表，支持按名称、状态、编码筛选。用于角色选择器、权限配置页面、用户授权等场景。返回分页结果包含角色基本信息。
* @summary 获取角色列表
* @param {RoleInfoGetListReq} roleInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleInfoGetList (
roleInfoGetListReq: RoleInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemRoleInfoGetList200Response>>(localVarPath, roleInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改角色定义。可调整角色名称、状态、描述等属性。角色编码通常不可修改以保持权限引用稳定性。更新后立即生效，已授权用户权限自动同步。
* @summary 更新角色
* @param {RoleInfo} roleInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRoleInfoUpdate (
roleInfo: RoleInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/role/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, roleInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemRoleInfoCreate operation in SystemRoleInfoApi.
 */
export interface SystemRoleInfoApiPostApiV1SystemRoleInfoCreateRequest {
    readonly roleInfo: RoleInfo
}

/**
 * Request parameters for postApiV1SystemRoleInfoDelete operation in SystemRoleInfoApi.
 */
export interface SystemRoleInfoApiPostApiV1SystemRoleInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemRoleInfoGetList operation in SystemRoleInfoApi.
 */
export interface SystemRoleInfoApiPostApiV1SystemRoleInfoGetListRequest {
    readonly roleInfoGetListReq: RoleInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemRoleInfoUpdate operation in SystemRoleInfoApi.
 */
export interface SystemRoleInfoApiPostApiV1SystemRoleInfoUpdateRequest {
    readonly roleInfo: RoleInfo
}
