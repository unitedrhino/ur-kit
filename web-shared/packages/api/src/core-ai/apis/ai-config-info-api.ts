import type { ConfigDeleteReq } from '../models';
import type { ConfigGetDefaultReq } from '../models';
import type { ConfigGetListReq } from '../models';
import type { ConfigGetOneReq } from '../models';
import type { ConfigInfo } from '../models';
import type { ConfigTestReq } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiConfigInfoGetDefault200Response } from '../models';
import type { PostApiV1AiConfigInfoGetList200Response } from '../models';
import type { PostApiV1AiConfigInfoTest200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiConfigInfoApi - axios parameter creator
 */

/**
* 业务说明：创建新的AI能力配置（LLM/TTS/ASR/VAD/Realtime），定义连接参数、模型选择和计费参数。Realtime 凭据加密保存，读取仅返回已配置标记。接口含密钥，不记录完整请求体；成功变更记录不含密钥的服务日志。
* @summary 创建配置
* @param {ConfigInfo} configInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiConfigInfoCreate (
configInfo: ConfigInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/config/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, configInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的AI能力配置记录。删除前需检查是否有助手正在使用该配置（通过configID关联），如有则需先解除关联或更换配置后再删除。删除操作不可恢复。
* @summary 删除配置
* @param {ConfigDeleteReq} configDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiConfigInfoDelete (
configDeleteReq: ConfigDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/config/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, configDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定类型（LLM/TTS/ASR/VAD）的租户默认配置。当助手未指定具体配置ID时，系统将自动使用默认配置。如果租户未设置默认配置，则回退到common租户的默认配置。用于快速获取推荐配置。
* @summary 获取默认配置
* @param {ConfigGetDefaultReq} configGetDefaultReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiConfigInfoGetDefault (
configGetDefaultReq: ConfigGetDefaultReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/config/info/get-default`;
    return requestClient.post<ExtractDataType<PostApiV1AiConfigInfoGetDefault200Response>>(localVarPath, configGetDefaultReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询AI能力配置列表，支持按配置类型（llm/tts/asr/vad）、启用状态过滤。用于配置管理页面列表展示、助手创建时选择配置等场景。返回结果包含配置基本信息，不含详细参数。
* @summary 获取配置列表
* @param {ConfigGetListReq} configGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiConfigInfoGetList (
configGetListReq: ConfigGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/config/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiConfigInfoGetList200Response>>(localVarPath, configGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据配置ID查询完整的配置信息，包括模型用途、模型级别和jsonData参数等。用于配置编辑回显、参数调试、配置查看等场景。jsonData字段为JSON字符串，需前端解析展示。
* @summary 获取配置详情
* @param {ConfigGetOneReq} configGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiConfigInfoGetOne (
configGetOneReq: ConfigGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/config/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiConfigInfoGetDefault200Response>>(localVarPath, configGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：使用当前表单里的临时 AI 配置直接发起一次真实调用，验证模型连通性、参数格式和多模态输入兼容性。该接口不依赖已保存配置，不创建会话、不写入历史摘要，仅返回本轮结果，用于模型配置页调试。
* @summary 测试配置
* @param {ConfigTestReq} configTestReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiConfigInfoTest (
configTestReq: ConfigTestReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/config/info/test`;
    return requestClient.post<ExtractDataType<PostApiV1AiConfigInfoTest200Response>>(localVarPath, configTestReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改AI能力配置，未提交字段不修改。Realtime 的 jsonData 为完整表单，密钥空白保留，清除须显式确认并禁用配置。更新只影响新会话；接口含密钥，不记录完整请求体，成功变更记录不含密钥的服务日志。
* @summary 更新配置
* @param {ConfigInfo} configInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiConfigInfoUpdate (
configInfo: ConfigInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/config/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, configInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiConfigInfoCreate operation in AiConfigInfoApi.
 */
export interface AiConfigInfoApiPostApiV1AiConfigInfoCreateRequest {
    readonly configInfo: ConfigInfo
}

/**
 * Request parameters for postApiV1AiConfigInfoDelete operation in AiConfigInfoApi.
 */
export interface AiConfigInfoApiPostApiV1AiConfigInfoDeleteRequest {
    readonly configDeleteReq: ConfigDeleteReq
}

/**
 * Request parameters for postApiV1AiConfigInfoGetDefault operation in AiConfigInfoApi.
 */
export interface AiConfigInfoApiPostApiV1AiConfigInfoGetDefaultRequest {
    readonly configGetDefaultReq: ConfigGetDefaultReq
}

/**
 * Request parameters for postApiV1AiConfigInfoGetList operation in AiConfigInfoApi.
 */
export interface AiConfigInfoApiPostApiV1AiConfigInfoGetListRequest {
    readonly configGetListReq: ConfigGetListReq
}

/**
 * Request parameters for postApiV1AiConfigInfoGetOne operation in AiConfigInfoApi.
 */
export interface AiConfigInfoApiPostApiV1AiConfigInfoGetOneRequest {
    readonly configGetOneReq: ConfigGetOneReq
}

/**
 * Request parameters for postApiV1AiConfigInfoTest operation in AiConfigInfoApi.
 */
export interface AiConfigInfoApiPostApiV1AiConfigInfoTestRequest {
    readonly configTestReq: ConfigTestReq
}

/**
 * Request parameters for postApiV1AiConfigInfoUpdate operation in AiConfigInfoApi.
 */
export interface AiConfigInfoApiPostApiV1AiConfigInfoUpdateRequest {
    readonly configInfo: ConfigInfo
}
