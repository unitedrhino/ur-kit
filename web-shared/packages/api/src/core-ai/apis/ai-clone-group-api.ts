import type { CloneGroupGetListReq } from '../models';
import type { CloneGroupInfo } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiCloneGroupGetList200Response } from '../models';
import type { PostApiV1AiCloneGroupGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiCloneGroupApi - axios parameter creator
 */

/**
* 业务说明：为指定AgentGroup创建Clone组，Clone组可绑定TTS配置和声纹组。每个AgentGroup自动拥有一个默认组（isDefault=1），不可删除。新建Clone组时自动分配code。
* @summary 创建Clone组
* @param {CloneGroupInfo} cloneGroupInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneGroupCreate (
cloneGroupInfo: CloneGroupInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-group/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, cloneGroupInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的Clone组。默认组（isDefault=1）不可删除。删除前需确保组内没有关联的Clone和声纹组。
* @summary 删除Clone组
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneGroupDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-group/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询Clone组列表，支持按AgentGroup ID、名称、状态过滤。返回结果按创建时间倒序排列。
* @summary 获取Clone组列表
* @param {CloneGroupGetListReq} cloneGroupGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneGroupGetList (
cloneGroupGetListReq: CloneGroupGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-group/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneGroupGetList200Response>>(localVarPath, cloneGroupGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据Clone组ID查询完整信息，包括TTS配置、语音参数、是否默认组等。
* @summary 获取Clone组详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneGroupGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-group/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneGroupGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改Clone组的名称、描述、TTS配置、语音参数等。部分更新，空值字段不修改。默认组不可修改isDefault字段。
* @summary 更新Clone组
* @param {CloneGroupInfo} cloneGroupInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneGroupUpdate (
cloneGroupInfo: CloneGroupInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-group/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, cloneGroupInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiCloneGroupCreate operation in AiCloneGroupApi.
 */
export interface AiCloneGroupApiPostApiV1AiCloneGroupCreateRequest {
    readonly cloneGroupInfo: CloneGroupInfo
}

/**
 * Request parameters for postApiV1AiCloneGroupDelete operation in AiCloneGroupApi.
 */
export interface AiCloneGroupApiPostApiV1AiCloneGroupDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneGroupGetList operation in AiCloneGroupApi.
 */
export interface AiCloneGroupApiPostApiV1AiCloneGroupGetListRequest {
    readonly cloneGroupGetListReq: CloneGroupGetListReq
}

/**
 * Request parameters for postApiV1AiCloneGroupGetOne operation in AiCloneGroupApi.
 */
export interface AiCloneGroupApiPostApiV1AiCloneGroupGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneGroupUpdate operation in AiCloneGroupApi.
 */
export interface AiCloneGroupApiPostApiV1AiCloneGroupUpdateRequest {
    readonly cloneGroupInfo: CloneGroupInfo
}
