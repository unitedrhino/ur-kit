import type { PostApiV1SaleDistributorWaterGetList200Response } from '../models';
import type { SaleDistributorWaterGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorWaterApi - axios parameter creator
 */

/**
* 按经销商、分佣状态、时间范围等条件分页查询销售流水列表
* @summary 获取经销商下面的销售流水列表
* @param {SaleDistributorWaterGetListReq} saleDistributorWaterGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorWaterGetList (
saleDistributorWaterGetListReq: SaleDistributorWaterGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/water/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorWaterGetList200Response>>(localVarPath, saleDistributorWaterGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorWaterGetList operation in SaleDistributorWaterApi.
 */
export interface SaleDistributorWaterApiPostApiV1SaleDistributorWaterGetListRequest {
    readonly saleDistributorWaterGetListReq: SaleDistributorWaterGetListReq
}
