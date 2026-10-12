import type { DistributorWithdraw } from '../models';
import type { DistributorWithdrawGetListReq } from '../models';
import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';
import type { PostApiV1SaleDistributorWithdrawGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorWithdrawApi - axios parameter creator
 */

/**
* 经销商提交提现申请，填写提现金额、发票等信息
* @summary 申请提现
* @param {DistributorWithdraw} distributorWithdraw
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorWithdrawCreate (
distributorWithdraw: DistributorWithdraw,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/withdraw/create`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, distributorWithdraw, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除处于待审批状态的经销商提现申请
* @summary 删除经销商提现(只有待审批的可以删除)
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorWithdrawDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/withdraw/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按经销商、状态等条件分页查询提现申请记录
* @summary 获取经销商提现列表
* @param {DistributorWithdrawGetListReq} distributorWithdrawGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorWithdrawGetList (
distributorWithdrawGetListReq: DistributorWithdrawGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/withdraw/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorWithdrawGetList200Response>>(localVarPath, distributorWithdrawGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 审批或更新经销商提现申请，修改状态、审批备注等信息
* @summary 更新经销商提现信息
* @param {DistributorWithdraw} distributorWithdraw
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorWithdrawUpdate (
distributorWithdraw: DistributorWithdraw,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/withdraw/update`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, distributorWithdraw, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorWithdrawCreate operation in SaleDistributorWithdrawApi.
 */
export interface SaleDistributorWithdrawApiPostApiV1SaleDistributorWithdrawCreateRequest {
    readonly distributorWithdraw: DistributorWithdraw
}

/**
 * Request parameters for postApiV1SaleDistributorWithdrawDelete operation in SaleDistributorWithdrawApi.
 */
export interface SaleDistributorWithdrawApiPostApiV1SaleDistributorWithdrawDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SaleDistributorWithdrawGetList operation in SaleDistributorWithdrawApi.
 */
export interface SaleDistributorWithdrawApiPostApiV1SaleDistributorWithdrawGetListRequest {
    readonly distributorWithdrawGetListReq: DistributorWithdrawGetListReq
}

/**
 * Request parameters for postApiV1SaleDistributorWithdrawUpdate operation in SaleDistributorWithdrawApi.
 */
export interface SaleDistributorWithdrawApiPostApiV1SaleDistributorWithdrawUpdateRequest {
    readonly distributorWithdraw: DistributorWithdraw
}
