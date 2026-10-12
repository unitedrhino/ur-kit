import type { McpResolveReq } from '../models';
import type { PostApiV1AiMcpResolveResolve200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiMcpResolveApi - axios parameter creator
 */

/**
* 业务说明：根据MCP服务名称查询其端点URL和认证信息，用于客户端建立MCP连接。返回端点地址、认证类型、认证配置、可用工具列表等。用于助手初始化MCP连接前的预查询。
* @summary 解析MCP服务端点
* @param {McpResolveReq} mcpResolveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpResolveResolve (
mcpResolveReq: McpResolveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/resolve/resolve`;
    return requestClient.post<ExtractDataType<PostApiV1AiMcpResolveResolve200Response>>(localVarPath, mcpResolveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiMcpResolveResolve operation in AiMcpResolveApi.
 */
export interface AiMcpResolveApiPostApiV1AiMcpResolveResolveRequest {
    readonly mcpResolveReq: McpResolveReq
}
