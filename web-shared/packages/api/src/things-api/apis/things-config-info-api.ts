import type { ConfigInfo } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsConfigInfoGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsConfigInfoApi - axios parameter creator
 */

/**
* 获取物联网全局配置信息，目前包含设备MQTT访问地址。所有登录用户均可访问。
* @summary 获取全局配置
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsConfigInfoGetOne (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/config/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsConfigInfoGetOne200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新物联网全局配置信息，目前支持修改设备MQTT访问地址。仅平台管理员可访问。
* @summary 更新全局配置
* @param {ConfigInfo} configInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsConfigInfoUpdate (
configInfo: ConfigInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/config/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, configInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsConfigInfoUpdate operation in ThingsConfigInfoApi.
 */
export interface ThingsConfigInfoApiPostApiV1ThingsConfigInfoUpdateRequest {
    readonly configInfo: ConfigInfo
}
