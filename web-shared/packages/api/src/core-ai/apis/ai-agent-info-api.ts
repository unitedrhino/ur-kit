import type { AgentDeleteReq } from '../models';
import type { AgentGetListReq } from '../models';
import type { AgentGetOneReq } from '../models';
import type { AgentInfo } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiAgentInfoGetList200Response } from '../models';
import type { PostApiV1AiAgentInfoGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiAgentInfoApi - axios parameter creator
 */

/**
* 业务说明：创建新的AI助手实例，配置其基础信息、LLM/TTS/ASR配置、系统提示词、MCP服务关联等。助手是用户与AI交互的核心实体，需要绑定到助手组后才能被用户访问。
* @summary 创建助手
* @param {AgentInfo} agentInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentInfoCreate (
agentInfo: AgentInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, agentInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的AI助手记录。删除前需确保该助手没有活跃的会话或分身关联，否则可能导致业务中断。删除操作不可恢复。
* @summary 删除助手
* @param {AgentDeleteReq} agentDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentInfoDelete (
agentDeleteReq: AgentDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, agentDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询助手列表，支持按租户、名称、助手组ID、状态等条件过滤，并支持按名称或状态排序。未指定排序时按ID倒序排列。用于助手管理页面的列表展示、助手选择器等场景。
* @summary 获取助手列表
* @param {AgentGetListReq} agentGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentInfoGetList (
agentGetListReq: AgentGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentInfoGetList200Response>>(localVarPath, agentGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据助手ID查询完整的助手配置信息，包括所有字段配置。用于编辑助手时的数据回显、详情查看等场景。返回的configID可用于查询对应配置的具体参数。
* @summary 获取助手详情
* @param {AgentGetOneReq} agentGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentInfoGetOne (
agentGetOneReq: AgentGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentInfoGetOne200Response>>(localVarPath, agentGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改已存在的AI助手配置，包括名称、提示词、头像、各模态配置ID（LLM/TTS/ASR/Vision）、能力列表、MCP服务绑定等。部分更新支持，空值字段不会被修改。
* @summary 更新助手
* @param {AgentInfo} agentInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentInfoUpdate (
agentInfo: AgentInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, agentInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiAgentInfoCreate operation in AiAgentInfoApi.
 */
export interface AiAgentInfoApiPostApiV1AiAgentInfoCreateRequest {
    readonly agentInfo: AgentInfo
}

/**
 * Request parameters for postApiV1AiAgentInfoDelete operation in AiAgentInfoApi.
 */
export interface AiAgentInfoApiPostApiV1AiAgentInfoDeleteRequest {
    readonly agentDeleteReq: AgentDeleteReq
}

/**
 * Request parameters for postApiV1AiAgentInfoGetList operation in AiAgentInfoApi.
 */
export interface AiAgentInfoApiPostApiV1AiAgentInfoGetListRequest {
    readonly agentGetListReq: AgentGetListReq
}

/**
 * Request parameters for postApiV1AiAgentInfoGetOne operation in AiAgentInfoApi.
 */
export interface AiAgentInfoApiPostApiV1AiAgentInfoGetOneRequest {
    readonly agentGetOneReq: AgentGetOneReq
}

/**
 * Request parameters for postApiV1AiAgentInfoUpdate operation in AiAgentInfoApi.
 */
export interface AiAgentInfoApiPostApiV1AiAgentInfoUpdateRequest {
    readonly agentInfo: AgentInfo
}
