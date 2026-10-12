import type { CloneSnapshotCreateReq } from '../models';
import type { CloneSnapshotDeleteReq } from '../models';
import type { CloneSnapshotGetListReq } from '../models';
import type { CloneSnapshotGetOneReq } from '../models';
import type { CloneSnapshotRestoreReq } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiCloneSnapshotCreate200Response } from '../models';
import type { PostApiV1AiCloneSnapshotGetList200Response } from '../models';
import type { PostApiV1AiCloneSnapshotGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiCloneSnapshotApi - axios parameter creator
 */

/**
* 业务说明：为分身创建状态快照，保存当前的记忆库状态、配置信息等。快照可用于备份、版本管理、故障恢复等场景。返回快照ID和校验和，可用于后续恢复操作。支持自动快照和手动快照。
* @summary 创建快照
* @param {CloneSnapshotCreateReq} cloneSnapshotCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneSnapshotCreate (
cloneSnapshotCreateReq: CloneSnapshotCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/snapshot/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneSnapshotCreate200Response>>(localVarPath, cloneSnapshotCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的分身快照记录及其存储数据。删除后该快照不可恢复。用于清理过期快照、释放存储空间等。删除前需确认快照不再需要。
* @summary 删除快照
* @param {CloneSnapshotDeleteReq} cloneSnapshotDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneSnapshotDelete (
cloneSnapshotDeleteReq: CloneSnapshotDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/snapshot/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, cloneSnapshotDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询指定分身的快照列表，返回所有历史快照记录。用于快照管理页面、版本历史查看等场景。返回结果按创建时间倒序排列。
* @summary 获取快照列表
* @param {CloneSnapshotGetListReq} cloneSnapshotGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneSnapshotGetList (
cloneSnapshotGetListReq: CloneSnapshotGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/snapshot/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneSnapshotGetList200Response>>(localVarPath, cloneSnapshotGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据快照ID查询完整的快照信息，包括分身ID、校验和、描述、大小、文件数量、创建时间等。用于快照详情查看、恢复前确认等场景。
* @summary 获取快照详情
* @param {CloneSnapshotGetOneReq} cloneSnapshotGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneSnapshotGetOne (
cloneSnapshotGetOneReq: CloneSnapshotGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/snapshot/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneSnapshotGetOne200Response>>(localVarPath, cloneSnapshotGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将分身恢复到指定快照时的状态，包括记忆库数据、配置信息等。恢复后当前状态被覆盖，不可回退。用于故障恢复、版本回退、实验回滚等场景。恢复前建议先创建当前状态快照。
* @summary 恢复快照
* @param {CloneSnapshotRestoreReq} cloneSnapshotRestoreReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneSnapshotRestore (
cloneSnapshotRestoreReq: CloneSnapshotRestoreReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone/snapshot/restore`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, cloneSnapshotRestoreReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiCloneSnapshotCreate operation in AiCloneSnapshotApi.
 */
export interface AiCloneSnapshotApiPostApiV1AiCloneSnapshotCreateRequest {
    readonly cloneSnapshotCreateReq: CloneSnapshotCreateReq
}

/**
 * Request parameters for postApiV1AiCloneSnapshotDelete operation in AiCloneSnapshotApi.
 */
export interface AiCloneSnapshotApiPostApiV1AiCloneSnapshotDeleteRequest {
    readonly cloneSnapshotDeleteReq: CloneSnapshotDeleteReq
}

/**
 * Request parameters for postApiV1AiCloneSnapshotGetList operation in AiCloneSnapshotApi.
 */
export interface AiCloneSnapshotApiPostApiV1AiCloneSnapshotGetListRequest {
    readonly cloneSnapshotGetListReq: CloneSnapshotGetListReq
}

/**
 * Request parameters for postApiV1AiCloneSnapshotGetOne operation in AiCloneSnapshotApi.
 */
export interface AiCloneSnapshotApiPostApiV1AiCloneSnapshotGetOneRequest {
    readonly cloneSnapshotGetOneReq: CloneSnapshotGetOneReq
}

/**
 * Request parameters for postApiV1AiCloneSnapshotRestore operation in AiCloneSnapshotApi.
 */
export interface AiCloneSnapshotApiPostApiV1AiCloneSnapshotRestoreRequest {
    readonly cloneSnapshotRestoreReq: CloneSnapshotRestoreReq
}
