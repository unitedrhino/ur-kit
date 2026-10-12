import type { AlarmEventDealReq } from '../models';
import type { AlarmEventFalseAlarmReq } from '../models';
import type { AlarmEventGetListReq } from '../models';
import type { AlarmEventStatReq } from '../models';
import type { AlarmEventWithID } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateDelete200Response } from '../models';
import type { PostApiV1ThingsAlarmEventGetList200Response } from '../models';
import type { PostApiV1ThingsAlarmEventGetOne200Response } from '../models';
import type { PostApiV1ThingsAlarmEventStat200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAlarmEventApi - axios parameter creator
 */

/**
* 处理告警事件
* @summary 处理告警事件
* @param {AlarmEventDealReq} alarmEventDealReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmEventDeal (
alarmEventDealReq: AlarmEventDealReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/event/deal`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmEventDealReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 标记误报
* @summary 标记误报
* @param {AlarmEventFalseAlarmReq} alarmEventFalseAlarmReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmEventFalseAlarm (
alarmEventFalseAlarmReq: AlarmEventFalseAlarmReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/event/false-alarm`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmEventFalseAlarmReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取告警事件列表
* @summary 获取告警事件列表
* @param {AlarmEventGetListReq} alarmEventGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmEventGetList (
alarmEventGetListReq: AlarmEventGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/event/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmEventGetList200Response>>(localVarPath, alarmEventGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取告警事件详情
* @summary 获取告警事件详情
* @param {AlarmEventWithID} alarmEventWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmEventGetOne (
alarmEventWithID: AlarmEventWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/event/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmEventGetOne200Response>>(localVarPath, alarmEventWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 告警事件统计
* @summary 告警事件统计
* @param {AlarmEventStatReq} alarmEventStatReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmEventStat (
alarmEventStatReq: AlarmEventStatReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/event/stat`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmEventStat200Response>>(localVarPath, alarmEventStatReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAlarmEventDeal operation in ThingsAlarmEventApi.
 */
export interface ThingsAlarmEventApiPostApiV1ThingsAlarmEventDealRequest {
    readonly alarmEventDealReq: AlarmEventDealReq
}

/**
 * Request parameters for postApiV1ThingsAlarmEventFalseAlarm operation in ThingsAlarmEventApi.
 */
export interface ThingsAlarmEventApiPostApiV1ThingsAlarmEventFalseAlarmRequest {
    readonly alarmEventFalseAlarmReq: AlarmEventFalseAlarmReq
}

/**
 * Request parameters for postApiV1ThingsAlarmEventGetList operation in ThingsAlarmEventApi.
 */
export interface ThingsAlarmEventApiPostApiV1ThingsAlarmEventGetListRequest {
    readonly alarmEventGetListReq: AlarmEventGetListReq
}

/**
 * Request parameters for postApiV1ThingsAlarmEventGetOne operation in ThingsAlarmEventApi.
 */
export interface ThingsAlarmEventApiPostApiV1ThingsAlarmEventGetOneRequest {
    readonly alarmEventWithID: AlarmEventWithID
}

/**
 * Request parameters for postApiV1ThingsAlarmEventStat operation in ThingsAlarmEventApi.
 */
export interface ThingsAlarmEventApiPostApiV1ThingsAlarmEventStatRequest {
    readonly alarmEventStatReq: AlarmEventStatReq
}
