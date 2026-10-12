import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { UserDeptMultiSaveReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemUserDeptApi - axios parameter creator
 */

/**
* 业务说明：为指定用户批量添加部门归属关系，支持一次性绑定多个部门。用于新用户入职分配部门、用户部门调整等场景。添加后用户将继承部门对应的权限和数据范围。
* @summary 新增用户的部门列表
* @param {UserDeptMultiSaveReq} userDeptMultiSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserDeptBatchCreate (
userDeptMultiSaveReq: UserDeptMultiSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/dept/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userDeptMultiSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量移除指定用户的部门归属关系，支持一次性解除多个部门。用于用户部门调动、离职清理等场景。移除后用户将失去该部门对应的权限和数据访问范围。
* @summary 删除用户的部门列表
* @param {UserDeptMultiSaveReq} userDeptMultiSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserDeptBatchDelete (
userDeptMultiSaveReq: UserDeptMultiSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/dept/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userDeptMultiSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemUserDeptBatchCreate operation in SystemUserDeptApi.
 */
export interface SystemUserDeptApiPostApiV1SystemUserDeptBatchCreateRequest {
    readonly userDeptMultiSaveReq: UserDeptMultiSaveReq
}

/**
 * Request parameters for postApiV1SystemUserDeptBatchDelete operation in SystemUserDeptApi.
 */
export interface SystemUserDeptApiPostApiV1SystemUserDeptBatchDeleteRequest {
    readonly userDeptMultiSaveReq: UserDeptMultiSaveReq
}
