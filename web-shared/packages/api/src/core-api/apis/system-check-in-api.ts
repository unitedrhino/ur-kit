import type { CheckInGetListReq } from '../models';
import type { PointLogAdjustReq } from '../models';
import type { PointLogGetListReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemCheckInDo200Response } from '../models';
import type { PostApiV1SystemCheckInGetList200Response } from '../models';
import type { PostApiV1SystemCheckInPointBalanceGet200Response } from '../models';
import type { PostApiV1SystemCheckInPointLogGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemCheckInApi - axios parameter creator
 */

/**
* 业务说明：用户每日签到获得积分奖励，支持连续签到额外奖励。返回本次签到获得积分、当前总积分、是否已签到状态。重复签到不获得积分但返回当前状态。
* @summary 用户签到
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCheckInDo (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/check-in/do`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCheckInDo200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询签到记录，支持按用户ID、时间范围筛选。管理员可查看所有用户签到记录，普通用户只能查看自己的记录。返回签到日期、是否连续、获得积分等信息。
* @summary 签到记录列表
* @param {CheckInGetListReq} checkInGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCheckInGetList (
checkInGetListReq: CheckInGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/check-in/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCheckInGetList200Response>>(localVarPath, checkInGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询当前登录用户的积分余额，用于个人中心、积分商城等场景展示用户积分状态。
* @summary 获取当前用户积分余额
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCheckInPointBalanceGet (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/check-in/point-balance/get`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCheckInPointBalanceGet200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：管理员手动调整用户积分，支持增加或扣减。调整记录会记入流水，来源标记为admin。用于积分补发、违规扣分、活动奖励等场景。调整备注必填。
* @summary 管理员调整积分
* @param {PointLogAdjustReq} pointLogAdjustReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCheckInPointLogAdjust (
pointLogAdjustReq: PointLogAdjustReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/check-in/point-log/adjust`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, pointLogAdjustReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询积分变动流水，支持按用户ID、来源类型、时间范围筛选。来源类型包括签到(checkIn)、管理员调整(admin)等。返回变动量、变动后余额、来源、备注等信息。
* @summary 积分流水列表
* @param {PointLogGetListReq} pointLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCheckInPointLogGetList (
pointLogGetListReq: PointLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/check-in/point-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCheckInPointLogGetList200Response>>(localVarPath, pointLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemCheckInDo operation in SystemCheckInApi.
 */
export interface SystemCheckInApiPostApiV1SystemCheckInDoRequest {
    readonly body: object
}

/**
 * Request parameters for postApiV1SystemCheckInGetList operation in SystemCheckInApi.
 */
export interface SystemCheckInApiPostApiV1SystemCheckInGetListRequest {
    readonly checkInGetListReq: CheckInGetListReq
}

/**
 * Request parameters for postApiV1SystemCheckInPointLogAdjust operation in SystemCheckInApi.
 */
export interface SystemCheckInApiPostApiV1SystemCheckInPointLogAdjustRequest {
    readonly pointLogAdjustReq: PointLogAdjustReq
}

/**
 * Request parameters for postApiV1SystemCheckInPointLogGetList operation in SystemCheckInApi.
 */
export interface SystemCheckInApiPostApiV1SystemCheckInPointLogGetListRequest {
    readonly pointLogGetListReq: PointLogGetListReq
}
