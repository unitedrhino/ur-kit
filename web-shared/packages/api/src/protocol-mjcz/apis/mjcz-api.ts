import type { PostApiV1Cz200Response } from '../models';
import type { PushReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * MjczApi - axios parameter creator
 */

/**
* 业务说明：接收智能插座厂商推送的状态变更消息，并转交平台内部处理。
* @summary 接收插座状态推送
* @param {PushReq} pushReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1Cz (
pushReq: PushReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/cz`;
    return requestClient.post<ExtractDataType<PostApiV1Cz200Response>>(localVarPath, pushReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收门禁设备厂商推送的状态变更消息，并转交平台内部处理。
* @summary 接收门禁状态推送
* @param {PushReq} pushReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1Mj (
pushReq: PushReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/mj`;
    return requestClient.post<ExtractDataType<PostApiV1Cz200Response>>(localVarPath, pushReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1Cz operation in MjczApi.
 */
export interface MjczApiPostApiV1CzRequest {
    readonly pushReq: PushReq
}

/**
 * Request parameters for postApiV1Mj operation in MjczApi.
 */
export interface MjczApiPostApiV1MjRequest {
    readonly pushReq: PushReq
}
