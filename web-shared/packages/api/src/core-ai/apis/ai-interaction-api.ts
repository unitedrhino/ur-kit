import type { InteractionGetReq } from '../models';
import type { InteractionHistoryReq } from '../models';
import type { InteractionRowsReq } from '../models';
import type { InteractionSeriesReq } from '../models';
import type { PostApiV1AiChatResultGetOne200Response } from '../models';
import type { PostApiV1AiChatResultHistory200Response } from '../models';
import type { PostApiV1AiChatResultRows200Response } from '../models';
import type { PostApiV1AiChatResultSeries200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiInteractionApi - axios parameter creator
 */

/**
* 业务说明：鉴权后读取不可变结果定义及预览数据。只允许当前用户、应用、企业与实际数据权限范围访问。
* @summary 获取对话结果
* @param {InteractionGetReq} interactionGetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatResultGetOne (
interactionGetReq: InteractionGetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/result/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatResultGetOne200Response>>(localVarPath, interactionGetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：重新进入会话或 SSE 断线后，恢复当前有权访问的会话结果引用。
* @summary 恢复会话结果引用
* @param {InteractionHistoryReq} interactionHistoryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatResultHistory (
interactionHistoryReq: InteractionHistoryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/result/history`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatResultHistory200Response>>(localVarPath, interactionHistoryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按保存的数据快照进行分页和排序，字段必须来自数据集定义，不重新执行任意查询。
* @summary 查询结果表格数据
* @param {InteractionRowsReq} interactionRowsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatResultRows (
interactionRowsReq: InteractionRowsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/result/rows`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatResultRows200Response>>(localVarPath, interactionRowsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：读取保存结果的图表数据，趋势超限时保留分桶极值，分类图超限返回明确提示。
* @summary 查询结果图表序列
* @param {InteractionSeriesReq} interactionSeriesReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatResultSeries (
interactionSeriesReq: InteractionSeriesReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/result/series`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatResultSeries200Response>>(localVarPath, interactionSeriesReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiChatResultGetOne operation in AiInteractionApi.
 */
export interface AiInteractionApiPostApiV1AiChatResultGetOneRequest {
    readonly interactionGetReq: InteractionGetReq
}

/**
 * Request parameters for postApiV1AiChatResultHistory operation in AiInteractionApi.
 */
export interface AiInteractionApiPostApiV1AiChatResultHistoryRequest {
    readonly interactionHistoryReq: InteractionHistoryReq
}

/**
 * Request parameters for postApiV1AiChatResultRows operation in AiInteractionApi.
 */
export interface AiInteractionApiPostApiV1AiChatResultRowsRequest {
    readonly interactionRowsReq: InteractionRowsReq
}

/**
 * Request parameters for postApiV1AiChatResultSeries operation in AiInteractionApi.
 */
export interface AiInteractionApiPostApiV1AiChatResultSeriesRequest {
    readonly interactionSeriesReq: InteractionSeriesReq
}
