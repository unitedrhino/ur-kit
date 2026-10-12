import type { Duty } from '../models';
import type { DutyGetListReq } from '../models';
import type { PostApiV1EnergyConfigUpdate200Response } from '../models';
import type { PostApiV1EnergyDutyCreate200Response } from '../models';
import type { PostApiV1EnergyDutyGetList200Response } from '../models';
import type { PostApiV1EnergyDutyGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * DutyApi - axios parameter creator
 */

/**
* 业务说明：创建值班排班记录，登记值班日期、值班人员、值班时间段、值班类型与替班人员。
* @summary 创建值班记录
* @param {Duty} duty
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyDutyCreate (
duty: Duty,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/duty/create`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyDutyCreate200Response>>(localVarPath, duty, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：软删除指定值班记录。
* @summary 删除值班记录
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyDutyDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/duty/delete`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询值班记录，支持按值班日期、值班人员、值班类型筛选。
* @summary 获取值班记录列表
* @param {DutyGetListReq} dutyGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyDutyGetList (
dutyGetListReq: DutyGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/duty/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyDutyGetList200Response>>(localVarPath, dutyGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据记录 ID 查询单个值班记录。
* @summary 获取值班记录详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyDutyGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/duty/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyDutyGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新值班排班记录，支持部分更新。
* @summary 更新值班记录
* @param {Duty} duty
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyDutyUpdate (
duty: Duty,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/duty/update`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, duty, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyDutyCreate operation in DutyApi.
 */
export interface DutyApiPostApiV1EnergyDutyCreateRequest {
    readonly duty: Duty
}

/**
 * Request parameters for postApiV1EnergyDutyDelete operation in DutyApi.
 */
export interface DutyApiPostApiV1EnergyDutyDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyDutyGetList operation in DutyApi.
 */
export interface DutyApiPostApiV1EnergyDutyGetListRequest {
    readonly dutyGetListReq: DutyGetListReq
}

/**
 * Request parameters for postApiV1EnergyDutyGetOne operation in DutyApi.
 */
export interface DutyApiPostApiV1EnergyDutyGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyDutyUpdate operation in DutyApi.
 */
export interface DutyApiPostApiV1EnergyDutyUpdateRequest {
    readonly duty: Duty
}
