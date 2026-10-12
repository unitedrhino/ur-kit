import type { PatrolPlan } from '../models';
import type { PatrolPlanGetListReq } from '../models';
import type { PatrolRecord } from '../models';
import type { PatrolRecordGetListReq } from '../models';
import type { PostApiV1EnergyConfigUpdate200Response } from '../models';
import type { PostApiV1EnergyDutyCreate200Response } from '../models';
import type { PostApiV1EnergyPatrolPatrolPlanGetList200Response } from '../models';
import type { PostApiV1EnergyPatrolPatrolPlanGetOne200Response } from '../models';
import type { PostApiV1EnergyPatrolPatrolRecordGetList200Response } from '../models';
import type { PostApiV1EnergyPatrolPatrolRecordGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * PatrolApi - axios parameter creator
 */

/**
* 业务说明：创建巡检计划，配置计划名称、内容、周期（日/周/月）、巡检人、生效日期与巡检时间。计划启用后由定时任务按周期自动生成巡检记录。
* @summary 创建巡检计划
* @param {PatrolPlan} patrolPlan
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolPlanCreate (
patrolPlan: PatrolPlan,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-plan/create`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyDutyCreate200Response>>(localVarPath, patrolPlan, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：软删除指定巡检计划。
* @summary 删除巡检计划
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolPlanDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-plan/delete`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询巡检计划列表，支持按计划名称、项目区域、启停状态筛选。
* @summary 获取巡检计划列表
* @param {PatrolPlanGetListReq} patrolPlanGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolPlanGetList (
patrolPlanGetListReq: PatrolPlanGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-plan/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyPatrolPatrolPlanGetList200Response>>(localVarPath, patrolPlanGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据计划 ID 查询单个巡检计划。
* @summary 获取巡检计划详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolPlanGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-plan/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyPatrolPatrolPlanGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新巡检计划信息，支持部分更新。修改启停状态、巡检人、周期等配置。
* @summary 更新巡检计划
* @param {PatrolPlan} patrolPlan
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolPlanUpdate (
patrolPlan: PatrolPlan,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-plan/update`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, patrolPlan, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建巡检记录，记录计划巡检时间与实际巡检时间、巡检结果与备注。也可由巡检人员在个人巡检页面提交巡检结果。
* @summary 创建巡检记录
* @param {PatrolRecord} patrolRecord
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolRecordCreate (
patrolRecord: PatrolRecord,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-record/create`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyDutyCreate200Response>>(localVarPath, patrolRecord, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：软删除指定巡检记录。
* @summary 删除巡检记录
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolRecordDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-record/delete`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询巡检记录，支持按计划名称、项目区域、巡检状态、巡检人筛选。普通用户通过 onlyMine 查看自己的巡检任务。
* @summary 获取巡检记录列表
* @param {PatrolRecordGetListReq} patrolRecordGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolRecordGetList (
patrolRecordGetListReq: PatrolRecordGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-record/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyPatrolPatrolRecordGetList200Response>>(localVarPath, patrolRecordGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据记录 ID 查询单个巡检记录。
* @summary 获取巡检记录详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolRecordGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-record/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyPatrolPatrolRecordGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新巡检记录，巡检人员处理巡检任务时记录实际巡检时间与巡检结果、巡检状态。
* @summary 更新巡检记录
* @param {PatrolRecord} patrolRecord
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyPatrolPatrolRecordUpdate (
patrolRecord: PatrolRecord,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/patrol/patrol-record/update`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, patrolRecord, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyPatrolPatrolPlanCreate operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolPlanCreateRequest {
    readonly patrolPlan: PatrolPlan
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolPlanDelete operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolPlanDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolPlanGetList operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolPlanGetListRequest {
    readonly patrolPlanGetListReq: PatrolPlanGetListReq
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolPlanGetOne operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolPlanGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolPlanUpdate operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolPlanUpdateRequest {
    readonly patrolPlan: PatrolPlan
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolRecordCreate operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolRecordCreateRequest {
    readonly patrolRecord: PatrolRecord
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolRecordDelete operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolRecordDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolRecordGetList operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolRecordGetListRequest {
    readonly patrolRecordGetListReq: PatrolRecordGetListReq
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolRecordGetOne operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolRecordGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyPatrolPatrolRecordUpdate operation in PatrolApi.
 */
export interface PatrolApiPostApiV1EnergyPatrolPatrolRecordUpdateRequest {
    readonly patrolRecord: PatrolRecord
}
