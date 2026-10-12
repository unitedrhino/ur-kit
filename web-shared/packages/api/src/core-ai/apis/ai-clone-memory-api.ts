import type { CloneMemoryAddReq } from '../models';
import type { CloneMemoryDeleteReq } from '../models';
import type { CloneMemorySearchReq } from '../models';
import type { MemoryArchiveGetListReq } from '../models';
import type { MemoryDreamRunGetListReq } from '../models';
import type { MemoryDreamRunReq } from '../models';
import type { MemoryEntityGetListReq } from '../models';
import type { MemoryProfileGetOneReq } from '../models';
import type { MemoryRecordGetListReq } from '../models';
import type { MemoryTraceGetListReq } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiCloneMemoryArchivesGetList200Response } from '../models';
import type { PostApiV1AiCloneMemoryDreamRun200Response } from '../models';
import type { PostApiV1AiCloneMemoryDreamRunsGetList200Response } from '../models';
import type { PostApiV1AiCloneMemoryEntitiesGetList200Response } from '../models';
import type { PostApiV1AiCloneMemoryProfileGetOne200Response } from '../models';
import type { PostApiV1AiCloneMemoryRecordsGetList200Response } from '../models';
import type { PostApiV1AiCloneMemorySearch200Response } from '../models';
import type { PostApiV1AiCloneMemoryTracesGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiCloneMemoryApi - axios parameter creator
 */

/**
* 业务说明：分页查询指定分身的记忆归档记录，支持按归档原因过滤。用于查看已归档的记忆数据。
* @summary 获取归档记录列表
* @param {MemoryArchiveGetListReq} memoryArchiveGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryArchivesGetList (
memoryArchiveGetListReq: MemoryArchiveGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/archives/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneMemoryArchivesGetList200Response>>(localVarPath, memoryArchiveGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：对分身的记忆库执行压缩操作，将多个低重要性记忆合并为摘要，释放存储空间。压缩后记忆数量减少，关键信息保留。用于长期记忆管理、性能优化等场景。
* @summary 压缩记忆
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryCompact (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/compact`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：向分身的记忆库添加新的记忆条目，记录用户事实、偏好、事件等。可指定记忆类型、关键词、重要性评分。添加后的记忆将在后续对话中被检索使用，增强个性化体验。
* @summary 添加记忆
* @param {CloneMemoryAddReq} cloneMemoryAddReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryCreate (
cloneMemoryAddReq: CloneMemoryAddReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, cloneMemoryAddReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除分身记忆库中的指定记忆条目。删除后该记忆不再参与后续对话检索。用于清理错误记忆、过时信息等。删除操作不可恢复。
* @summary 删除记忆
* @param {CloneMemoryDeleteReq} cloneMemoryDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryDelete (
cloneMemoryDeleteReq: CloneMemoryDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, cloneMemoryDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：手动触发指定分身的 Dream 记忆整理流程，将 L1 记录压缩为 L2 摘要并归档已处理记录。用于记忆维护和调试。
* @summary 手动触发 Dream 整理
* @param {MemoryDreamRunReq} memoryDreamRunReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryDreamRun (
memoryDreamRunReq: MemoryDreamRunReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/dream/run`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneMemoryDreamRun200Response>>(localVarPath, memoryDreamRunReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询指定分身的 Dream 运行历史，支持按状态过滤。用于查看记忆整理的历史记录和调试。
* @summary 获取 Dream 运行记录列表
* @param {MemoryDreamRunGetListReq} memoryDreamRunGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryDreamRunsGetList (
memoryDreamRunGetListReq: MemoryDreamRunGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/dream-runs/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneMemoryDreamRunsGetList200Response>>(localVarPath, memoryDreamRunGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询指定分身的记忆实体关联，支持按实体类型、实体键过滤。用于查看记忆中提取的实体信息。
* @summary 获取记忆实体列表
* @param {MemoryEntityGetListReq} memoryEntityGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryEntitiesGetList (
memoryEntityGetListReq: MemoryEntityGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/entities/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneMemoryEntitiesGetList200Response>>(localVarPath, memoryEntityGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定分身的长期记忆画像，返回画像摘要文本。画像由 Dream 整理自动生成，反映用户的长期偏好和特征。
* @summary 获取记忆画像
* @param {MemoryProfileGetOneReq} memoryProfileGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryProfileGetOne (
memoryProfileGetOneReq: MemoryProfileGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/profile/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneMemoryProfileGetOne200Response>>(localVarPath, memoryProfileGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询指定分身的记忆记录，支持按层级、类别、状态、关键词过滤。用于记忆管理页面查看和调试。
* @summary 获取记忆记录列表
* @param {MemoryRecordGetListReq} memoryRecordGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryRecordsGetList (
memoryRecordGetListReq: MemoryRecordGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/records/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneMemoryRecordsGetList200Response>>(localVarPath, memoryRecordGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：在分身的记忆库中搜索相关记忆，支持按关键词、记忆类型过滤。返回匹配的记忆列表，按重要性排序。用于AI对话时检索相关上下文、用户查看记忆等场景。记忆类型包括fact/preference/event/summary。
* @summary 搜索记忆
* @param {CloneMemorySearchReq} cloneMemorySearchReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemorySearch (
cloneMemorySearchReq: CloneMemorySearchReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/search`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneMemorySearch200Response>>(localVarPath, cloneMemorySearchReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询指定分身的记忆召回轨迹，支持按查询内容模糊搜索。用于调试记忆召回效果。
* @summary 获取召回轨迹列表
* @param {MemoryTraceGetListReq} memoryTraceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneMemoryTracesGetList (
memoryTraceGetListReq: MemoryTraceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/memory/traces/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneMemoryTracesGetList200Response>>(localVarPath, memoryTraceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiCloneMemoryArchivesGetList operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryArchivesGetListRequest {
    readonly memoryArchiveGetListReq: MemoryArchiveGetListReq
}

/**
 * Request parameters for postApiV1AiCloneMemoryCompact operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryCompactRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneMemoryCreate operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryCreateRequest {
    readonly cloneMemoryAddReq: CloneMemoryAddReq
}

/**
 * Request parameters for postApiV1AiCloneMemoryDelete operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryDeleteRequest {
    readonly cloneMemoryDeleteReq: CloneMemoryDeleteReq
}

/**
 * Request parameters for postApiV1AiCloneMemoryDreamRun operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryDreamRunRequest {
    readonly memoryDreamRunReq: MemoryDreamRunReq
}

/**
 * Request parameters for postApiV1AiCloneMemoryDreamRunsGetList operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryDreamRunsGetListRequest {
    readonly memoryDreamRunGetListReq: MemoryDreamRunGetListReq
}

/**
 * Request parameters for postApiV1AiCloneMemoryEntitiesGetList operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryEntitiesGetListRequest {
    readonly memoryEntityGetListReq: MemoryEntityGetListReq
}

/**
 * Request parameters for postApiV1AiCloneMemoryProfileGetOne operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryProfileGetOneRequest {
    readonly memoryProfileGetOneReq: MemoryProfileGetOneReq
}

/**
 * Request parameters for postApiV1AiCloneMemoryRecordsGetList operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryRecordsGetListRequest {
    readonly memoryRecordGetListReq: MemoryRecordGetListReq
}

/**
 * Request parameters for postApiV1AiCloneMemorySearch operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemorySearchRequest {
    readonly cloneMemorySearchReq: CloneMemorySearchReq
}

/**
 * Request parameters for postApiV1AiCloneMemoryTracesGetList operation in AiCloneMemoryApi.
 */
export interface AiCloneMemoryApiPostApiV1AiCloneMemoryTracesGetListRequest {
    readonly memoryTraceGetListReq: MemoryTraceGetListReq
}
