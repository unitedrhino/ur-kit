import type { KnowledgeCompileRetryReq } from '../models';
import type { KnowledgeCompileStatusReq } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiKnowledgeCompileGetStatus200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiKnowledgeCompileApi - axios parameter creator
 */

/**
* 业务说明：获取知识库当前或最近一次编译任务状态，以及实时文档统计。
* @summary 获取编译状态
* @param {KnowledgeCompileStatusReq} knowledgeCompileStatusReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeCompileGetStatus (
knowledgeCompileStatusReq: KnowledgeCompileStatusReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/compile/get-status`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeCompileGetStatus200Response>>(localVarPath, knowledgeCompileStatusReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：触发知识库失败重试或全量重编译，异步创建编译任务。
* @summary 触发知识库重编译
* @param {KnowledgeCompileRetryReq} knowledgeCompileRetryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeCompileRetry (
knowledgeCompileRetryReq: KnowledgeCompileRetryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/compile/retry`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, knowledgeCompileRetryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiKnowledgeCompileGetStatus operation in AiKnowledgeCompileApi.
 */
export interface AiKnowledgeCompileApiPostApiV1AiKnowledgeCompileGetStatusRequest {
    readonly knowledgeCompileStatusReq: KnowledgeCompileStatusReq
}

/**
 * Request parameters for postApiV1AiKnowledgeCompileRetry operation in AiKnowledgeCompileApi.
 */
export interface AiKnowledgeCompileApiPostApiV1AiKnowledgeCompileRetryRequest {
    readonly knowledgeCompileRetryReq: KnowledgeCompileRetryReq
}
