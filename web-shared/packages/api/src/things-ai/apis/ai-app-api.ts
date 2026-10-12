import type { AiAppChatSendReq } from '../models';
import type { AiAppWorkflowRunReq } from '../models';
import type { PostApiV1AiAppChatSend200Response } from '../models';
import type { PostApiV1AiAppSseWorkflowRun200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiAppApi - axios parameter creator
 */

/**
*
* @summary 发送对话消息
* @param {AiAppChatSendReq} aiAppChatSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAppChatSend (
aiAppChatSendReq: AiAppChatSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/app/chat-send`;
    return requestClient.post<ExtractDataType<PostApiV1AiAppChatSend200Response>>(localVarPath, aiAppChatSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
*
* @summary sse模式ai聊天运行
* @param {AiAppChatSendReq} aiAppChatSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAppSseChatRun (
aiAppChatSendReq: AiAppChatSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/app/sse/chat-run`;
    return requestClient.post<ExtractDataType<PostApiV1AiAppChatSend200Response>>(localVarPath, aiAppChatSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
*
* @summary sse模式执行 workflow
* @param {AiAppWorkflowRunReq} aiAppWorkflowRunReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAppSseWorkflowRun (
aiAppWorkflowRunReq: AiAppWorkflowRunReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/app/sse/workflow-run`;
    return requestClient.post<ExtractDataType<PostApiV1AiAppSseWorkflowRun200Response>>(localVarPath, aiAppWorkflowRunReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
*
* @summary 执行 workflow
* @param {AiAppWorkflowRunReq} aiAppWorkflowRunReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAppWorkflowRun (
aiAppWorkflowRunReq: AiAppWorkflowRunReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/app/workflow-run`;
    return requestClient.post<ExtractDataType<PostApiV1AiAppSseWorkflowRun200Response>>(localVarPath, aiAppWorkflowRunReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiAppChatSend operation in AiAppApi.
 */
export interface AiAppApiPostApiV1AiAppChatSendRequest {
    readonly aiAppChatSendReq: AiAppChatSendReq
}

/**
 * Request parameters for postApiV1AiAppSseChatRun operation in AiAppApi.
 */
export interface AiAppApiPostApiV1AiAppSseChatRunRequest {
    readonly aiAppChatSendReq: AiAppChatSendReq
}

/**
 * Request parameters for postApiV1AiAppSseWorkflowRun operation in AiAppApi.
 */
export interface AiAppApiPostApiV1AiAppSseWorkflowRunRequest {
    readonly aiAppWorkflowRunReq: AiAppWorkflowRunReq
}

/**
 * Request parameters for postApiV1AiAppWorkflowRun operation in AiAppApi.
 */
export interface AiAppApiPostApiV1AiAppWorkflowRunRequest {
    readonly aiAppWorkflowRunReq: AiAppWorkflowRunReq
}
