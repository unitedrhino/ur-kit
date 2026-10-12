import type { CRoomGetOneReq } from '../models';
import type { PostApiV1EnergyCRoomGetList200Response } from '../models';
import type { PostApiV1EnergyCRoomGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CRoomApi - axios parameter creator
 */

/**
* 业务说明：查询当前租客绑定的房间列表，返回房间名称、路径和余额概况。用于租客切换房间。
* @summary 租客绑定的房间列表
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyCRoomGetList (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/c/room/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyCRoomGetList200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询租客端单个房间的余额、读数、本月用量和近期消费记录。用于租客查看房间账户详情。
* @summary 房间详情（余额+读数+本月用量+近期消费）
* @param {CRoomGetOneReq} cRoomGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyCRoomGetOne (
cRoomGetOneReq: CRoomGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/c/room/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyCRoomGetOne200Response>>(localVarPath, cRoomGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyCRoomGetOne operation in CRoomApi.
 */
export interface CRoomApiPostApiV1EnergyCRoomGetOneRequest {
    readonly cRoomGetOneReq: CRoomGetOneReq
}
