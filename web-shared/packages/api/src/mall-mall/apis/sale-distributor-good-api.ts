import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';
import type { PostApiV1SaleDistributorGoodGetList200Response } from '../models';
import type { SaleDistributorGood } from '../models';
import type { SaleDistributorGoodGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorGoodApi - axios parameter creator
 */

/**
* 按经销商、商品类型等条件分页查询商品售价列表
* @summary 获取商品售价列表
* @param {SaleDistributorGoodGetListReq} saleDistributorGoodGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorGoodGetList (
saleDistributorGoodGetListReq: SaleDistributorGoodGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/good/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorGoodGetList200Response>>(localVarPath, saleDistributorGoodGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 调整经销商商品的零售价、批发价及上下架状态
* @summary 更新商品售价
* @param {SaleDistributorGood} saleDistributorGood
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorGoodUpdate (
saleDistributorGood: SaleDistributorGood,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/good/update`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, saleDistributorGood, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorGoodGetList operation in SaleDistributorGoodApi.
 */
export interface SaleDistributorGoodApiPostApiV1SaleDistributorGoodGetListRequest {
    readonly saleDistributorGoodGetListReq: SaleDistributorGoodGetListReq
}

/**
 * Request parameters for postApiV1SaleDistributorGoodUpdate operation in SaleDistributorGoodApi.
 */
export interface SaleDistributorGoodApiPostApiV1SaleDistributorGoodUpdateRequest {
    readonly saleDistributorGood: SaleDistributorGood
}
