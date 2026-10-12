import type { DeptRoleBatchSaveReq } from '../models';
import type { DeptRoleGetListReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemDeptRoleGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemDeptRoleApi - axios parameter creator
 */

/**
* 业务说明：批量将角色绑定到指定部门。用于部门管理页面按部门批量分配角色，重复绑定自动忽略。
* @summary 批量添加部门角色
* @param {DeptRoleBatchSaveReq} deptRoleBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptRoleBatchCreate (
deptRoleBatchSaveReq: DeptRoleBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/role/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, deptRoleBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量将角色从指定部门解绑。用于部门管理页面回收部门角色授权，按部门ID与角色ID列表匹配删除。
* @summary 批量移除部门角色
* @param {DeptRoleBatchSaveReq} deptRoleBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptRoleBatchDelete (
deptRoleBatchSaveReq: DeptRoleBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/role/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, deptRoleBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定部门关联的角色列表。用于部门管理页面的部门角色标签页，展示已绑定到该部门的角色信息。
* @summary 获取部门角色列表
* @param {DeptRoleGetListReq} deptRoleGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptRoleGetList (
deptRoleGetListReq: DeptRoleGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/role/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDeptRoleGetList200Response>>(localVarPath, deptRoleGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemDeptRoleBatchCreate operation in SystemDeptRoleApi.
 */
export interface SystemDeptRoleApiPostApiV1SystemDeptRoleBatchCreateRequest {
    readonly deptRoleBatchSaveReq: DeptRoleBatchSaveReq
}

/**
 * Request parameters for postApiV1SystemDeptRoleBatchDelete operation in SystemDeptRoleApi.
 */
export interface SystemDeptRoleApiPostApiV1SystemDeptRoleBatchDeleteRequest {
    readonly deptRoleBatchSaveReq: DeptRoleBatchSaveReq
}

/**
 * Request parameters for postApiV1SystemDeptRoleGetList operation in SystemDeptRoleApi.
 */
export interface SystemDeptRoleApiPostApiV1SystemDeptRoleGetListRequest {
    readonly deptRoleGetListReq: DeptRoleGetListReq
}
