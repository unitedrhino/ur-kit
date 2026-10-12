import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiSessionDelete200Response } from '../models';
import type { PostApiV1AiSessionGetList200Response } from '../models';
import type { PostApiV1AiSessionGetOne200Response } from '../models';
import type { PostApiV1AiSessionInject200Response } from '../models';
import type { PostApiV1AiSessionMessages200Response } from '../models';
import type { SessionCreateReq } from '../models';
import type { SessionDeleteReq } from '../models';
import type { SessionGetListReq } from '../models';
import type { SessionGetOneReq } from '../models';
import type { SessionInjectReq } from '../models';
import type { SessionMessagesReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiSessionApi - axios parameter creator
 */

/**
* 业务说明：将已结束的会话归档，归档后的会话从活跃列表隐藏，但仍可通过历史查询访问。归档操作触发对话记录持久化到OSS，释放内存资源。用于会话清理、历史管理等场景。
* @summary 归档会话
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionArchive (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/archive`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建新的AI对话会话实例，绑定到指定助手和可选分身。会话是用户与AI交互的上下文容器，记录对话轮次、状态、渠道等。创建后返回会话ID，后续对话请求使用该ID维持上下文连续性。
* @summary 创建会话
* @param {SessionCreateReq} sessionCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionCreate (
sessionCreateReq: SessionCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, sessionCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的会话记录及其关联的对话消息。删除后会话ID失效，历史记录不可恢复。用于清理过期会话、用户主动删除对话历史等场景。删除前应确保会话已结束。
* @summary 删除会话
* @param {SessionDeleteReq} sessionDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionDelete (
sessionDeleteReq: SessionDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionDelete200Response>>(localVarPath, sessionDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将活跃状态的会话标记为已结束，停止后续对话，保留会话记录供后续查询。结束后会话不再接受新消息，但历史记录仍然可用。用于用户主动结束对话、超时自动结束等场景。
* @summary 结束会话
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionEnd (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/end`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询会话列表，支持按租户、助手、分身、用户、状态过滤。用于会话管理页面、历史会话查看等场景。返回结果按最后活跃时间倒序排列，活跃会话优先展示。
* @summary 获取会话列表
* @param {SessionGetListReq} sessionGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionGetList (
sessionGetListReq: SessionGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionGetList200Response>>(localVarPath, sessionGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据会话ID或内部ID查询完整的会话信息，包括绑定助手、分身、用户、渠道、状态、对话轮次等。用于会话详情查看、状态监控、历史追溯等场景。
* @summary 获取会话详情
* @param {SessionGetOneReq} sessionGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionGetOne (
sessionGetOneReq: SessionGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionGetOne200Response>>(localVarPath, sessionGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：向已存在的会话注入外部消息，用于模拟用户输入、插入系统提示、补充上下文等场景。注入的消息会被记录到对话历史，参与后续AI推理。支持指定消息类型区分注入来源。
* @summary 注入消息到会话
* @param {SessionInjectReq} sessionInjectReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionInject (
sessionInjectReq: SessionInjectReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/inject`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionInject200Response>>(localVarPath, sessionInjectReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定会话的对话消息记录，按轮次返回用户输入、AI回复、摘要、关键主题等。用于对话历史回放、内容分析、质量评估等场景。支持分页，每轮对话包含完整的问答对。
* @summary 获取会话消息列表
* @param {SessionMessagesReq} sessionMessagesReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionMessages (
sessionMessagesReq: SessionMessagesReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/messages`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionMessages200Response>>(localVarPath, sessionMessagesReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiSessionArchive operation in AiSessionApi.
 */
export interface AiSessionApiPostApiV1AiSessionArchiveRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiSessionCreate operation in AiSessionApi.
 */
export interface AiSessionApiPostApiV1AiSessionCreateRequest {
    readonly sessionCreateReq: SessionCreateReq
}

/**
 * Request parameters for postApiV1AiSessionDelete operation in AiSessionApi.
 */
export interface AiSessionApiPostApiV1AiSessionDeleteRequest {
    readonly sessionDeleteReq: SessionDeleteReq
}

/**
 * Request parameters for postApiV1AiSessionEnd operation in AiSessionApi.
 */
export interface AiSessionApiPostApiV1AiSessionEndRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiSessionGetList operation in AiSessionApi.
 */
export interface AiSessionApiPostApiV1AiSessionGetListRequest {
    readonly sessionGetListReq: SessionGetListReq
}

/**
 * Request parameters for postApiV1AiSessionGetOne operation in AiSessionApi.
 */
export interface AiSessionApiPostApiV1AiSessionGetOneRequest {
    readonly sessionGetOneReq: SessionGetOneReq
}

/**
 * Request parameters for postApiV1AiSessionInject operation in AiSessionApi.
 */
export interface AiSessionApiPostApiV1AiSessionInjectRequest {
    readonly sessionInjectReq: SessionInjectReq
}

/**
 * Request parameters for postApiV1AiSessionMessages operation in AiSessionApi.
 */
export interface AiSessionApiPostApiV1AiSessionMessagesRequest {
    readonly sessionMessagesReq: SessionMessagesReq
}
