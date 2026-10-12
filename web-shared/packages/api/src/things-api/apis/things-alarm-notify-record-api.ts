import type { AlarmNotifyRecordGetListReq } from '../models';
import type { AlarmNotifyRecordResendReq } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateDelete200Response } from '../models';
import type { PostApiV1ThingsAlarmNotifyRecordGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAlarmNotifyRecordApi - axios parameter creator
 */

/**
* 获取通知记录列表
* @summary 获取通知记录列表
* @param {AlarmNotifyRecordGetListReq} alarmNotifyRecordGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmNotifyRecordGetList (
alarmNotifyRecordGetListReq: AlarmNotifyRecordGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/notify-record/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmNotifyRecordGetList200Response>>(localVarPath, alarmNotifyRecordGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 重新发送通知
* @summary 重新发送通知
* @param {AlarmNotifyRecordResendReq} alarmNotifyRecordResendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmNotifyRecordResend (
alarmNotifyRecordResendReq: AlarmNotifyRecordResendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/notify-record/resend`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmNotifyRecordResendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAlarmNotifyRecordGetList operation in ThingsAlarmNotifyRecordApi.
 */
export interface ThingsAlarmNotifyRecordApiPostApiV1ThingsAlarmNotifyRecordGetListRequest {
    readonly alarmNotifyRecordGetListReq: AlarmNotifyRecordGetListReq
}

/**
 * Request parameters for postApiV1ThingsAlarmNotifyRecordResend operation in ThingsAlarmNotifyRecordApi.
 */
export interface ThingsAlarmNotifyRecordApiPostApiV1ThingsAlarmNotifyRecordResendRequest {
    readonly alarmNotifyRecordResendReq: AlarmNotifyRecordResendReq
}
