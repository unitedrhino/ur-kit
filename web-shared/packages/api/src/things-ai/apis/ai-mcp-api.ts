import type { PostApiV1AiMcpRun200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiMcpApi - axios parameter creator
 */

/**
*
* @summary 添加规则链
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpRun (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/run`;
    return requestClient.post<ExtractDataType<PostApiV1AiMcpRun200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiMcpRun operation in AiMcpApi.
 */
export interface AiMcpApiPostApiV1AiMcpRunRequest {
    readonly body: object
}
