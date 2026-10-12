import type { MallPackageCreateReq } from '../models';
import type { MallPackageGetListReq } from '../models';
import type { MallPackageUpdateReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemMallPackageGetList200Response } from '../models';
import type { PostApiV1SystemMallPackageGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemMallPackageApi - axios parameter creator
 */

/**
* 业务说明：创建套餐
* @summary 创建套餐
* @param {MallPackageCreateReq} mallPackageCreateReq  创建套餐入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallPackageCreate (
mallPackageCreateReq: MallPackageCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/package/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, mallPackageCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除套餐
* @summary 删除套餐
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallPackageDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/package/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取套餐列表
* @summary 获取套餐列表
* @param {MallPackageGetListReq} mallPackageGetListReq  套餐列表查询入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallPackageGetList (
mallPackageGetListReq: MallPackageGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/package/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallPackageGetList200Response>>(localVarPath, mallPackageGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取套餐详情
* @summary 获取套餐详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallPackageGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/package/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallPackageGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新套餐
* @summary 更新套餐
* @param {MallPackageUpdateReq} mallPackageUpdateReq  更新套餐入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallPackageUpdate (
mallPackageUpdateReq: MallPackageUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/package/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, mallPackageUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemMallPackageCreate operation in SystemMallPackageApi.
 */
export interface SystemMallPackageApiPostApiV1SystemMallPackageCreateRequest {
    /**
     *  创建套餐入参
     */
    readonly mallPackageCreateReq: MallPackageCreateReq
}

/**
 * Request parameters for postApiV1SystemMallPackageDelete operation in SystemMallPackageApi.
 */
export interface SystemMallPackageApiPostApiV1SystemMallPackageDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemMallPackageGetList operation in SystemMallPackageApi.
 */
export interface SystemMallPackageApiPostApiV1SystemMallPackageGetListRequest {
    /**
     *  套餐列表查询入参
     */
    readonly mallPackageGetListReq: MallPackageGetListReq
}

/**
 * Request parameters for postApiV1SystemMallPackageGetOne operation in SystemMallPackageApi.
 */
export interface SystemMallPackageApiPostApiV1SystemMallPackageGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemMallPackageUpdate operation in SystemMallPackageApi.
 */
export interface SystemMallPackageApiPostApiV1SystemMallPackageUpdateRequest {
    /**
     *  更新套餐入参
     */
    readonly mallPackageUpdateReq: MallPackageUpdateReq
}
