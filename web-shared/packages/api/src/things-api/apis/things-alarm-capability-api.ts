import type { PostApiV1ThingsAlarmCapabilityGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAlarmCapabilityApi - axios parameter creator
 */

/**
* 返回告警数据源、判据、目标和通知的统一可配置能力
* @summary 获取告警能力矩阵
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmCapabilityGetOne (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/capability/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmCapabilityGetOne200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAlarmCapabilityGetOne operation in ThingsAlarmCapabilityApi.
 */
export interface ThingsAlarmCapabilityApiPostApiV1ThingsAlarmCapabilityGetOneRequest {
    readonly body: object
}
