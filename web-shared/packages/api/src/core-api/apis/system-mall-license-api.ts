import type { MallLicenseBatchCreateReq } from '../models';
import type { MallLicenseCreateReq } from '../models';
import type { MallLicenseGetListReq } from '../models';
import type { MallLicenseInvalidBatchReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemMallLicenseBatchCreate200Response } from '../models';
import type { PostApiV1SystemMallLicenseCreate200Response } from '../models';
import type { PostApiV1SystemMallLicenseGetList200Response } from '../models';
import type { PostApiV1SystemMallLicenseGetOne200Response } from '../models';
import type { PostApiV1SystemMallLicenseInvalidBatch200Response } from '../models';
import type { WithLicenseCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemMallLicenseApi - axios parameter creator
 */

/**
* 业务说明：批量创建授权码
* @summary 批量创建授权码
* @param {MallLicenseBatchCreateReq} mallLicenseBatchCreateReq  批量创建授权码入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallLicenseBatchCreate (
mallLicenseBatchCreateReq: MallLicenseBatchCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/license/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallLicenseBatchCreate200Response>>(localVarPath, mallLicenseBatchCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建授权码
* @summary 创建授权码
* @param {MallLicenseCreateReq} mallLicenseCreateReq  创建授权码入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallLicenseCreate (
mallLicenseCreateReq: MallLicenseCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/license/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallLicenseCreate200Response>>(localVarPath, mallLicenseCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：授权码列表
* @summary 授权码列表
* @param {MallLicenseGetListReq} mallLicenseGetListReq  授权码列表查询入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallLicenseGetList (
mallLicenseGetListReq: MallLicenseGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/license/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallLicenseGetList200Response>>(localVarPath, mallLicenseGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：授权码详情
* @summary 授权码详情
* @param {WithLicenseCode} withLicenseCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallLicenseGetOne (
withLicenseCode: WithLicenseCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/license/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallLicenseGetOne200Response>>(localVarPath, withLicenseCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量作废待使用状态的授权码，非待使用的跳过并返回
* @summary 批量作废授权码
* @param {MallLicenseInvalidBatchReq} mallLicenseInvalidBatchReq  批量作废授权码入参
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallLicenseInvalidBatch (
mallLicenseInvalidBatchReq: MallLicenseInvalidBatchReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/license/invalid-batch`;
    return requestClient.post<ExtractDataType<PostApiV1SystemMallLicenseInvalidBatch200Response>>(localVarPath, mallLicenseInvalidBatchReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：撤销已使用的授权码，回收对应资源
* @summary 撤销授权码
* @param {WithLicenseCode} withLicenseCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemMallLicenseRevoke (
withLicenseCode: WithLicenseCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/mall/license/revoke`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withLicenseCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemMallLicenseBatchCreate operation in SystemMallLicenseApi.
 */
export interface SystemMallLicenseApiPostApiV1SystemMallLicenseBatchCreateRequest {
    /**
     *  批量创建授权码入参
     */
    readonly mallLicenseBatchCreateReq: MallLicenseBatchCreateReq
}

/**
 * Request parameters for postApiV1SystemMallLicenseCreate operation in SystemMallLicenseApi.
 */
export interface SystemMallLicenseApiPostApiV1SystemMallLicenseCreateRequest {
    /**
     *  创建授权码入参
     */
    readonly mallLicenseCreateReq: MallLicenseCreateReq
}

/**
 * Request parameters for postApiV1SystemMallLicenseGetList operation in SystemMallLicenseApi.
 */
export interface SystemMallLicenseApiPostApiV1SystemMallLicenseGetListRequest {
    /**
     *  授权码列表查询入参
     */
    readonly mallLicenseGetListReq: MallLicenseGetListReq
}

/**
 * Request parameters for postApiV1SystemMallLicenseGetOne operation in SystemMallLicenseApi.
 */
export interface SystemMallLicenseApiPostApiV1SystemMallLicenseGetOneRequest {
    readonly withLicenseCode: WithLicenseCode
}

/**
 * Request parameters for postApiV1SystemMallLicenseInvalidBatch operation in SystemMallLicenseApi.
 */
export interface SystemMallLicenseApiPostApiV1SystemMallLicenseInvalidBatchRequest {
    /**
     *  批量作废授权码入参
     */
    readonly mallLicenseInvalidBatchReq: MallLicenseInvalidBatchReq
}

/**
 * Request parameters for postApiV1SystemMallLicenseRevoke operation in SystemMallLicenseApi.
 */
export interface SystemMallLicenseApiPostApiV1SystemMallLicenseRevokeRequest {
    readonly withLicenseCode: WithLicenseCode
}
