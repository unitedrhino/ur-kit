import type { AdminRechargeReq } from '../models';
import type { PostApiV1EnergyRechargeAdminRecharge200Response } from '../models';
import type { PostApiV1EnergyRechargeGetList200Response } from '../models';
import type { RechargeGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RechargeApi - axios parameter creator
 */

/**
* 业务说明：由管理员为指定房间账户执行人工代充值，直接增加余额并生成充值记录。用于线下收费或人工补录场景。
* @summary 管理员代充值
* @param {AdminRechargeReq} adminRechargeReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyRechargeAdminRecharge (
adminRechargeReq: AdminRechargeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/recharge/admin-recharge`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyRechargeAdminRecharge200Response>>(localVarPath, adminRechargeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询房间充值记录，支持按房间、充值方式、状态和时间范围过滤。用于管理员核对充值流水和支付状态。
* @summary 获取充值记录列表
* @param {RechargeGetListReq} rechargeGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyRechargeGetList (
rechargeGetListReq: RechargeGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/recharge/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyRechargeGetList200Response>>(localVarPath, rechargeGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyRechargeAdminRecharge operation in RechargeApi.
 */
export interface RechargeApiPostApiV1EnergyRechargeAdminRechargeRequest {
    readonly adminRechargeReq: AdminRechargeReq
}

/**
 * Request parameters for postApiV1EnergyRechargeGetList operation in RechargeApi.
 */
export interface RechargeApiPostApiV1EnergyRechargeGetListRequest {
    readonly rechargeGetListReq: RechargeGetListReq
}
