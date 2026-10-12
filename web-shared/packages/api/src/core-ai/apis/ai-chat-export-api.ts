import type { ChatExportCreateReq } from '../models';
import type { ChatExportListReq } from '../models';
import type { ChatExportReq } from '../models';
import type { PostApiV1AiChatExportCreate200Response } from '../models';
import type { PostApiV1AiChatExportGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiChatExportApi - axios parameter creator
 */

/**
* 业务说明：鉴权不可变结果后排队，由独立 sandbox 生成 Excel 或 PDF 并上传私有 OSS。
* @summary 创建对话导出任务
* @param {ChatExportCreateReq} chatExportCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatExportCreate (
chatExportCreateReq: ChatExportCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/export/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatExportCreate200Response>>(localVarPath, chatExportCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：返回当前结果最近二十次导出，刷新页面后可恢复文件卡片与任务状态。
* @summary 恢复对话导出任务
* @param {ChatExportListReq} chatExportListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatExportGetList (
chatExportListReq: ChatExportListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/export/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatExportGetList200Response>>(localVarPath, chatExportListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按当前用户和应用范围读取导出状态，成功时返回长期附件标识。
* @summary 查询对话导出任务
* @param {ChatExportReq} chatExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatExportGetOne (
chatExportReq: ChatExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/export/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatExportCreate200Response>>(localVarPath, chatExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：重新核验原始快照权限，仅将失败任务重新排队。
* @summary 重试对话导出任务
* @param {ChatExportReq} chatExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatExportRetry (
chatExportReq: ChatExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/export/retry`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatExportCreate200Response>>(localVarPath, chatExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiChatExportCreate operation in AiChatExportApi.
 */
export interface AiChatExportApiPostApiV1AiChatExportCreateRequest {
    readonly chatExportCreateReq: ChatExportCreateReq
}

/**
 * Request parameters for postApiV1AiChatExportGetList operation in AiChatExportApi.
 */
export interface AiChatExportApiPostApiV1AiChatExportGetListRequest {
    readonly chatExportListReq: ChatExportListReq
}

/**
 * Request parameters for postApiV1AiChatExportGetOne operation in AiChatExportApi.
 */
export interface AiChatExportApiPostApiV1AiChatExportGetOneRequest {
    readonly chatExportReq: ChatExportReq
}

/**
 * Request parameters for postApiV1AiChatExportRetry operation in AiChatExportApi.
 */
export interface AiChatExportApiPostApiV1AiChatExportRetryRequest {
    readonly chatExportReq: ChatExportReq
}
