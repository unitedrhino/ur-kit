import type { ChatCompletionsReq } from '../models';
import type { EmbeddingDebugReq } from '../models';
import type { LlmDebugReq } from '../models';
import type { PostApiV1AiChatAvailableTools200Response } from '../models';
import type { PostApiV1AiChatCheckAvailable200Response } from '../models';
import type { PostApiV1AiChatCompletions200Response } from '../models';
import type { PostApiV1AiChatToolResult200Response } from '../models';
import type { PostApiV1AiEmbeddingDebug200Response } from '../models';
import type { PostApiV1AiLlmDebug200Response } from '../models';
import type { ToolDevCompletionsReq } from '../models';
import type { ToolResultReq } from '../models';
import type { UserCompletionsReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiChatApi - axios parameter creator
 */

/**
* 业务说明：查询当前会话上下文中可用的MCP工具和后端注册工具定义，用于前端展示工具面板、调试工具调用等。返回工具名称、参数定义、交互类型等信息，供前端理解工具用途并正确回传执行结果。
* @summary 获取当前会话可用的后端工具列表
* @param {ChatCompletionsReq} chatCompletionsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatAvailableTools (
chatCompletionsReq: ChatCompletionsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/available-tools`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatAvailableTools200Response>>(localVarPath, chatCompletionsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：检查当前用户/租户是否具备AI对话能力，验证助手配置完整性（LLM/TTS/ASR配置是否存在且启用）。用于前端在发起对话前预检，避免用户发起对话后才发现服务不可用。返回available状态及不可用原因。
* @summary 检测 AI 对话功能是否可用
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatCheckAvailable (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/check-available`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatCheckAvailable200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：向指定的AI助手发起文字对话请求，支持多轮对话、流式响应（SSE）、工具调用。传入历史消息列表，AI根据配置生成回复。可指定cloneID启用分身记忆，sessionID用于会话追踪。支持多模态输入（文本/图片/音频/文件）。agentID=0时为裸LLM调用模式，不注入任何上下文（Agent提示词、Skill、知识库、记忆等均跳过），不记录会话，可通过modelType指定LLM模型类型（默认small），适用于urcli、外部代码调用、调试场景。
* @summary 文字对话（指定 agentID）
* @param {ChatCompletionsReq} chatCompletionsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatCompletions (
chatCompletionsReq: ChatCompletionsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/completions`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatCompletions200Response>>(localVarPath, chatCompletionsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：前端执行完工具【如表单填写、UI交互】后，将执行结果回传给后端，后端将其注入到对话上下文，让AI继续处理。对应SSE事件tool_call_execute中的toolCallID。超时未回传的会话会被标记为expired。
* @summary 前端 Tool 执行结果回传
* @param {ToolResultReq} toolResultReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatToolResult (
toolResultReq: ToolResultReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/tool-result`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatToolResult200Response>>(localVarPath, toolResultReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：使用前端传入的临时 Embedding 配置直接发起一次真实调用，验证模型连通性和参数格式。传入待编码文本，返回向量维度、前10个预览值和 token 消耗。不读取数据库配置，不创建会话，仅返回本轮结果。用于模型配置管理页面的调试功能。
* @summary Embedding配置调试
* @param {EmbeddingDebugReq} embeddingDebugReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiEmbeddingDebug (
embeddingDebugReq: EmbeddingDebugReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/embedding/debug`;
    return requestClient.post<ExtractDataType<PostApiV1AiEmbeddingDebug200Response>>(localVarPath, embeddingDebugReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：使用前端传入的临时 LLM 配置直接发起一次真实调用，验证模型连通性和参数格式。不读取数据库配置，不创建会话，仅返回本轮结果。用于模型配置管理页面的调试功能。
* @summary LLM配置调试
* @param {LlmDebugReq} llmDebugReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiLlmDebug (
llmDebugReq: LlmDebugReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/llm/debug`;
    return requestClient.post<ExtractDataType<PostApiV1AiLlmDebug200Response>>(localVarPath, llmDebugReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：工具编辑专用对话接口，后端自动绑定 assistantCode=tool_assistant，无需前端传递。用于 AI 辅助编写 executor.js、readme.md、manifest.json。支持流式响应和文件操作工具。
* @summary 工具编辑 AI 对话（自动绑定 tool_assistant）
* @param {ToolDevCompletionsReq} toolDevCompletionsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolDevCompletions (
toolDevCompletionsReq: ToolDevCompletionsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool-dev/completions`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatCompletions200Response>>(localVarPath, toolDevCompletionsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：用户级对话接口，无需指定agentID，系统根据用户绑定的助手组自动查找专属分身。如果没有分身则自动创建。简化前端调用，用户直接发消息即可，适合移动端、嵌入式对话场景。支持流式响应和工具调用。
* @summary 用户 AI 对话（自动查找/创建专属 Clone）
* @param {UserCompletionsReq} userCompletionsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiUserCompletions (
userCompletionsReq: UserCompletionsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/user/completions`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatCompletions200Response>>(localVarPath, userCompletionsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiChatAvailableTools operation in AiChatApi.
 */
export interface AiChatApiPostApiV1AiChatAvailableToolsRequest {
    readonly chatCompletionsReq: ChatCompletionsReq
}

/**
 * Request parameters for postApiV1AiChatCheckAvailable operation in AiChatApi.
 */
export interface AiChatApiPostApiV1AiChatCheckAvailableRequest {
    readonly body: object
}

/**
 * Request parameters for postApiV1AiChatCompletions operation in AiChatApi.
 */
export interface AiChatApiPostApiV1AiChatCompletionsRequest {
    readonly chatCompletionsReq: ChatCompletionsReq
}

/**
 * Request parameters for postApiV1AiChatToolResult operation in AiChatApi.
 */
export interface AiChatApiPostApiV1AiChatToolResultRequest {
    readonly toolResultReq: ToolResultReq
}

/**
 * Request parameters for postApiV1AiEmbeddingDebug operation in AiChatApi.
 */
export interface AiChatApiPostApiV1AiEmbeddingDebugRequest {
    readonly embeddingDebugReq: EmbeddingDebugReq
}

/**
 * Request parameters for postApiV1AiLlmDebug operation in AiChatApi.
 */
export interface AiChatApiPostApiV1AiLlmDebugRequest {
    readonly llmDebugReq: LlmDebugReq
}

/**
 * Request parameters for postApiV1AiToolDevCompletions operation in AiChatApi.
 */
export interface AiChatApiPostApiV1AiToolDevCompletionsRequest {
    readonly toolDevCompletionsReq: ToolDevCompletionsReq
}

/**
 * Request parameters for postApiV1AiUserCompletions operation in AiChatApi.
 */
export interface AiChatApiPostApiV1AiUserCompletionsRequest {
    readonly userCompletionsReq: UserCompletionsReq
}
