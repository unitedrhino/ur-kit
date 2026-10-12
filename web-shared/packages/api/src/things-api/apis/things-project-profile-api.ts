import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProjectProfileGetList200Response } from '../models';
import type { PostApiV1ThingsProjectProfileGetOne200Response } from '../models';
import type { ProjectProfile } from '../models';
import type { ProjectProfileGetListReq } from '../models';
import type { WithCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProjectProfileApi - axios parameter creator
 */

/**
* 批量查询多个code对应的项目配置，用于一次性获取项目的所有相关配置参数。
* @summary 获取项目配置列表
* @param {ProjectProfileGetListReq} projectProfileGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectProfileGetList (
projectProfileGetListReq: ProjectProfileGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/profile/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectProfileGetList200Response>>(localVarPath, projectProfileGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询项目的扩展配置信息，通过code标识配置类型。配置以params字段存储JSON格式数据，用于存储项目级别的自定义参数。
* @summary 获取项目配置详情
* @param {WithCode} withCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectProfileGetOne (
withCode: WithCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/profile/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectProfileGetOne200Response>>(localVarPath, withCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改项目指定code的配置内容，params字段支持JSON格式存储复杂配置。不同code对应不同配置模块，可独立更新。
* @summary 更新项目配置
* @param {ProjectProfile} projectProfile
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectProfileUpdate (
projectProfile: ProjectProfile,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/profile/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, projectProfile, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProjectProfileGetList operation in ThingsProjectProfileApi.
 */
export interface ThingsProjectProfileApiPostApiV1ThingsProjectProfileGetListRequest {
    readonly projectProfileGetListReq: ProjectProfileGetListReq
}

/**
 * Request parameters for postApiV1ThingsProjectProfileGetOne operation in ThingsProjectProfileApi.
 */
export interface ThingsProjectProfileApiPostApiV1ThingsProjectProfileGetOneRequest {
    readonly withCode: WithCode
}

/**
 * Request parameters for postApiV1ThingsProjectProfileUpdate operation in ThingsProjectProfileApi.
 */
export interface ThingsProjectProfileApiPostApiV1ThingsProjectProfileUpdateRequest {
    readonly projectProfile: ProjectProfile
}
