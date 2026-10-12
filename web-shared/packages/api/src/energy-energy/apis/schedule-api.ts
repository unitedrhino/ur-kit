import type { PostApiV1EnergyConfigUpdate200Response } from '../models';
import type { PostApiV1EnergyDutyCreate200Response } from '../models';
import type { PostApiV1EnergyScheduleGetList200Response } from '../models';
import type { PostApiV1EnergyScheduleGetOne200Response } from '../models';
import type { Schedule } from '../models';
import type { ScheduleGetListReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ScheduleApi - axios parameter creator
 */

/**
* 业务说明：创建调度计划，登记计划名称、类型、周期、站所、负责人、开工/归结执行人与时间、提醒与注意事项等。
* @summary 创建调度计划
* @param {Schedule} schedule
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyScheduleCreate (
schedule: Schedule,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/schedule/create`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyDutyCreate200Response>>(localVarPath, schedule, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：软删除指定调度计划。
* @summary 删除调度计划
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyScheduleDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/schedule/delete`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询调度计划，支持按计划名称、站所、负责人、状态筛选。
* @summary 获取调度计划列表
* @param {ScheduleGetListReq} scheduleGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyScheduleGetList (
scheduleGetListReq: ScheduleGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/schedule/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyScheduleGetList200Response>>(localVarPath, scheduleGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据计划 ID 查询单个调度计划。
* @summary 获取调度计划详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyScheduleGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/schedule/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyScheduleGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新调度计划，支持部分更新。
* @summary 更新调度计划
* @param {Schedule} schedule
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyScheduleUpdate (
schedule: Schedule,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/schedule/update`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, schedule, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyScheduleCreate operation in ScheduleApi.
 */
export interface ScheduleApiPostApiV1EnergyScheduleCreateRequest {
    readonly schedule: Schedule
}

/**
 * Request parameters for postApiV1EnergyScheduleDelete operation in ScheduleApi.
 */
export interface ScheduleApiPostApiV1EnergyScheduleDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyScheduleGetList operation in ScheduleApi.
 */
export interface ScheduleApiPostApiV1EnergyScheduleGetListRequest {
    readonly scheduleGetListReq: ScheduleGetListReq
}

/**
 * Request parameters for postApiV1EnergyScheduleGetOne operation in ScheduleApi.
 */
export interface ScheduleApiPostApiV1EnergyScheduleGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyScheduleUpdate operation in ScheduleApi.
 */
export interface ScheduleApiPostApiV1EnergyScheduleUpdateRequest {
    readonly schedule: Schedule
}
