import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiSpeakerEmbeddingExtract200Response } from '../models';
import type { PostApiV1AiSpeakerEmbeddingGetList200Response } from '../models';
import type { PostApiV1AiSpeakerEmbeddingGetOne200Response } from '../models';
import type { PostApiV1AiSpeakerEmbeddingImport200Response } from '../models';
import type { SpeakerEmbeddingDeleteReq } from '../models';
import type { SpeakerEmbeddingGetListReq } from '../models';
import type { SpeakerEmbeddingInfo } from '../models';
import type { SpeakerExtractReq } from '../models';
import type { SpeakerImportReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiSpeakerEmbeddingApi - axios parameter creator
 */

/**
* 业务说明：为指定Clone组注册新的声纹特征向量。需要提供说话人名称和声纹向量数据（192维float32数组的JSON）。同一Clone组内说话人名称不可重复。
* @summary 注册声纹
* @param {SpeakerEmbeddingInfo} speakerEmbeddingInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSpeakerEmbeddingCreate (
speakerEmbeddingInfo: SpeakerEmbeddingInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/speaker/embedding/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, speakerEmbeddingInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的声纹特征向量。删除后该说话人将无法被声纹识别。
* @summary 删除声纹
* @param {SpeakerEmbeddingDeleteReq} speakerEmbeddingDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSpeakerEmbeddingDelete (
speakerEmbeddingDeleteReq: SpeakerEmbeddingDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/speaker/embedding/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, speakerEmbeddingDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从音频数据中提取声纹特征向量（192维）。音频数据支持PCM或WAV格式，采样率建议16kHz。提取的向量可用于声纹注册或声纹识别比对。
* @summary 提取声纹特征向量
* @param {SpeakerExtractReq} speakerExtractReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSpeakerEmbeddingExtract (
speakerExtractReq: SpeakerExtractReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/speaker/embedding/extract`;
    return requestClient.post<ExtractDataType<PostApiV1AiSpeakerEmbeddingExtract200Response>>(localVarPath, speakerExtractReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询声纹列表，支持按Clone组、说话人名称、状态过滤。
* @summary 获取声纹列表
* @param {SpeakerEmbeddingGetListReq} speakerEmbeddingGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSpeakerEmbeddingGetList (
speakerEmbeddingGetListReq: SpeakerEmbeddingGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/speaker/embedding/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiSpeakerEmbeddingGetList200Response>>(localVarPath, speakerEmbeddingGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据声纹ID查询完整信息，包括说话人名称、声纹向量、个性化提示词等。
* @summary 获取声纹详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSpeakerEmbeddingGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/speaker/embedding/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiSpeakerEmbeddingGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量导入声纹特征向量到指定Clone组。支持直接提供embedding向量或音频数据（自动提取）。
* @summary 批量导入声纹
* @param {SpeakerImportReq} speakerImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSpeakerEmbeddingImport (
speakerImportReq: SpeakerImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/speaker/embedding/import`;
    return requestClient.post<ExtractDataType<PostApiV1AiSpeakerEmbeddingImport200Response>>(localVarPath, speakerImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改声纹的说话人名称、个性化提示词、状态等。部分更新，空值字段不修改。
* @summary 更新声纹
* @param {SpeakerEmbeddingInfo} speakerEmbeddingInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSpeakerEmbeddingUpdate (
speakerEmbeddingInfo: SpeakerEmbeddingInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/speaker/embedding/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, speakerEmbeddingInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiSpeakerEmbeddingCreate operation in AiSpeakerEmbeddingApi.
 */
export interface AiSpeakerEmbeddingApiPostApiV1AiSpeakerEmbeddingCreateRequest {
    readonly speakerEmbeddingInfo: SpeakerEmbeddingInfo
}

/**
 * Request parameters for postApiV1AiSpeakerEmbeddingDelete operation in AiSpeakerEmbeddingApi.
 */
export interface AiSpeakerEmbeddingApiPostApiV1AiSpeakerEmbeddingDeleteRequest {
    readonly speakerEmbeddingDeleteReq: SpeakerEmbeddingDeleteReq
}

/**
 * Request parameters for postApiV1AiSpeakerEmbeddingExtract operation in AiSpeakerEmbeddingApi.
 */
export interface AiSpeakerEmbeddingApiPostApiV1AiSpeakerEmbeddingExtractRequest {
    readonly speakerExtractReq: SpeakerExtractReq
}

/**
 * Request parameters for postApiV1AiSpeakerEmbeddingGetList operation in AiSpeakerEmbeddingApi.
 */
export interface AiSpeakerEmbeddingApiPostApiV1AiSpeakerEmbeddingGetListRequest {
    readonly speakerEmbeddingGetListReq: SpeakerEmbeddingGetListReq
}

/**
 * Request parameters for postApiV1AiSpeakerEmbeddingGetOne operation in AiSpeakerEmbeddingApi.
 */
export interface AiSpeakerEmbeddingApiPostApiV1AiSpeakerEmbeddingGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiSpeakerEmbeddingImport operation in AiSpeakerEmbeddingApi.
 */
export interface AiSpeakerEmbeddingApiPostApiV1AiSpeakerEmbeddingImportRequest {
    readonly speakerImportReq: SpeakerImportReq
}

/**
 * Request parameters for postApiV1AiSpeakerEmbeddingUpdate operation in AiSpeakerEmbeddingApi.
 */
export interface AiSpeakerEmbeddingApiPostApiV1AiSpeakerEmbeddingUpdateRequest {
    readonly speakerEmbeddingInfo: SpeakerEmbeddingInfo
}
