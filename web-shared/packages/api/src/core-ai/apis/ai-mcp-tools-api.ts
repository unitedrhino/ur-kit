import type { McpToolsReq } from '../models';
import type { PostApiV1AiMcpToolsGetTools200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiMcpToolsApi - axios parameter creator
 */

/**
* 业务说明：查询指定会话上下文中已加载的MCP工具定义列表，包含工具名称、参数定义、描述等。用于前端展示工具面板、调试工具调用、验证工具可用性等场景。返回工具总数和时间戳。
* @summary 获取会话MCP工具列表
* @param {McpToolsReq} mcpToolsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpToolsGetTools (
mcpToolsReq: McpToolsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/tools/get-tools`;
    return requestClient.post<ExtractDataType<PostApiV1AiMcpToolsGetTools200Response>>(localVarPath, mcpToolsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiMcpToolsGetTools operation in AiMcpToolsApi.
 */
export interface AiMcpToolsApiPostApiV1AiMcpToolsGetToolsRequest {
    readonly mcpToolsReq: McpToolsReq
}
