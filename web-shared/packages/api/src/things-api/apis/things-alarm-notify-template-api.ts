import type { AlarmInfoWithID } from '../models';
import type { AlarmNotifyTemplateCreateReq } from '../models';
import type { AlarmNotifyTemplateGetListReq } from '../models';
import type { AlarmNotifyTemplateTestSendReq } from '../models';
import type { AlarmNotifyTemplateUpdateReq } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateCreate200Response } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateDelete200Response } from '../models';
import type { PostApiV1ThingsAlarmNotifyTemplateGetList200Response } from '../models';
import type { PostApiV1ThingsAlarmNotifyTemplateGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAlarmNotifyTemplateApi - axios parameter creator
 */

/**
* 创建通知内容模板
* @summary 创建通知内容模板
* @param {AlarmNotifyTemplateCreateReq} alarmNotifyTemplateCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmNotifyTemplateCreate (
alarmNotifyTemplateCreateReq: AlarmNotifyTemplateCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/notify-template/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateCreate200Response>>(localVarPath, alarmNotifyTemplateCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除通知内容模板
* @summary 删除通知内容模板
* @param {AlarmInfoWithID} alarmInfoWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmNotifyTemplateDelete (
alarmInfoWithID: AlarmInfoWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/notify-template/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmInfoWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取通知内容模板列表
* @summary 获取通知内容模板列表
* @param {AlarmNotifyTemplateGetListReq} alarmNotifyTemplateGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmNotifyTemplateGetList (
alarmNotifyTemplateGetListReq: AlarmNotifyTemplateGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/notify-template/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmNotifyTemplateGetList200Response>>(localVarPath, alarmNotifyTemplateGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取通知内容模板详情
* @summary 获取通知内容模板详情
* @param {AlarmInfoWithID} alarmInfoWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmNotifyTemplateGetOne (
alarmInfoWithID: AlarmInfoWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/notify-template/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmNotifyTemplateGetOne200Response>>(localVarPath, alarmInfoWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 测试发送通知
* @summary 测试发送通知
* @param {AlarmNotifyTemplateTestSendReq} alarmNotifyTemplateTestSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmNotifyTemplateTestSend (
alarmNotifyTemplateTestSendReq: AlarmNotifyTemplateTestSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/notify-template/test-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmNotifyTemplateTestSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新通知内容模板
* @summary 更新通知内容模板
* @param {AlarmNotifyTemplateUpdateReq} alarmNotifyTemplateUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmNotifyTemplateUpdate (
alarmNotifyTemplateUpdateReq: AlarmNotifyTemplateUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/notify-template/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmNotifyTemplateUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAlarmNotifyTemplateCreate operation in ThingsAlarmNotifyTemplateApi.
 */
export interface ThingsAlarmNotifyTemplateApiPostApiV1ThingsAlarmNotifyTemplateCreateRequest {
    readonly alarmNotifyTemplateCreateReq: AlarmNotifyTemplateCreateReq
}

/**
 * Request parameters for postApiV1ThingsAlarmNotifyTemplateDelete operation in ThingsAlarmNotifyTemplateApi.
 */
export interface ThingsAlarmNotifyTemplateApiPostApiV1ThingsAlarmNotifyTemplateDeleteRequest {
    readonly alarmInfoWithID: AlarmInfoWithID
}

/**
 * Request parameters for postApiV1ThingsAlarmNotifyTemplateGetList operation in ThingsAlarmNotifyTemplateApi.
 */
export interface ThingsAlarmNotifyTemplateApiPostApiV1ThingsAlarmNotifyTemplateGetListRequest {
    readonly alarmNotifyTemplateGetListReq: AlarmNotifyTemplateGetListReq
}

/**
 * Request parameters for postApiV1ThingsAlarmNotifyTemplateGetOne operation in ThingsAlarmNotifyTemplateApi.
 */
export interface ThingsAlarmNotifyTemplateApiPostApiV1ThingsAlarmNotifyTemplateGetOneRequest {
    readonly alarmInfoWithID: AlarmInfoWithID
}

/**
 * Request parameters for postApiV1ThingsAlarmNotifyTemplateTestSend operation in ThingsAlarmNotifyTemplateApi.
 */
export interface ThingsAlarmNotifyTemplateApiPostApiV1ThingsAlarmNotifyTemplateTestSendRequest {
    readonly alarmNotifyTemplateTestSendReq: AlarmNotifyTemplateTestSendReq
}

/**
 * Request parameters for postApiV1ThingsAlarmNotifyTemplateUpdate operation in ThingsAlarmNotifyTemplateApi.
 */
export interface ThingsAlarmNotifyTemplateApiPostApiV1ThingsAlarmNotifyTemplateUpdateRequest {
    readonly alarmNotifyTemplateUpdateReq: AlarmNotifyTemplateUpdateReq
}
