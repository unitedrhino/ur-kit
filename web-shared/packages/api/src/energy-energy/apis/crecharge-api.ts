import type { COrderStatusReq } from '../models';
import type { CRechargeCreateReq } from '../models';
import type { PostApiV1EnergyCRechargeCreateOrder200Response } from '../models';
import type { PostApiV1EnergyCRechargeGetOrderStatus200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CRechargeApi - axios parameter creator
 */

/**
* 业务说明：为租客端指定房间创建一笔待支付充值订单，并返回微信支付所需参数。用于租客发起电费或水费在线充值。
* @summary 创建充值订单（调起微信支付前）
* @param {CRechargeCreateReq} cRechargeCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyCRechargeCreateOrder (
cRechargeCreateReq: CRechargeCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/c/recharge/create-order`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyCRechargeCreateOrder200Response>>(localVarPath, cRechargeCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询租客端充值订单的支付状态和充值后余额，用于前端轮询确认支付结果。
* @summary 查询充值订单状态（前端轮询）
* @param {COrderStatusReq} cOrderStatusReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyCRechargeGetOrderStatus (
cOrderStatusReq: COrderStatusReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/c/recharge/get-order-status`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyCRechargeGetOrderStatus200Response>>(localVarPath, cOrderStatusReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyCRechargeCreateOrder operation in CRechargeApi.
 */
export interface CRechargeApiPostApiV1EnergyCRechargeCreateOrderRequest {
    readonly cRechargeCreateReq: CRechargeCreateReq
}

/**
 * Request parameters for postApiV1EnergyCRechargeGetOrderStatus operation in CRechargeApi.
 */
export interface CRechargeApiPostApiV1EnergyCRechargeGetOrderStatusRequest {
    readonly cOrderStatusReq: COrderStatusReq
}
