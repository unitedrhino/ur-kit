import type { PostApiV1SaleDistributorOrderGetList200Response } from '../models';
import type { SaleDistributorOrderGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorOrderApi - axios parameter creator
 */

/**
* 按经销商、订单状态、时间范围等条件分页查询销售订单列表
* @summary 获取经销商下面的销售订单列表
* @param {SaleDistributorOrderGetListReq} saleDistributorOrderGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorOrderGetList (
saleDistributorOrderGetListReq: SaleDistributorOrderGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/order/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorOrderGetList200Response>>(localVarPath, saleDistributorOrderGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorOrderGetList operation in SaleDistributorOrderApi.
 */
export interface SaleDistributorOrderApiPostApiV1SaleDistributorOrderGetListRequest {
    readonly saleDistributorOrderGetListReq: SaleDistributorOrderGetListReq
}
