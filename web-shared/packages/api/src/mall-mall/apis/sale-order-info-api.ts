import type { OrderCreateReq } from '../models';
import type { OrderInfoGetListReq } from '../models';
import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';
import type { PostApiV1SaleOrderInfoCreate200Response } from '../models';
import type { PostApiV1SaleOrderInfoGetList200Response } from '../models';
import type { PostApiV1SaleOrderInfoGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleOrderInfoApi - axios parameter creator
 */

/**
* 创建订单
* @summary 创建订单
* @param {OrderCreateReq} orderCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleOrderInfoCreate (
orderCreateReq: OrderCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/order/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SaleOrderInfoCreate200Response>>(localVarPath, orderCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除订单
* @summary 删除订单
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleOrderInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/order/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取订单列表
* @summary 获取订单列表
* @param {OrderInfoGetListReq} orderInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleOrderInfoGetList (
orderInfoGetListReq: OrderInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/order/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleOrderInfoGetList200Response>>(localVarPath, orderInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取订单详情
* @summary 获取订单详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleOrderInfoGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/order/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SaleOrderInfoGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleOrderInfoCreate operation in SaleOrderInfoApi.
 */
export interface SaleOrderInfoApiPostApiV1SaleOrderInfoCreateRequest {
    readonly orderCreateReq: OrderCreateReq
}

/**
 * Request parameters for postApiV1SaleOrderInfoDelete operation in SaleOrderInfoApi.
 */
export interface SaleOrderInfoApiPostApiV1SaleOrderInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SaleOrderInfoGetList operation in SaleOrderInfoApi.
 */
export interface SaleOrderInfoApiPostApiV1SaleOrderInfoGetListRequest {
    readonly orderInfoGetListReq: OrderInfoGetListReq
}

/**
 * Request parameters for postApiV1SaleOrderInfoGetOne operation in SaleOrderInfoApi.
 */
export interface SaleOrderInfoApiPostApiV1SaleOrderInfoGetOneRequest {
    readonly withID: WithID
}
