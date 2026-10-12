import type { OpLogGetListReq } from '../models';
import type { PostApiV1EnergyOplogGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * OplogApi - axios parameter creator
 */

/**
* 业务说明：分页查询预付费业务的操作日志，支持按房间、操作类型和时间范围过滤。用于管理员审计充值、退款、入住退房和控制操作。
* @summary 获取操作日志列表
* @param {OpLogGetListReq} opLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyOplogGetList (
opLogGetListReq: OpLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/oplog/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyOplogGetList200Response>>(localVarPath, opLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyOplogGetList operation in OplogApi.
 */
export interface OplogApiPostApiV1EnergyOplogGetListRequest {
    readonly opLogGetListReq: OpLogGetListReq
}
