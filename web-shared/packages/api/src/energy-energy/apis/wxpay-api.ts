import type { PostApiV1EnergyConfigUpdate200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * WxpayApi - axios parameter creator
 */

/**
* 业务说明：接收微信支付结果通知并驱动预付费充值订单入账。该接口无需用户鉴权，依赖微信签名校验保证安全。
* @summary 微信支付异步通知回调
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyWxpayNotify (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/wxpay/notify`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
