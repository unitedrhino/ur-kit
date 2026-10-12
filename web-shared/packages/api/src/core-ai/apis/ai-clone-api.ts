import type { CloneGetListReq } from '../models';
import type { CloneInfo } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiCloneGetList200Response } from '../models';
import type { PostApiV1AiCloneGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiCloneApi - axios parameter creator
 */

/**
* 业务说明：创建新的数字分身实例，绑定到指定助手。分身是用户专属的AI人格实例，拥有独立的记忆存储、人设补充提示词、扩展元数据等。创建后返回分身ID，用户可通过分身ID获得个性化对话体验。
* @summary 创建分身
* @param {CloneInfo} cloneInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneCreate (
cloneInfo: CloneInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, cloneInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的数字分身记录及其关联的记忆数据、快照数据。删除后分身ID失效，用户将失去个性化记忆。删除操作不可恢复，需谨慎操作。
* @summary 删除分身
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询分身列表，支持按租户、助手、名称、状态、code过滤。用于分身管理页面、用户选择分身等场景。返回结果按创建时间倒序排列。
* @summary 获取分身列表
* @param {CloneGetListReq} cloneGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneGetList (
cloneGetListReq: CloneGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneGetList200Response>>(localVarPath, cloneGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据分身ID查询完整的分身信息，包括名称、描述、人设提示词、元数据等。用于分身编辑回显、详情查看、配置管理等场景。长期记忆摘要需通过独立的 profile 接口查询。
* @summary 获取分身详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改已存在的分身配置，支持更新名称、描述、人设补充提示词、元数据、状态等。部分更新，空值字段不修改。更新后新会话将使用新配置，已有会话保持原配置。
* @summary 更新分身
* @param {CloneInfo} cloneInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneUpdate (
cloneInfo: CloneInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, cloneInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiCloneCreate operation in AiCloneApi.
 */
export interface AiCloneApiPostApiV1AiCloneCreateRequest {
    readonly cloneInfo: CloneInfo
}

/**
 * Request parameters for postApiV1AiCloneDelete operation in AiCloneApi.
 */
export interface AiCloneApiPostApiV1AiCloneDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneGetList operation in AiCloneApi.
 */
export interface AiCloneApiPostApiV1AiCloneGetListRequest {
    readonly cloneGetListReq: CloneGetListReq
}

/**
 * Request parameters for postApiV1AiCloneGetOne operation in AiCloneApi.
 */
export interface AiCloneApiPostApiV1AiCloneGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneUpdate operation in AiCloneApi.
 */
export interface AiCloneApiPostApiV1AiCloneUpdateRequest {
    readonly cloneInfo: CloneInfo
}
