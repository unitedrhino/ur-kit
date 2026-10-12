import type { DataAreaBatchDeleteReq } from '../models';
import type { DataAreaBatchUpdateReq } from '../models';
import type { DataAreaGetListReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsDataAreaGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDataAreaApi - axios parameter creator
 */

/**
* 批量删除用户或角色对多个区域的访问权限。删除后用户将无法访问这些区域的设备数据，但项目级权限不受影响。
* @summary 删除授权区域权限
* @param {DataAreaBatchDeleteReq} dataAreaBatchDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataAreaBatchDelete (
dataAreaBatchDeleteReq: DataAreaBatchDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/area/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, dataAreaBatchDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量更新用户或角色的区域访问权限，设置各区域的权限类型（读权限/管理权限）。支持同时授权子区域（isAuthChildren）。用于精细化的区域权限配置。
* @summary 更新授权区域权限
* @param {DataAreaBatchUpdateReq} dataAreaBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataAreaBatchUpdate (
dataAreaBatchUpdateReq: DataAreaBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/area/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, dataAreaBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询项目的区域权限分配列表，返回各区域的授权用户/角色及其权限类型。结合区域树形结构可用于可视化展示权限分布。
* @summary 获取区域权限列表
* @param {DataAreaGetListReq} dataAreaGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataAreaGetList (
dataAreaGetListReq: DataAreaGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/area/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDataAreaGetList200Response>>(localVarPath, dataAreaGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDataAreaBatchDelete operation in ThingsDataAreaApi.
 */
export interface ThingsDataAreaApiPostApiV1ThingsDataAreaBatchDeleteRequest {
    readonly dataAreaBatchDeleteReq: DataAreaBatchDeleteReq
}

/**
 * Request parameters for postApiV1ThingsDataAreaBatchUpdate operation in ThingsDataAreaApi.
 */
export interface ThingsDataAreaApiPostApiV1ThingsDataAreaBatchUpdateRequest {
    readonly dataAreaBatchUpdateReq: DataAreaBatchUpdateReq
}

/**
 * Request parameters for postApiV1ThingsDataAreaGetList operation in ThingsDataAreaApi.
 */
export interface ThingsDataAreaApiPostApiV1ThingsDataAreaGetListRequest {
    readonly dataAreaGetListReq: DataAreaGetListReq
}
