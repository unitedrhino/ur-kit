import type { AlarmEvaluateTriggerReq } from '../models';
import type { AlarmInfoCreateReq } from '../models';
import type { AlarmInfoGetListReq } from '../models';
import type { AlarmInfoStatusUpdateReq } from '../models';
import type { AlarmInfoUpdateReq } from '../models';
import type { AlarmInfoWithID } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateCreate200Response } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateDelete200Response } from '../models';
import type { PostApiV1ThingsAlarmInfoGetList200Response } from '../models';
import type { PostApiV1ThingsAlarmInfoGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAlarmInfoApi - axios parameter creator
 */

/**
* 创建告警规则
* @summary 创建告警规则
* @param {AlarmInfoCreateReq} alarmInfoCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmInfoCreate (
alarmInfoCreateReq: AlarmInfoCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateCreate200Response>>(localVarPath, alarmInfoCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除告警规则
* @summary 删除告警规则
* @param {AlarmInfoWithID} alarmInfoWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmInfoDelete (
alarmInfoWithID: AlarmInfoWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmInfoWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 手动触发评估
* @summary 手动触发评估
* @param {AlarmEvaluateTriggerReq} alarmEvaluateTriggerReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmInfoEvaluateTrigger (
alarmEvaluateTriggerReq: AlarmEvaluateTriggerReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/info/evaluate-trigger`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmEvaluateTriggerReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取告警规则列表
* @summary 获取告警规则列表
* @param {AlarmInfoGetListReq} alarmInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmInfoGetList (
alarmInfoGetListReq: AlarmInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmInfoGetList200Response>>(localVarPath, alarmInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取告警规则详情
* @summary 获取告警规则详情
* @param {AlarmInfoWithID} alarmInfoWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmInfoGetOne (
alarmInfoWithID: AlarmInfoWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmInfoGetOne200Response>>(localVarPath, alarmInfoWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新告警规则状态
* @summary 更新告警规则状态
* @param {AlarmInfoStatusUpdateReq} alarmInfoStatusUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmInfoStatusUpdate (
alarmInfoStatusUpdateReq: AlarmInfoStatusUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/info/status-update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmInfoStatusUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新告警规则
* @summary 更新告警规则
* @param {AlarmInfoUpdateReq} alarmInfoUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmInfoUpdate (
alarmInfoUpdateReq: AlarmInfoUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmInfoUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAlarmInfoCreate operation in ThingsAlarmInfoApi.
 */
export interface ThingsAlarmInfoApiPostApiV1ThingsAlarmInfoCreateRequest {
    readonly alarmInfoCreateReq: AlarmInfoCreateReq
}

/**
 * Request parameters for postApiV1ThingsAlarmInfoDelete operation in ThingsAlarmInfoApi.
 */
export interface ThingsAlarmInfoApiPostApiV1ThingsAlarmInfoDeleteRequest {
    readonly alarmInfoWithID: AlarmInfoWithID
}

/**
 * Request parameters for postApiV1ThingsAlarmInfoEvaluateTrigger operation in ThingsAlarmInfoApi.
 */
export interface ThingsAlarmInfoApiPostApiV1ThingsAlarmInfoEvaluateTriggerRequest {
    readonly alarmEvaluateTriggerReq: AlarmEvaluateTriggerReq
}

/**
 * Request parameters for postApiV1ThingsAlarmInfoGetList operation in ThingsAlarmInfoApi.
 */
export interface ThingsAlarmInfoApiPostApiV1ThingsAlarmInfoGetListRequest {
    readonly alarmInfoGetListReq: AlarmInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsAlarmInfoGetOne operation in ThingsAlarmInfoApi.
 */
export interface ThingsAlarmInfoApiPostApiV1ThingsAlarmInfoGetOneRequest {
    readonly alarmInfoWithID: AlarmInfoWithID
}

/**
 * Request parameters for postApiV1ThingsAlarmInfoStatusUpdate operation in ThingsAlarmInfoApi.
 */
export interface ThingsAlarmInfoApiPostApiV1ThingsAlarmInfoStatusUpdateRequest {
    readonly alarmInfoStatusUpdateReq: AlarmInfoStatusUpdateReq
}

/**
 * Request parameters for postApiV1ThingsAlarmInfoUpdate operation in ThingsAlarmInfoApi.
 */
export interface ThingsAlarmInfoApiPostApiV1ThingsAlarmInfoUpdateRequest {
    readonly alarmInfoUpdateReq: AlarmInfoUpdateReq
}
