import type { PostApiV1AiToolRun200Response } from '../models';
import type { PostApiV1AiToolRunHistory200Response } from '../models';
import type { PostApiV1AiToolRunStatus200Response } from '../models';
import type { ToolRunHistoryReq } from '../models';
import type { ToolRunReq } from '../models';
import type { ToolRunStatusReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiToolRunApi - axios parameter creator
 */

/**
* 业务说明：异步执行指定工具，传入输入参数JSON，返回运行标识runID。工具在QuickJS沙箱中执行，可通过run-status接口轮询执行状态和结果。用于工具调试和手动触发场景。
* @summary 手动运行工具
* @param {ToolRunReq} toolRunReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolRun (
toolRunReq: ToolRunReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/run`;
    return requestClient.post<ExtractDataType<PostApiV1AiToolRun200Response>>(localVarPath, toolRunReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询指定工具的执行历史记录，按创建时间倒序排列。返回每次执行的runID、状态、耗时、错误信息等。用于工具执行记录查看和问题排查。
* @summary 执行历史列表
* @param {ToolRunHistoryReq} toolRunHistoryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolRunHistory (
toolRunHistoryReq: ToolRunHistoryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/run-history`;
    return requestClient.post<ExtractDataType<PostApiV1AiToolRunHistory200Response>>(localVarPath, toolRunHistoryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据runID轮询查询工具执行状态，返回当前状态（running/success/failed）、实时state、累积logs、耗时等。前端定时轮询直到状态变为success或failed。
* @summary 查询执行状态
* @param {ToolRunStatusReq} toolRunStatusReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolRunStatus (
toolRunStatusReq: ToolRunStatusReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/run-status`;
    return requestClient.post<ExtractDataType<PostApiV1AiToolRunStatus200Response>>(localVarPath, toolRunStatusReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiToolRun operation in AiToolRunApi.
 */
export interface AiToolRunApiPostApiV1AiToolRunRequest {
    readonly toolRunReq: ToolRunReq
}

/**
 * Request parameters for postApiV1AiToolRunHistory operation in AiToolRunApi.
 */
export interface AiToolRunApiPostApiV1AiToolRunHistoryRequest {
    readonly toolRunHistoryReq: ToolRunHistoryReq
}

/**
 * Request parameters for postApiV1AiToolRunStatus operation in AiToolRunApi.
 */
export interface AiToolRunApiPostApiV1AiToolRunStatusRequest {
    readonly toolRunStatusReq: ToolRunStatusReq
}
