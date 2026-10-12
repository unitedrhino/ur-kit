import type { MemoryDebugArchiveGetListReq } from '../models';
import type { MemoryDebugDreamRunGetListReq } from '../models';
import type { MemoryDebugPipelineStateGetListReq } from '../models';
import type { MemoryDebugTraceGetListReq } from '../models';
import type { PostApiV1AiMemoryDebugArchivesGetList200Response } from '../models';
import type { PostApiV1AiMemoryDebugDreamRunsGetList200Response } from '../models';
import type { PostApiV1AiMemoryDebugOverview200Response } from '../models';
import type { PostApiV1AiMemoryDebugPipelineStateGetList200Response } from '../models';
import type { PostApiV1AiMemoryDebugTracesGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiMemoryDebugApi - axios parameter creator
 */

/**
* 业务说明：平台管理员查看全局记忆归档记录，支持按分身、归档原因过滤。用于查看已归档的记忆数据。
* @summary 调试-归档记录列表
* @param {MemoryDebugArchiveGetListReq} memoryDebugArchiveGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMemoryDebugArchivesGetList (
memoryDebugArchiveGetListReq: MemoryDebugArchiveGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/memory/debug/archives/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiMemoryDebugArchivesGetList200Response>>(localVarPath, memoryDebugArchiveGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：平台管理员查看全局 Dream 运行记录，支持按分身、状态过滤。用于监控记忆整理任务的执行情况。
* @summary 调试-Dream运行记录列表
* @param {MemoryDebugDreamRunGetListReq} memoryDebugDreamRunGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMemoryDebugDreamRunsGetList (
memoryDebugDreamRunGetListReq: MemoryDebugDreamRunGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/memory/debug/dream-runs/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiMemoryDebugDreamRunsGetList200Response>>(localVarPath, memoryDebugDreamRunGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：平台管理员查看全局记忆统计数据，包括各层级记录数、Dream运行数、归档数、流水线状态等。用于记忆系统健康监控和调试。
* @summary 记忆调试总览
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMemoryDebugOverview (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/memory/debug/overview`;
    return requestClient.post<ExtractDataType<PostApiV1AiMemoryDebugOverview200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：平台管理员查看记忆流水线状态，支持按分身过滤。用于监控记忆处理流水线的运行状况。
* @summary 调试-流水线状态列表
* @param {MemoryDebugPipelineStateGetListReq} memoryDebugPipelineStateGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMemoryDebugPipelineStateGetList (
memoryDebugPipelineStateGetListReq: MemoryDebugPipelineStateGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/memory/debug/pipeline-state/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiMemoryDebugPipelineStateGetList200Response>>(localVarPath, memoryDebugPipelineStateGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：平台管理员查看全局记忆召回轨迹，支持按分身、查询内容过滤。用于调试记忆召回效果和排查问题。
* @summary 调试-召回轨迹列表
* @param {MemoryDebugTraceGetListReq} memoryDebugTraceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMemoryDebugTracesGetList (
memoryDebugTraceGetListReq: MemoryDebugTraceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/memory/debug/traces/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiMemoryDebugTracesGetList200Response>>(localVarPath, memoryDebugTraceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiMemoryDebugArchivesGetList operation in AiMemoryDebugApi.
 */
export interface AiMemoryDebugApiPostApiV1AiMemoryDebugArchivesGetListRequest {
    readonly memoryDebugArchiveGetListReq: MemoryDebugArchiveGetListReq
}

/**
 * Request parameters for postApiV1AiMemoryDebugDreamRunsGetList operation in AiMemoryDebugApi.
 */
export interface AiMemoryDebugApiPostApiV1AiMemoryDebugDreamRunsGetListRequest {
    readonly memoryDebugDreamRunGetListReq: MemoryDebugDreamRunGetListReq
}

/**
 * Request parameters for postApiV1AiMemoryDebugOverview operation in AiMemoryDebugApi.
 */
export interface AiMemoryDebugApiPostApiV1AiMemoryDebugOverviewRequest {
    readonly body: object
}

/**
 * Request parameters for postApiV1AiMemoryDebugPipelineStateGetList operation in AiMemoryDebugApi.
 */
export interface AiMemoryDebugApiPostApiV1AiMemoryDebugPipelineStateGetListRequest {
    readonly memoryDebugPipelineStateGetListReq: MemoryDebugPipelineStateGetListReq
}

/**
 * Request parameters for postApiV1AiMemoryDebugTracesGetList operation in AiMemoryDebugApi.
 */
export interface AiMemoryDebugApiPostApiV1AiMemoryDebugTracesGetListRequest {
    readonly memoryDebugTraceGetListReq: MemoryDebugTraceGetListReq
}
