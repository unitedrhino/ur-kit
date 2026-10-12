import type { McpRefreshToolsReq } from '../models';
import type { McpServiceDeleteReq } from '../models';
import type { McpServiceGetListReq } from '../models';
import type { McpServiceGetOneReq } from '../models';
import type { McpServiceInfo } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiMcpServiceGetList200Response } from '../models';
import type { PostApiV1AiMcpServiceGetOne200Response } from '../models';
import type { PostApiV1AiMcpServiceRefreshTools200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiMcpServiceApi - axios parameter creator
 */

/**
* 业务说明：注册新的MCP（Model Context Protocol）服务端点，定义服务名称、描述、端点URL、认证配置等。MCP服务提供外部工具能力，助手绑定MCP服务后可获得其工具列表，扩展AI的交互能力。
* @summary 创建MCP服务
* @param {McpServiceInfo} mcpServiceInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpServiceCreate (
mcpServiceInfo: McpServiceInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/service/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, mcpServiceInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的MCP服务注册记录。删除前需检查是否有助手组或助手正在使用该MCP服务，如有则需先解除绑定后再删除。删除后相关工具调用将失败。
* @summary 删除MCP服务
* @param {McpServiceDeleteReq} mcpServiceDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpServiceDelete (
mcpServiceDeleteReq: McpServiceDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/service/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, mcpServiceDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询MCP服务列表，支持按租户、名称模糊搜索、启用状态过滤。用于MCP服务管理页面、助手组选择MCP服务等场景。返回结果包含基本信息，不含详细工具定义。
* @summary 获取MCP服务列表
* @param {McpServiceGetListReq} mcpServiceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpServiceGetList (
mcpServiceGetListReq: McpServiceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/service/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiMcpServiceGetList200Response>>(localVarPath, mcpServiceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据MCP服务ID查询完整的服务配置信息，包括端点URL、认证类型、认证配置、工具列表等。用于MCP服务编辑回显、配置查看、工具调试等场景。
* @summary 获取MCP服务详情
* @param {McpServiceGetOneReq} mcpServiceGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpServiceGetOne (
mcpServiceGetOneReq: McpServiceGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/service/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiMcpServiceGetOne200Response>>(localVarPath, mcpServiceGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：重新从MCP服务端点获取最新的工具定义列表，同步到本地数据库。用于MCP服务升级后更新工具、初次绑定MCP服务时获取工具等场景。返回刷新后的工具列表JSON。
* @summary 刷新MCP服务工具列表
* @param {McpRefreshToolsReq} mcpRefreshToolsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpServiceRefreshTools (
mcpRefreshToolsReq: McpRefreshToolsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/service/refresh-tools`;
    return requestClient.post<ExtractDataType<PostApiV1AiMcpServiceRefreshTools200Response>>(localVarPath, mcpRefreshToolsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改已注册的MCP服务配置，支持更新名称、描述、端点URL、认证配置、启用状态等。部分更新，空值字段不修改。更新后需要刷新工具列表才能同步最新的工具定义。
* @summary 更新MCP服务
* @param {McpServiceInfo} mcpServiceInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiMcpServiceUpdate (
mcpServiceInfo: McpServiceInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/mcp/service/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, mcpServiceInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiMcpServiceCreate operation in AiMcpServiceApi.
 */
export interface AiMcpServiceApiPostApiV1AiMcpServiceCreateRequest {
    readonly mcpServiceInfo: McpServiceInfo
}

/**
 * Request parameters for postApiV1AiMcpServiceDelete operation in AiMcpServiceApi.
 */
export interface AiMcpServiceApiPostApiV1AiMcpServiceDeleteRequest {
    readonly mcpServiceDeleteReq: McpServiceDeleteReq
}

/**
 * Request parameters for postApiV1AiMcpServiceGetList operation in AiMcpServiceApi.
 */
export interface AiMcpServiceApiPostApiV1AiMcpServiceGetListRequest {
    readonly mcpServiceGetListReq: McpServiceGetListReq
}

/**
 * Request parameters for postApiV1AiMcpServiceGetOne operation in AiMcpServiceApi.
 */
export interface AiMcpServiceApiPostApiV1AiMcpServiceGetOneRequest {
    readonly mcpServiceGetOneReq: McpServiceGetOneReq
}

/**
 * Request parameters for postApiV1AiMcpServiceRefreshTools operation in AiMcpServiceApi.
 */
export interface AiMcpServiceApiPostApiV1AiMcpServiceRefreshToolsRequest {
    readonly mcpRefreshToolsReq: McpRefreshToolsReq
}

/**
 * Request parameters for postApiV1AiMcpServiceUpdate operation in AiMcpServiceApi.
 */
export interface AiMcpServiceApiPostApiV1AiMcpServiceUpdateRequest {
    readonly mcpServiceInfo: McpServiceInfo
}
