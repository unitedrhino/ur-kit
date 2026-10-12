import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemJobTaskGroupGetList200Response } from '../models';
import type { PostApiV1SystemJobTaskGroupGetOne200Response } from '../models';
import type { PostApiV1SystemJobTaskInfoCreate200Response } from '../models';
import type { PostApiV1SystemJobTaskInfoGetList200Response } from '../models';
import type { PostApiV1SystemJobTaskSend200Response } from '../models';
import type { TimedTaskGroup } from '../models';
import type { TimedTaskGroupGetListReq } from '../models';
import type { TimedTaskInfo } from '../models';
import type { TimedTaskInfoGetListReq } from '../models';
import type { TimedTaskSendReq } from '../models';
import type { TimedTaskWithTaskID } from '../models';
import type { WithCode } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemJobTaskApi - axios parameter creator
 */

/**
* 业务说明：取消正在等待执行的定时或延时任务。用于业务流程中断、用户主动取消等场景，任务取消后不会执行预定操作。
* @summary 取消执行任务
* @param {TimedTaskWithTaskID} timedTaskWithTaskID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskCancel (
timedTaskWithTaskID: TimedTaskWithTaskID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/cancel`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, timedTaskWithTaskID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建任务分组用于组织管理相关任务。分组可按业务模块、执行类型等维度划分，便于批量管理和权限控制。
* @summary 新建任务分组
* @param {TimedTaskGroup} timedTaskGroup
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskGroupCreate (
timedTaskGroup: TimedTaskGroup,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/group/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, timedTaskGroup, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除任务分组。分组下存在任务时需先迁移或删除任务才能成功删除分组。用于清理废弃的业务分类。
* @summary 删除任务分组
* @param {WithCode} withCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskGroupDelete (
withCode: WithCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/group/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询任务分组列表，支持按名称和状态筛选。用于分组选择器、管理页面等场景。返回分页结果包含分组基本信息。
* @summary 获取任务分组列表
* @param {TimedTaskGroupGetListReq} timedTaskGroupGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskGroupGetList (
timedTaskGroupGetListReq: TimedTaskGroupGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/group/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemJobTaskGroupGetList200Response>>(localVarPath, timedTaskGroupGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个任务分组的完整信息。用于分组编辑、查看分组下任务统计等场景。
* @summary 获取任务分组详情
* @param {WithCode} withCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskGroupGetOne (
withCode: WithCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/group/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemJobTaskGroupGetOne200Response>>(localVarPath, withCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改任务分组的基本信息（名称、状态、描述等）。分组下的任务不受影响继续正常运行。
* @summary 更新任务分组
* @param {TimedTaskGroup} timedTaskGroup
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskGroupUpdate (
timedTaskGroup: TimedTaskGroup,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/group/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, timedTaskGroup, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建新的定时任务定义。支持Cron定时任务和延时任务两种类型。用于周期性报表生成、定时数据同步、定期清理等场景。
* @summary 创建任务
* @param {TimedTaskInfo} timedTaskInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskInfoCreate (
timedTaskInfo: TimedTaskInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemJobTaskInfoCreate200Response>>(localVarPath, timedTaskInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除定时任务定义。删除后任务将不再执行，历史执行记录保留。用于清理废弃任务、业务功能下线等场景。
* @summary 删除任务
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询定时任务列表，支持按分组、名称、类型、状态筛选。用于任务管理页面展示、监控仪表盘等场景。返回分页结果包含任务基本信息和执行统计。
* @summary 获取任务列表
* @param {TimedTaskInfoGetListReq} timedTaskInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskInfoGetList (
timedTaskInfoGetListReq: TimedTaskInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemJobTaskInfoGetList200Response>>(localVarPath, timedTaskInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个定时任务的完整配置信息。包括执行周期、参数、重试策略、执行历史等详细属性。用于任务编辑、调试诊断等场景。
* @summary 获取任务详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskInfoGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemJobTaskInfoCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：启动已停止的定时任务。任务启动后按配置的执行周期自动运行。用于恢复暂停的周期性业务流程。
* @summary 启动任务
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskInfoStart (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/info/start`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：暂停正在运行的定时任务。任务停止后不再自动执行，但保留任务定义可随时重新启动。用于临时中断周期性业务、维护窗口等场景。
* @summary 停止任务
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskInfoStop (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/info/stop`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改已存在的定时任务配置。可调整执行时间、参数、重试策略等属性。任务运行中更新时需注意状态兼容性。
* @summary 更新任务
* @param {TimedTaskInfo} timedTaskInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskInfoUpdate (
timedTaskInfo: TimedTaskInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, timedTaskInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：发送延时任务请求，如果任务不存在会自动创建。用于需要延迟执行的业务场景，如定时推送、延时提醒等。自动创建的任务需填写param参数。
* @summary 发送延时请求
* @param {TimedTaskSendReq} timedTaskSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemJobTaskSend (
timedTaskSendReq: TimedTaskSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/job/task/send`;
    return requestClient.post<ExtractDataType<PostApiV1SystemJobTaskSend200Response>>(localVarPath, timedTaskSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemJobTaskCancel operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskCancelRequest {
    readonly timedTaskWithTaskID: TimedTaskWithTaskID
}

/**
 * Request parameters for postApiV1SystemJobTaskGroupCreate operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskGroupCreateRequest {
    readonly timedTaskGroup: TimedTaskGroup
}

/**
 * Request parameters for postApiV1SystemJobTaskGroupDelete operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskGroupDeleteRequest {
    readonly withCode: WithCode
}

/**
 * Request parameters for postApiV1SystemJobTaskGroupGetList operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskGroupGetListRequest {
    readonly timedTaskGroupGetListReq: TimedTaskGroupGetListReq
}

/**
 * Request parameters for postApiV1SystemJobTaskGroupGetOne operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskGroupGetOneRequest {
    readonly withCode: WithCode
}

/**
 * Request parameters for postApiV1SystemJobTaskGroupUpdate operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskGroupUpdateRequest {
    readonly timedTaskGroup: TimedTaskGroup
}

/**
 * Request parameters for postApiV1SystemJobTaskInfoCreate operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskInfoCreateRequest {
    readonly timedTaskInfo: TimedTaskInfo
}

/**
 * Request parameters for postApiV1SystemJobTaskInfoDelete operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemJobTaskInfoGetList operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskInfoGetListRequest {
    readonly timedTaskInfoGetListReq: TimedTaskInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemJobTaskInfoGetOne operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskInfoGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemJobTaskInfoStart operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskInfoStartRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemJobTaskInfoStop operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskInfoStopRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemJobTaskInfoUpdate operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskInfoUpdateRequest {
    readonly timedTaskInfo: TimedTaskInfo
}

/**
 * Request parameters for postApiV1SystemJobTaskSend operation in SystemJobTaskApi.
 */
export interface SystemJobTaskApiPostApiV1SystemJobTaskSendRequest {
    readonly timedTaskSendReq: TimedTaskSendReq
}
