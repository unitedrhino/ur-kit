import type { PostApiV1EnergyRoomCheckOut200Response } from '../models';
import type { PostApiV1EnergyRoomGetSummary200Response } from '../models';
import type { RoomCheckOutReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoomApi - axios parameter creator
 */

/**
* 业务说明：执行房间退房，删除该房间绑定用户、软删除水电历史记录并清空预付费状态。
* @summary 房间退房
* @param {RoomCheckOutReq} roomCheckOutReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyRoomCheckOut (
roomCheckOutReq: RoomCheckOutReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/room/check-out`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyRoomCheckOut200Response>>(localVarPath, roomCheckOutReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：统计当前租户下房间账户的余额和入住概况，返回总房间数、欠费房间数以及水电余额汇总。用于预付费管理首页概览。
* @summary 房间余额汇总统计
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyRoomGetSummary (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/room/get-summary`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyRoomGetSummary200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyRoomCheckOut operation in RoomApi.
 */
export interface RoomApiPostApiV1EnergyRoomCheckOutRequest {
    readonly roomCheckOutReq: RoomCheckOutReq
}

/**
 * Request parameters for postApiV1EnergyRoomGetSummary operation in RoomApi.
 */
export interface RoomApiPostApiV1EnergyRoomGetSummaryRequest {
    readonly body: object
}
