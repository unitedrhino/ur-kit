import type { GetIotToolNtp200Response } from '../models';
import type { GetWumeiDatabaseInit200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * YkwlApi - axios parameter creator
 */

/**
*
* @param {number} [bodyParam.deviceSendTime]
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getIotToolNtp (bodyParam: { deviceSendTime: number; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/iot/tool/ntp`;
        if ((bodyParam as Record<string, unknown>)['deviceSendTime'] !== undefined) {
            localVarQueryParameter['deviceSendTime'] = (bodyParam as Record<string, unknown>)['deviceSendTime'];
        }
    return requestClient.get<ExtractDataType<GetIotToolNtp200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
*
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getWumeiDatabaseInit (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/wumei/database/init`;
    return requestClient.get<ExtractDataType<GetWumeiDatabaseInit200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
*
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getWumeiDatabaseInit2 (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/wumei/database/init2`;
    return requestClient.get<ExtractDataType<GetWumeiDatabaseInit200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for getIotToolNtp operation in YkwlApi.
 */
export interface YkwlApiGetIotToolNtpRequest {
    readonly deviceSendTime: number
}
