import type { ClientDebugMessageReq } from '../models';
import type { ClientDebugStreamReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemClientDebugMessage200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemClientdebugApi - axios parameter creator
 */

/**
* 业务说明：Agent提交操控请求和诊断命令；目标客户端提交确认、日志、诊断结果和停止通知。会话有效期内按身份和实例校验。
* @summary 交换客户端调试消息
* @param {ClientDebugMessageReq} clientDebugMessageReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemClientDebugMessage (
clientDebugMessageReq: ClientDebugMessageReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/client-debug/message`;
    return requestClient.post<ExtractDataType<PostApiV1SystemClientDebugMessage200Response>>(localVarPath, clientDebugMessageReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：Agent 为指定客户端实例建立短期调试会话并接收SSE日志和诊断结果。调用者仅可调试本人或以平台管理员身份调试其他用户。
* @summary 订阅客户端调试流
* @param {ClientDebugStreamReq} clientDebugStreamReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemClientDebugStream (
clientDebugStreamReq: ClientDebugStreamReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/client-debug/stream`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, clientDebugStreamReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemClientDebugMessage operation in SystemClientdebugApi.
 */
export interface SystemClientdebugApiPostApiV1SystemClientDebugMessageRequest {
    readonly clientDebugMessageReq: ClientDebugMessageReq
}

/**
 * Request parameters for postApiV1SystemClientDebugStream operation in SystemClientdebugApi.
 */
export interface SystemClientdebugApiPostApiV1SystemClientDebugStreamRequest {
    readonly clientDebugStreamReq: ClientDebugStreamReq
}
