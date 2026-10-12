import type { KnowledgeExportReq } from '../models';
import type { KnowledgeExportStatusReq } from '../models';
import type { KnowledgeZipExportReq } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiKnowledgeExportExportZip200Response } from '../models';
import type { PostApiV1AiKnowledgeExportGetStatus200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiKnowledgeExportApi - axios parameter creator
 */

/**
* 业务说明：为知识库生成导出任务，导出文档树和编译产物。
* @summary 创建导出任务
* @param {KnowledgeExportReq} knowledgeExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeExportCreate (
knowledgeExportReq: KnowledgeExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/export/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, knowledgeExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将知识库完整导出为ZIP压缩包（含原文、编译产物、向量数据），返回下载地址。
* @summary ZIP导出知识库
* @param {KnowledgeZipExportReq} knowledgeZipExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeExportExportZip (
knowledgeZipExportReq: KnowledgeZipExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/export/export-zip`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeExportExportZip200Response>>(localVarPath, knowledgeZipExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询知识库导出任务状态和下载地址。
* @summary 获取导出状态
* @param {KnowledgeExportStatusReq} knowledgeExportStatusReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeExportGetStatus (
knowledgeExportStatusReq: KnowledgeExportStatusReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/export/get-status`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeExportGetStatus200Response>>(localVarPath, knowledgeExportStatusReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiKnowledgeExportCreate operation in AiKnowledgeExportApi.
 */
export interface AiKnowledgeExportApiPostApiV1AiKnowledgeExportCreateRequest {
    readonly knowledgeExportReq: KnowledgeExportReq
}

/**
 * Request parameters for postApiV1AiKnowledgeExportExportZip operation in AiKnowledgeExportApi.
 */
export interface AiKnowledgeExportApiPostApiV1AiKnowledgeExportExportZipRequest {
    readonly knowledgeZipExportReq: KnowledgeZipExportReq
}

/**
 * Request parameters for postApiV1AiKnowledgeExportGetStatus operation in AiKnowledgeExportApi.
 */
export interface AiKnowledgeExportApiPostApiV1AiKnowledgeExportGetStatusRequest {
    readonly knowledgeExportStatusReq: KnowledgeExportStatusReq
}
