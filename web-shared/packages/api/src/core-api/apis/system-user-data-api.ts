import type { PostApiV1SystemUserDataAreaGetList200Response } from '../models';
import type { PostApiV1SystemUserDataProjectGetList200Response } from '../models';
import type { UserDataAreaGetListReq } from '../models';
import type { UserDataProjectGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemUserDataApi - axios parameter creator
 */

/**
* 业务说明：查询指定用户在各区域中的权限分配情况，返回用户拥有的区域列表及每个区域的权限类型。可按项目ID过滤，用于数据权限配置、用户可访问区域范围查询等场景。
* @summary 获取区域权限列表
* @param {UserDataAreaGetListReq} userDataAreaGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserDataAreaGetList (
userDataAreaGetListReq: UserDataAreaGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/data/area/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserDataAreaGetList200Response>>(localVarPath, userDataAreaGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定用户在各项目中的权限分配情况，返回用户拥有的项目列表及每个项目的权限类型（管理/读写/只读）。用于用户权限审计、权限配置界面展示等场景。
* @summary 获取项目权限列表
* @param {UserDataProjectGetListReq} userDataProjectGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserDataProjectGetList (
userDataProjectGetListReq: UserDataProjectGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/data/project/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserDataProjectGetList200Response>>(localVarPath, userDataProjectGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemUserDataAreaGetList operation in SystemUserDataApi.
 */
export interface SystemUserDataApiPostApiV1SystemUserDataAreaGetListRequest {
    readonly userDataAreaGetListReq: UserDataAreaGetListReq
}

/**
 * Request parameters for postApiV1SystemUserDataProjectGetList operation in SystemUserDataApi.
 */
export interface SystemUserDataApiPostApiV1SystemUserDataProjectGetListRequest {
    readonly userDataProjectGetListReq: UserDataProjectGetListReq
}
