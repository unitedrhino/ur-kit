import type { AreaProfile } from '../models';
import type { AreaProfileGetListReq } from '../models';
import type { AreaProfileGetOneReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsAreaProfileGetList200Response } from '../models';
import type { PostApiV1ThingsAreaProfileGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAreaProfileApi - axios parameter creator
 */

/**
* 批量查询多个code对应的区域配置，支持按区域ID和code列表过滤。用于一次性获取区域的所有相关配置。
* @summary 获取区域配置列表
* @param {AreaProfileGetListReq} areaProfileGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAreaProfileGetList (
areaProfileGetListReq: AreaProfileGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/area/profile/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAreaProfileGetList200Response>>(localVarPath, areaProfileGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询区域的扩展配置信息，通过code标识配置类型（如区域参数、自定义属性）。配置以params字段存储JSON格式数据。
* @summary 获取区域配置详情
* @param {AreaProfileGetOneReq} areaProfileGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAreaProfileGetOne (
areaProfileGetOneReq: AreaProfileGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/area/profile/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAreaProfileGetOne200Response>>(localVarPath, areaProfileGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改区域指定code的配置内容，params字段支持JSON格式存储复杂配置。不同code对应不同配置模块，可独立更新。
* @summary 更新区域配置
* @param {AreaProfile} areaProfile
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAreaProfileUpdate (
areaProfile: AreaProfile,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/area/profile/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, areaProfile, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAreaProfileGetList operation in ThingsAreaProfileApi.
 */
export interface ThingsAreaProfileApiPostApiV1ThingsAreaProfileGetListRequest {
    readonly areaProfileGetListReq: AreaProfileGetListReq
}

/**
 * Request parameters for postApiV1ThingsAreaProfileGetOne operation in ThingsAreaProfileApi.
 */
export interface ThingsAreaProfileApiPostApiV1ThingsAreaProfileGetOneRequest {
    readonly areaProfileGetOneReq: AreaProfileGetOneReq
}

/**
 * Request parameters for postApiV1ThingsAreaProfileUpdate operation in ThingsAreaProfileApi.
 */
export interface ThingsAreaProfileApiPostApiV1ThingsAreaProfileUpdateRequest {
    readonly areaProfile: AreaProfile
}
