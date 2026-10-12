import type { DataProjectBatchDeleteReq } from '../models';
import type { DataProjectDeleteReq } from '../models';
import type { DataProjectGetListReq } from '../models';
import type { DataProjectMultiSaveReq } from '../models';
import type { DataProjectSaveReq } from '../models';
import type { DataProjectUpdateReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsDataProjectCreate200Response } from '../models';
import type { PostApiV1ThingsDataProjectGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDataProjectApi - axios parameter creator
 */

/**
* 批量给多个用户或角色授予项目访问权限，设置权限类型（管理权限/读写权限/读权限）。用于批量权限分配，如项目初始化时分配团队成员权限。
* @summary 批量创建授权项目权限
* @param {DataProjectMultiSaveReq} dataProjectMultiSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataProjectBatchCreate (
dataProjectMultiSaveReq: DataProjectMultiSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/project/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, dataProjectMultiSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量删除多个用户或角色对指定项目的访问权限。一次操作可删除多个目标（用户/角色）的项目权限，用于批量权限清理。
* @summary 批量删除授权项目权限
* @param {DataProjectBatchDeleteReq} dataProjectBatchDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataProjectBatchDelete (
dataProjectBatchDeleteReq: DataProjectBatchDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/project/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, dataProjectBatchDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 给单个用户或角色授予项目访问权限。权限类型：1=管理权限（可修改他人权限）、2=读写权限、3=读权限。授权后用户可按权限级别访问项目资源。
* @summary 创建授权项目权限
* @param {DataProjectSaveReq} dataProjectSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataProjectCreate (
dataProjectSaveReq: DataProjectSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/project/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDataProjectCreate200Response>>(localVarPath, dataProjectSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除用户或角色对指定项目的访问权限。权限删除后用户将无法访问该项目及其下的区域、设备等资源。支持按用户ID或角色批量删除。
* @summary 删除授权项目权限
* @param {DataProjectDeleteReq} dataProjectDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataProjectDelete (
dataProjectDeleteReq: DataProjectDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/project/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, dataProjectDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询项目的权限分配列表，返回已授权的用户/角色及其权限类型。支持按项目ID、用户ID、角色类型过滤。用于权限审计和查看项目成员。
* @summary 获取项目权限列表
* @param {DataProjectGetListReq} dataProjectGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataProjectGetList (
dataProjectGetListReq: DataProjectGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/project/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDataProjectGetList200Response>>(localVarPath, dataProjectGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 由家庭创建者或管理员修改用户成员在当前家庭中的称呼；传空字符串可清空称呼。
* @summary 更新家庭成员称呼
* @param {DataProjectUpdateReq} dataProjectUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataProjectUpdate (
dataProjectUpdateReq: DataProjectUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/project/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, dataProjectUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDataProjectBatchCreate operation in ThingsDataProjectApi.
 */
export interface ThingsDataProjectApiPostApiV1ThingsDataProjectBatchCreateRequest {
    readonly dataProjectMultiSaveReq: DataProjectMultiSaveReq
}

/**
 * Request parameters for postApiV1ThingsDataProjectBatchDelete operation in ThingsDataProjectApi.
 */
export interface ThingsDataProjectApiPostApiV1ThingsDataProjectBatchDeleteRequest {
    readonly dataProjectBatchDeleteReq: DataProjectBatchDeleteReq
}

/**
 * Request parameters for postApiV1ThingsDataProjectCreate operation in ThingsDataProjectApi.
 */
export interface ThingsDataProjectApiPostApiV1ThingsDataProjectCreateRequest {
    readonly dataProjectSaveReq: DataProjectSaveReq
}

/**
 * Request parameters for postApiV1ThingsDataProjectDelete operation in ThingsDataProjectApi.
 */
export interface ThingsDataProjectApiPostApiV1ThingsDataProjectDeleteRequest {
    readonly dataProjectDeleteReq: DataProjectDeleteReq
}

/**
 * Request parameters for postApiV1ThingsDataProjectGetList operation in ThingsDataProjectApi.
 */
export interface ThingsDataProjectApiPostApiV1ThingsDataProjectGetListRequest {
    readonly dataProjectGetListReq: DataProjectGetListReq
}

/**
 * Request parameters for postApiV1ThingsDataProjectUpdate operation in ThingsDataProjectApi.
 */
export interface ThingsDataProjectApiPostApiV1ThingsDataProjectUpdateRequest {
    readonly dataProjectUpdateReq: DataProjectUpdateReq
}
