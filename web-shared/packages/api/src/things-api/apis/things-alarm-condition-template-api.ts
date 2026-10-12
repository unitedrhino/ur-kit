import type { AlarmConditionTemplateCreateReq } from '../models';
import type { AlarmConditionTemplateGetListReq } from '../models';
import type { AlarmConditionTemplateUpdateReq } from '../models';
import type { AlarmInfoWithID } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateCreate200Response } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateDelete200Response } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateGetList200Response } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAlarmConditionTemplateApi - axios parameter creator
 */

/**
* 创建触发条件模板
* @summary 创建触发条件模板
* @param {AlarmConditionTemplateCreateReq} alarmConditionTemplateCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmConditionTemplateCreate (
alarmConditionTemplateCreateReq: AlarmConditionTemplateCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/condition-template/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateCreate200Response>>(localVarPath, alarmConditionTemplateCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除触发条件模板
* @summary 删除触发条件模板
* @param {AlarmInfoWithID} alarmInfoWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmConditionTemplateDelete (
alarmInfoWithID: AlarmInfoWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/condition-template/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmInfoWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取触发条件模板列表
* @summary 获取触发条件模板列表
* @param {AlarmConditionTemplateGetListReq} alarmConditionTemplateGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmConditionTemplateGetList (
alarmConditionTemplateGetListReq: AlarmConditionTemplateGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/condition-template/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateGetList200Response>>(localVarPath, alarmConditionTemplateGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取触发条件模板详情
* @summary 获取触发条件模板详情
* @param {AlarmInfoWithID} alarmInfoWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmConditionTemplateGetOne (
alarmInfoWithID: AlarmInfoWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/condition-template/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateGetOne200Response>>(localVarPath, alarmInfoWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新触发条件模板
* @summary 更新触发条件模板
* @param {AlarmConditionTemplateUpdateReq} alarmConditionTemplateUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmConditionTemplateUpdate (
alarmConditionTemplateUpdateReq: AlarmConditionTemplateUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/condition-template/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, alarmConditionTemplateUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAlarmConditionTemplateCreate operation in ThingsAlarmConditionTemplateApi.
 */
export interface ThingsAlarmConditionTemplateApiPostApiV1ThingsAlarmConditionTemplateCreateRequest {
    readonly alarmConditionTemplateCreateReq: AlarmConditionTemplateCreateReq
}

/**
 * Request parameters for postApiV1ThingsAlarmConditionTemplateDelete operation in ThingsAlarmConditionTemplateApi.
 */
export interface ThingsAlarmConditionTemplateApiPostApiV1ThingsAlarmConditionTemplateDeleteRequest {
    readonly alarmInfoWithID: AlarmInfoWithID
}

/**
 * Request parameters for postApiV1ThingsAlarmConditionTemplateGetList operation in ThingsAlarmConditionTemplateApi.
 */
export interface ThingsAlarmConditionTemplateApiPostApiV1ThingsAlarmConditionTemplateGetListRequest {
    readonly alarmConditionTemplateGetListReq: AlarmConditionTemplateGetListReq
}

/**
 * Request parameters for postApiV1ThingsAlarmConditionTemplateGetOne operation in ThingsAlarmConditionTemplateApi.
 */
export interface ThingsAlarmConditionTemplateApiPostApiV1ThingsAlarmConditionTemplateGetOneRequest {
    readonly alarmInfoWithID: AlarmInfoWithID
}

/**
 * Request parameters for postApiV1ThingsAlarmConditionTemplateUpdate operation in ThingsAlarmConditionTemplateApi.
 */
export interface ThingsAlarmConditionTemplateApiPostApiV1ThingsAlarmConditionTemplateUpdateRequest {
    readonly alarmConditionTemplateUpdateReq: AlarmConditionTemplateUpdateReq
}
