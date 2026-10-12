import type { MallProductCreateReq } from '../models';
import type { MallProductGetListReq } from '../models';
import type { MallProductUpdateReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemMallProductGetList200Response } from '../models';
import type { PostApiV1SystemMallProductGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemMallProductApi - axios parameter creator
 */

/**
* 业务说明：创建商品
* @summary 创建商品
* @param {MallProductCreateReq} mallProductCreateReq  创建商品入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallProductCreate (
mallProductCreateReq: MallProductCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/product/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, mallProductCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除商品
* @summary 删除商品
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallProductDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/product/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取商品列表
* @summary 获取商品列表
* @param {MallProductGetListReq} mallProductGetListReq  商品列表查询入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallProductGetList (
mallProductGetListReq: MallProductGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/product/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallProductGetList200Response>>(localVarPath, mallProductGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取商品详情
* @summary 获取商品详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallProductGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/product/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallProductGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新商品
* @summary 更新商品
* @param {MallProductUpdateReq} mallProductUpdateReq  更新商品入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallProductUpdate (
mallProductUpdateReq: MallProductUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/product/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, mallProductUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemMallProductCreate operation in SystemMallProductApi.
 */
export interface SystemMallProductApiPostApiV1SystemMallProductCreateRequest {
    /**
     *  创建商品入参
     */
    readonly mallProductCreateReq: MallProductCreateReq
}

/**
 * Request parameters for postApiV1SystemMallProductDelete operation in SystemMallProductApi.
 */
export interface SystemMallProductApiPostApiV1SystemMallProductDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemMallProductGetList operation in SystemMallProductApi.
 */
export interface SystemMallProductApiPostApiV1SystemMallProductGetListRequest {
    /**
     *  商品列表查询入参
     */
    readonly mallProductGetListReq: MallProductGetListReq
}

/**
 * Request parameters for postApiV1SystemMallProductGetOne operation in SystemMallProductApi.
 */
export interface SystemMallProductApiPostApiV1SystemMallProductGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemMallProductUpdate operation in SystemMallProductApi.
 */
export interface SystemMallProductApiPostApiV1SystemMallProductUpdateRequest {
    /**
     *  更新商品入参
     */
    readonly mallProductUpdateReq: MallProductUpdateReq
}
