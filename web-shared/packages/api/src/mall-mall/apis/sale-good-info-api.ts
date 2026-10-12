import type { ClientGoodInfoGetListReq } from '../models';
import type { GoodInfoGetListReq } from '../models';
import type { GoodInfoGetOneReq } from '../models';
import type { GoodInfoOfferReq } from '../models';
import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';
import type { PostApiV1SaleGoodInfoClientGetList200Response } from '../models';
import type { PostApiV1SaleGoodInfoCreate200Response } from '../models';
import type { PostApiV1SaleGoodInfoGetOne200Response } from '../models';
import type { SaleGoodInfo } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleGoodInfoApi - axios parameter creator
 */

/**
* 面向C端用户，根据设备信息查询其可购买的商品及套餐列表。
* @summary c端获取商品列表
* @param {ClientGoodInfoGetListReq} clientGoodInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleGoodInfoClientGetList (
clientGoodInfoGetListReq: ClientGoodInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/good/info/client/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleGoodInfoClientGetList200Response>>(localVarPath, clientGoodInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 创建新的商品记录，支持实物商品、虚拟商品及设备/用户套餐等多种类型。
* @summary 创建商品信息
* @param {SaleGoodInfo} saleGoodInfo  商品信息表
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleGoodInfoCreate (
saleGoodInfo: SaleGoodInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/good/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SaleGoodInfoCreate200Response>>(localVarPath, saleGoodInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据商品ID删除指定商品记录。
* @summary 删除商品
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleGoodInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/good/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按条件分页查询商品列表，支持按商品名称、类型、子类型、套餐类型、上架状态、平台销售状态等维度过滤。
* @summary 获取商品列表
* @param {GoodInfoGetListReq} goodInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleGoodInfoGetList (
goodInfoGetListReq: GoodInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/good/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleGoodInfoClientGetList200Response>>(localVarPath, goodInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据商品ID查询单个商品的完整信息。
* @summary 获取商品详情
* @param {GoodInfoGetOneReq} goodInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleGoodInfoGetOne (
goodInfoGetOneReq: GoodInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/good/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SaleGoodInfoGetOne200Response>>(localVarPath, goodInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 将指定商品免费赠送给某个设备或用户，通常用于运营活动或补偿场景。
* @summary 将商品免费赠与某人
* @param {GoodInfoOfferReq} goodInfoOfferReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleGoodInfoOffer (
goodInfoOfferReq: GoodInfoOfferReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/good/info/offer`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, goodInfoOfferReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改商品的名称、售价、套餐内容、上下架状态、适用范围等基础信息。
* @summary 更新商品信息
* @param {SaleGoodInfo} saleGoodInfo  商品信息表
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleGoodInfoUpdate (
saleGoodInfo: SaleGoodInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/good/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, saleGoodInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleGoodInfoClientGetList operation in SaleGoodInfoApi.
 */
export interface SaleGoodInfoApiPostApiV1SaleGoodInfoClientGetListRequest {
    readonly clientGoodInfoGetListReq: ClientGoodInfoGetListReq
}

/**
 * Request parameters for postApiV1SaleGoodInfoCreate operation in SaleGoodInfoApi.
 */
export interface SaleGoodInfoApiPostApiV1SaleGoodInfoCreateRequest {
    /**
     *  商品信息表
     */
    readonly saleGoodInfo: SaleGoodInfo
}

/**
 * Request parameters for postApiV1SaleGoodInfoDelete operation in SaleGoodInfoApi.
 */
export interface SaleGoodInfoApiPostApiV1SaleGoodInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SaleGoodInfoGetList operation in SaleGoodInfoApi.
 */
export interface SaleGoodInfoApiPostApiV1SaleGoodInfoGetListRequest {
    readonly goodInfoGetListReq: GoodInfoGetListReq
}

/**
 * Request parameters for postApiV1SaleGoodInfoGetOne operation in SaleGoodInfoApi.
 */
export interface SaleGoodInfoApiPostApiV1SaleGoodInfoGetOneRequest {
    readonly goodInfoGetOneReq: GoodInfoGetOneReq
}

/**
 * Request parameters for postApiV1SaleGoodInfoOffer operation in SaleGoodInfoApi.
 */
export interface SaleGoodInfoApiPostApiV1SaleGoodInfoOfferRequest {
    readonly goodInfoOfferReq: GoodInfoOfferReq
}

/**
 * Request parameters for postApiV1SaleGoodInfoUpdate operation in SaleGoodInfoApi.
 */
export interface SaleGoodInfoApiPostApiV1SaleGoodInfoUpdateRequest {
    /**
     *  商品信息表
     */
    readonly saleGoodInfo: SaleGoodInfo
}
