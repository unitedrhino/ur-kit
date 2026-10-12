import type { DeptUserBatchCreateReq } from '../models';
import type { DeptUserBatchDeleteReq } from '../models';
import type { DeptUserGetListReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemDeptUserGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemDeptUserApi - axios parameter creator
 */

/**
* 业务说明：批量将用户添加到指定部门。支持设置授权类型（管理权限/普通权限）和是否同时授权子部门。用于人员入职分配、部门调整、批量组织归属等场景。
* @summary 批量授权部门用户
* @param {DeptUserBatchCreateReq} deptUserBatchCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptUserBatchCreate (
deptUserBatchCreateReq: DeptUserBatchCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/user/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, deptUserBatchCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量将用户从部门移除。用于人员离职、部门调整、权限回收等场景。移除后用户失去该部门相关的权限和归属。
* @summary 批量取消授权部门用户
* @param {DeptUserBatchDeleteReq} deptUserBatchDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptUserBatchDelete (
deptUserBatchDeleteReq: DeptUserBatchDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/user/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, deptUserBatchDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询部门下的用户授权列表。用于查看部门人员构成、权限分配、管理人员选择等场景。返回用户信息和授权类型。
* @summary 获取部门授权列表
* @param {DeptUserGetListReq} deptUserGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptUserGetList (
deptUserGetListReq: DeptUserGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/user/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDeptUserGetList200Response>>(localVarPath, deptUserGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemDeptUserBatchCreate operation in SystemDeptUserApi.
 */
export interface SystemDeptUserApiPostApiV1SystemDeptUserBatchCreateRequest {
    readonly deptUserBatchCreateReq: DeptUserBatchCreateReq
}

/**
 * Request parameters for postApiV1SystemDeptUserBatchDelete operation in SystemDeptUserApi.
 */
export interface SystemDeptUserApiPostApiV1SystemDeptUserBatchDeleteRequest {
    readonly deptUserBatchDeleteReq: DeptUserBatchDeleteReq
}

/**
 * Request parameters for postApiV1SystemDeptUserGetList operation in SystemDeptUserApi.
 */
export interface SystemDeptUserApiPostApiV1SystemDeptUserGetListRequest {
    readonly deptUserGetListReq: DeptUserGetListReq
}
