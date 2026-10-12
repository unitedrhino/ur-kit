import type { ApplyToDistributorReq } from '../models';
import type { DistributorApply } from '../models';
import type { DistributorApplyGetListReq } from '../models';
import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';
import type { PostApiV1SaleDistributorApplyGetList200Response } from '../models';
import type { PostApiV1SaleDistributorApplyGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorApplyApi - axios parameter creator
 */

/**
* 提交经销商申请，包含公司信息、联系方式及上级经销商
* @summary 申请成为经销商
* @param {ApplyToDistributorReq} applyToDistributorReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorApplyCreate (
applyToDistributorReq: ApplyToDistributorReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/apply/create`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, applyToDistributorReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据ID删除指定的经销商申请记录
* @summary 删除经销商申请信息
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorApplyDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/apply/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按状态、公司信息等条件分页查询经销商申请记录
* @summary 获取申请经销商列表
* @param {DistributorApplyGetListReq} distributorApplyGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorApplyGetList (
distributorApplyGetListReq: DistributorApplyGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/apply/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyGetList200Response>>(localVarPath, distributorApplyGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据ID查询单个经销商申请的完整信息
* @summary 获取申请经销商信息详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorApplyGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/apply/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 审批或更新经销商申请信息，只能由上级经销商操作
* @summary 更新申请经销商信息
* @param {DistributorApply} distributorApply
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorApplyUpdate (
distributorApply: DistributorApply,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/apply/update`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, distributorApply, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorApplyCreate operation in SaleDistributorApplyApi.
 */
export interface SaleDistributorApplyApiPostApiV1SaleDistributorApplyCreateRequest {
    readonly applyToDistributorReq: ApplyToDistributorReq
}

/**
 * Request parameters for postApiV1SaleDistributorApplyDelete operation in SaleDistributorApplyApi.
 */
export interface SaleDistributorApplyApiPostApiV1SaleDistributorApplyDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SaleDistributorApplyGetList operation in SaleDistributorApplyApi.
 */
export interface SaleDistributorApplyApiPostApiV1SaleDistributorApplyGetListRequest {
    readonly distributorApplyGetListReq: DistributorApplyGetListReq
}

/**
 * Request parameters for postApiV1SaleDistributorApplyGetOne operation in SaleDistributorApplyApi.
 */
export interface SaleDistributorApplyApiPostApiV1SaleDistributorApplyGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SaleDistributorApplyUpdate operation in SaleDistributorApplyApi.
 */
export interface SaleDistributorApplyApiPostApiV1SaleDistributorApplyUpdateRequest {
    readonly distributorApply: DistributorApply
}
