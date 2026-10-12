import type { DeptSyncJob } from '../models';
import type { DeptSyncJobExecuteReq } from '../models';
import type { DeptSyncJobGetListReq } from '../models';
import type { DeptSyncJobGetOneReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemDeptInfoCreate200Response } from '../models';
import type { PostApiV1SystemDeptSyncJobGetList200Response } from '../models';
import type { PostApiV1SystemDeptSyncJobGetOne200Response } from '../models';
import type { WithIDStr } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemDeptSyncJobApi - axios parameter creator
 */

/**
* 业务说明：创建部门同步任务配置。支持从钉钉、企业微信等第三方平台同步组织架构到系统，也支持从系统同步到下游平台。用于企业组织架构自动同步、减少手工维护。
* @summary 添加同步任务
* @param {DeptSyncJob} deptSyncJob
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptSyncJobCreate (
deptSyncJob: DeptSyncJob,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/sync-job/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDeptInfoCreate200Response>>(localVarPath, deptSyncJob, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除部门同步任务配置。删除后不再执行自动同步，不影响已同步的数据。用于清理废弃同步配置、停止同步等场景。
* @summary 删除同步任务
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptSyncJobDelete (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/sync-job/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：手动触发部门同步任务执行。立即执行一次组织架构同步操作，用于初始化同步、增量同步、紧急修正等场景。执行结果可通过日志查看。
* @summary 执行同步任务
* @param {DeptSyncJobExecuteReq} deptSyncJobExecuteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptSyncJobExecute (
deptSyncJobExecuteReq: DeptSyncJobExecuteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/sync-job/execute`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, deptSyncJobExecuteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询部门同步任务列表，支持按父节点、名称、状态、同步方向筛选。用于同步任务管理页面展示、监控同步状态等场景。
* @summary 获取同步任务列表
* @param {DeptSyncJobGetListReq} deptSyncJobGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptSyncJobGetList (
deptSyncJobGetListReq: DeptSyncJobGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/sync-job/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDeptSyncJobGetList200Response>>(localVarPath, deptSyncJobGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个部门同步任务的完整配置信息。用于任务编辑、查看同步配置详情、调试诊断等场景。支持获取父级和子级任务。
* @summary 获取同步任务详情
* @param {DeptSyncJobGetOneReq} deptSyncJobGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptSyncJobGetOne (
deptSyncJobGetOneReq: DeptSyncJobGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/sync-job/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDeptSyncJobGetOne200Response>>(localVarPath, deptSyncJobGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改部门同步任务配置。可调整同步方向、第三方配置、字段映射、同步模式等参数。用于同步策略调整、配置修正等场景。
* @summary 更新同步任务
* @param {DeptSyncJob} deptSyncJob
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptSyncJobUpdate (
deptSyncJob: DeptSyncJob,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/sync-job/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, deptSyncJob, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemDeptSyncJobCreate operation in SystemDeptSyncJobApi.
 */
export interface SystemDeptSyncJobApiPostApiV1SystemDeptSyncJobCreateRequest {
    readonly deptSyncJob: DeptSyncJob
}

/**
 * Request parameters for postApiV1SystemDeptSyncJobDelete operation in SystemDeptSyncJobApi.
 */
export interface SystemDeptSyncJobApiPostApiV1SystemDeptSyncJobDeleteRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1SystemDeptSyncJobExecute operation in SystemDeptSyncJobApi.
 */
export interface SystemDeptSyncJobApiPostApiV1SystemDeptSyncJobExecuteRequest {
    readonly deptSyncJobExecuteReq: DeptSyncJobExecuteReq
}

/**
 * Request parameters for postApiV1SystemDeptSyncJobGetList operation in SystemDeptSyncJobApi.
 */
export interface SystemDeptSyncJobApiPostApiV1SystemDeptSyncJobGetListRequest {
    readonly deptSyncJobGetListReq: DeptSyncJobGetListReq
}

/**
 * Request parameters for postApiV1SystemDeptSyncJobGetOne operation in SystemDeptSyncJobApi.
 */
export interface SystemDeptSyncJobApiPostApiV1SystemDeptSyncJobGetOneRequest {
    readonly deptSyncJobGetOneReq: DeptSyncJobGetOneReq
}

/**
 * Request parameters for postApiV1SystemDeptSyncJobUpdate operation in SystemDeptSyncJobApi.
 */
export interface SystemDeptSyncJobApiPostApiV1SystemDeptSyncJobUpdateRequest {
    readonly deptSyncJob: DeptSyncJob
}
