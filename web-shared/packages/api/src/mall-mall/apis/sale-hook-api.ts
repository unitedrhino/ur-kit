import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleHookApi - axios parameter creator
 */

/**
* Hook扩展统一入口，通过method字段路由到具体处理函数，用于接收外部系统回调
* @summary Hook扩展统一入口
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleHook (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/hook/`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
