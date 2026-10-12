import type { AgentGroupGetListReq } from '../models';
import type { AgentGroupInfo } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiAgentGroupGetList200Response } from '../models';
import type { PostApiV1AiAgentGroupGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiAgentgroupApi - axios parameter creator
 */

/**
* 业务说明：创建新的助手组，用于维护组内 Agent 共享的提示词模板、默认模型配置、共享知识库以及平台分发 skills。AgentGroup 只承载共享配置，不是 learned skills 的归属主体；真正执行决策的是 Agent；Clone 只承载长期状态与记忆。tenantCode 为 \'common\' 时表示平台级共享配置组。
* @summary 创建助手组
* @param {AgentGroupInfo} agentGroupInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentGroupCreate (
agentGroupInfo: AgentGroupInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/group/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, agentGroupInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的助手组记录。删除前需检查组下是否还有助手，如有则需先删除或迁移助手后再删除助手组。平台级助手组删除需平台管理员权限。删除操作不可恢复。
* @summary 删除助手组
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentGroupDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/group/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询助手组列表，支持按租户、名称、用途分类过滤。列表展示的是共享配置组，不是决策主体；真正执行决策的是组内 Agent。平台管理员可查看所有租户的助手组，普通用户只能查看本租户和 common 的助手组。
* @summary 获取助手组列表
* @param {AgentGroupGetListReq} agentGroupGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentGroupGetList (
agentGroupGetListReq: AgentGroupGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/group/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupGetList200Response>>(localVarPath, agentGroupGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据助手组ID查询共享配置信息，包括共享提示词、共享 LLM/TTS/ASR、平台分发 skills、共享知识库和默认决策 Agent 等。返回内容用于共享配置查看与编辑，不表示 Group 或 Clone 拥有 learned skills。
* @summary 获取助手组详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentGroupGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/group/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改已存在的助手组共享配置，支持更新名称、描述、共享提示词、共享 LLM/TTS/ASR、平台分发 skills、共享知识库和默认决策 Agent 等。该接口不改变 learned skills 的归属语义，Group 与 Clone 都不是 learned skills 的长期拥有者。
* @summary 更新助手组
* @param {AgentGroupInfo} agentGroupInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiAgentGroupUpdate (
agentGroupInfo: AgentGroupInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/agent/group/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, agentGroupInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiAgentGroupCreate operation in AiAgentgroupApi.
 */
export interface AiAgentgroupApiPostApiV1AiAgentGroupCreateRequest {
    readonly agentGroupInfo: AgentGroupInfo
}

/**
 * Request parameters for postApiV1AiAgentGroupDelete operation in AiAgentgroupApi.
 */
export interface AiAgentgroupApiPostApiV1AiAgentGroupDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiAgentGroupGetList operation in AiAgentgroupApi.
 */
export interface AiAgentgroupApiPostApiV1AiAgentGroupGetListRequest {
    readonly agentGroupGetListReq: AgentGroupGetListReq
}

/**
 * Request parameters for postApiV1AiAgentGroupGetOne operation in AiAgentgroupApi.
 */
export interface AiAgentgroupApiPostApiV1AiAgentGroupGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiAgentGroupUpdate operation in AiAgentgroupApi.
 */
export interface AiAgentgroupApiPostApiV1AiAgentGroupUpdateRequest {
    readonly agentGroupInfo: AgentGroupInfo
}
