import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProjectCrudCreate200Response } from '../models';
import type { PostApiV1ThingsProjectCrudGetList200Response } from '../models';
import type { PostApiV1ThingsProjectCrudGetOne200Response } from '../models';
import type { ProjectCrud } from '../models';
import type { ProjectCrudGetListReq } from '../models';
import type { WithIDStr } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProjectCustomDataApi - axios parameter creator
 */

/**
* 在项目下创建自定义数据记录，用于存储项目级别的业务扩展数据。purpose字段标识用途，params存储JSON格式参数，支持文件类型字段自动上传。
* @summary 新增项目crud
* @param {ProjectCrud} projectCrud
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectCrudCreate (
projectCrud: ProjectCrud,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/crud/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectCrudCreate200Response>>(localVarPath, projectCrud, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除项目自定义数据记录，删除后数据不可恢复。
* @summary 删除项目crud
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectCrudDelete (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/crud/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按用途查询项目自定义数据列表，支持params字段复杂查询（比较类型、类型转换）。用于获取特定用途的所有数据记录。
* @summary 获取项目crud列表
* @param {ProjectCrudGetListReq} projectCrudGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectCrudGetList (
projectCrudGetListReq: ProjectCrudGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/crud/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectCrudGetList200Response>>(localVarPath, projectCrudGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询单条项目自定义数据记录的完整信息，包括用途、参数内容、排序、创建时间等。
* @summary 获取项目crud详情
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectCrudGetOne (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/crud/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectCrudGetOne200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改项目自定义数据记录的内容，支持部分更新。params字段可存储复杂JSON数据，文件类型字段需特殊处理。
* @summary 更新项目crud
* @param {ProjectCrud} projectCrud
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectCrudUpdate (
projectCrud: ProjectCrud,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/crud/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, projectCrud, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProjectCrudCreate operation in ThingsProjectCustomDataApi.
 */
export interface ThingsProjectCustomDataApiPostApiV1ThingsProjectCrudCreateRequest {
    readonly projectCrud: ProjectCrud
}

/**
 * Request parameters for postApiV1ThingsProjectCrudDelete operation in ThingsProjectCustomDataApi.
 */
export interface ThingsProjectCustomDataApiPostApiV1ThingsProjectCrudDeleteRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1ThingsProjectCrudGetList operation in ThingsProjectCustomDataApi.
 */
export interface ThingsProjectCustomDataApiPostApiV1ThingsProjectCrudGetListRequest {
    readonly projectCrudGetListReq: ProjectCrudGetListReq
}

/**
 * Request parameters for postApiV1ThingsProjectCrudGetOne operation in ThingsProjectCustomDataApi.
 */
export interface ThingsProjectCustomDataApiPostApiV1ThingsProjectCrudGetOneRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1ThingsProjectCrudUpdate operation in ThingsProjectCustomDataApi.
 */
export interface ThingsProjectCustomDataApiPostApiV1ThingsProjectCrudUpdateRequest {
    readonly projectCrud: ProjectCrud
}
