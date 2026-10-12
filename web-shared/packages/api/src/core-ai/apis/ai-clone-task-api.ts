import type { CloneTaskCreateReq } from '../models';
import type { CloneTaskGetListReq } from '../models';
import type { CloneTaskGetRunsReq } from '../models';
import type { CloneTaskUpdateReq } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiCloneTaskGetList200Response } from '../models';
import type { PostApiV1AiCloneTaskGetOne200Response } from '../models';
import type { PostApiV1AiCloneTaskGetRuns200Response } from '../models';
import type { PostApiV1AiCloneTaskGetSubscribeTopics200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiCloneTaskApi - axios parameter creator
 */

/**
* 业务说明：创建clone任务，支持AI运行和工具运行两种类型。每个任务必须绑定一个Clone，执行时使用该Clone的环境配置。调度类型支持:非定时(none)、单次执行(once)、每间隔(interval)、每天(daily)、每周(weekly)。
* @summary 创建clone任务
* @param {CloneTaskCreateReq} cloneTaskCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskCreate (
cloneTaskCreateReq: CloneTaskCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, cloneTaskCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的clone任务。删除后关联的执行日志保留，不会被删除。
* @summary 删除clone任务
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询clone任务列表，支持按CloneGroup、Clone、Agent、任务类型、调度类型过滤。返回结果按创建时间倒序排列。
* @summary 获取clone任务列表
* @param {CloneTaskGetListReq} cloneTaskGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskGetList (
cloneTaskGetListReq: CloneTaskGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneTaskGetList200Response>>(localVarPath, cloneTaskGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据任务ID查询完整信息，包括调度配置、执行记录摘要等。
* @summary 获取clone任务详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneTaskGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询指定任务的执行日志，包括执行时间、状态、输入输出、错误信息等。返回结果按执行时间倒序排列。
* @summary 获取clone任务执行日志
* @param {CloneTaskGetRunsReq} cloneTaskGetRunsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskGetRuns (
cloneTaskGetRunsReq: CloneTaskGetRunsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/get-runs`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneTaskGetRuns200Response>>(localVarPath, cloneTaskGetRunsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取系统预置的订阅消息主题清单，供前端下拉选择。返回结果只包含主题编码和描述名称。
* @summary 获取订阅主题列表
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskGetSubscribeTopics (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/get-subscribe-topics`;
    return requestClient.post<ExtractDataType<PostApiV1AiCloneTaskGetSubscribeTopics200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：立即执行一次指定的clone任务，不受调度规则限制。执行结果会记录到执行日志中。
* @summary 手动触发clone任务
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskRun (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/run`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：启用指定的clone任务。启用后会重新计算下次执行时间。
* @summary 启用clone任务
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskStart (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/start`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：禁用指定的clone任务。禁用后任务不会被自动触发，但仍可手动触发。
* @summary 禁用clone任务
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskStop (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/stop`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新clone任务的名称、描述、提示词、工具入参、调度配置等。部分更新，空值字段不修改。修改调度配置后会重新计算下次执行时间。
* @summary 更新clone任务
* @param {CloneTaskUpdateReq} cloneTaskUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiCloneTaskUpdate (
cloneTaskUpdateReq: CloneTaskUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/clone-task/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, cloneTaskUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiCloneTaskCreate operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskCreateRequest {
    readonly cloneTaskCreateReq: CloneTaskCreateReq
}

/**
 * Request parameters for postApiV1AiCloneTaskDelete operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneTaskGetList operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskGetListRequest {
    readonly cloneTaskGetListReq: CloneTaskGetListReq
}

/**
 * Request parameters for postApiV1AiCloneTaskGetOne operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneTaskGetRuns operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskGetRunsRequest {
    readonly cloneTaskGetRunsReq: CloneTaskGetRunsReq
}

/**
 * Request parameters for postApiV1AiCloneTaskRun operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskRunRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneTaskStart operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskStartRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneTaskStop operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskStopRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiCloneTaskUpdate operation in AiCloneTaskApi.
 */
export interface AiCloneTaskApiPostApiV1AiCloneTaskUpdateRequest {
    readonly cloneTaskUpdateReq: CloneTaskUpdateReq
}
