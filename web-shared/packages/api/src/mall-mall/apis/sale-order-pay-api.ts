import type { PostApiV1SaleOrderPayNotifyTenantCodeAppCodePayType200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleOrderPayApi - axios parameter creator
 */

/**
* 支付回调
* @summary 支付回调
* @param {string} tenantCode
* @param {string} appCode
* @param {string} payType
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleOrderPayNotifyTenantCodeAppCodePayType (
tenantCode: string,
appCode: string,
payType: string,
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/order/pay/notify/{tenantCode}/{appCode}/{payType}`
    .replace(`{${"tenantCode"}}`, encodeURIComponent(String(tenantCode)))
    .replace(`{${"appCode"}}`, encodeURIComponent(String(appCode)))
    .replace(`{${"payType"}}`, encodeURIComponent(String(payType)));
    return requestClient.post<ExtractDataType<PostApiV1SaleOrderPayNotifyTenantCodeAppCodePayType200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleOrderPayNotifyTenantCodeAppCodePayType operation in SaleOrderPayApi.
 */
export interface SaleOrderPayApiPostApiV1SaleOrderPayNotifyTenantCodeAppCodePayTypeRequest {
    readonly tenantCode: string

    readonly appCode: string

    readonly payType: string

    readonly body: object
}
