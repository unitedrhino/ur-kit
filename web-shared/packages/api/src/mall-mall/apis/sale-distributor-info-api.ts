import type { DistributorInfo } from '../models';
import type { DistributorInfoClientGetOneReq } from '../models';
import type { DistributorInfoGetListReq } from '../models';
import type { DistributorInfoGetOneReq } from '../models';
import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';
import type { PostApiV1SaleDistributorInfoClientGetOne200Response } from '../models';
import type { PostApiV1SaleDistributorInfoGetList200Response } from '../models';
import type { PostApiV1SaleDistributorInfoGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorInfoApi - axios parameter creator
 */

/**
* 面向C端，查询当前所属经销商的工厂和品牌等信息
* @summary 客户端获取经销商信息详情
* @param {DistributorInfoClientGetOneReq} distributorInfoClientGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorInfoClientGetOne (
distributorInfoClientGetOneReq: DistributorInfoClientGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/info/client/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorInfoClientGetOne200Response>>(localVarPath, distributorInfoClientGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 创建新的经销商记录并指定上级经销商
* @summary 创建经销商
* @param {DistributorInfo} distributorInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorInfoCreate (
distributorInfo: DistributorInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, distributorInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据ID删除指定经销商记录
* @summary 删除经销商
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按名称、状态、上级经销商等条件分页查询经销商列表
* @summary 获取经销商列表
* @param {DistributorInfoGetListReq} distributorInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorInfoGetList (
distributorInfoGetListReq: DistributorInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorInfoGetList200Response>>(localVarPath, distributorInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据经销商ID查询单个经销商的完整信息
* @summary 获取经销商信息详情
* @param {DistributorInfoGetOneReq} distributorInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorInfoGetOne (
distributorInfoGetOneReq: DistributorInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorInfoGetOne200Response>>(localVarPath, distributorInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改经销商的基本信息、状态及绑定产品等，只能由上级经销商审核修改
* @summary 更新经销商信息
* @param {DistributorInfo} distributorInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorInfoUpdate (
distributorInfo: DistributorInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, distributorInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorInfoClientGetOne operation in SaleDistributorInfoApi.
 */
export interface SaleDistributorInfoApiPostApiV1SaleDistributorInfoClientGetOneRequest {
    readonly distributorInfoClientGetOneReq: DistributorInfoClientGetOneReq
}

/**
 * Request parameters for postApiV1SaleDistributorInfoCreate operation in SaleDistributorInfoApi.
 */
export interface SaleDistributorInfoApiPostApiV1SaleDistributorInfoCreateRequest {
    readonly distributorInfo: DistributorInfo
}

/**
 * Request parameters for postApiV1SaleDistributorInfoDelete operation in SaleDistributorInfoApi.
 */
export interface SaleDistributorInfoApiPostApiV1SaleDistributorInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SaleDistributorInfoGetList operation in SaleDistributorInfoApi.
 */
export interface SaleDistributorInfoApiPostApiV1SaleDistributorInfoGetListRequest {
    readonly distributorInfoGetListReq: DistributorInfoGetListReq
}

/**
 * Request parameters for postApiV1SaleDistributorInfoGetOne operation in SaleDistributorInfoApi.
 */
export interface SaleDistributorInfoApiPostApiV1SaleDistributorInfoGetOneRequest {
    readonly distributorInfoGetOneReq: DistributorInfoGetOneReq
}

/**
 * Request parameters for postApiV1SaleDistributorInfoUpdate operation in SaleDistributorInfoApi.
 */
export interface SaleDistributorInfoApiPostApiV1SaleDistributorInfoUpdateRequest {
    readonly distributorInfo: DistributorInfo
}
