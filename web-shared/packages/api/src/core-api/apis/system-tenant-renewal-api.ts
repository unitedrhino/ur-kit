import type { PostApiV1SystemTenantRenewalDirectGrant200Response } from '../models';
import type { PostApiV1SystemTenantRenewalGetList200Response } from '../models';
import type { PostApiV1SystemTenantRenewalRenew200Response } from '../models';
import type { RenewalDirectGrantReq } from '../models';
import type { RenewalListReq } from '../models';
import type { RenewalRenewReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantRenewalApi - axios parameter creator
 */

/**
* 业务说明：平台管理员直接选择商品或套餐授权给指定租户，无需生成 License 码。支持 plan/subscription/quotaRecharge/balanceTopup 类型，支持数量倍数。plan 类型不同商品需要确认替换。
* @summary 直接授权
* @param {RenewalDirectGrantReq} renewalDirectGrantReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantRenewalDirectGrant (
renewalDirectGrantReq: RenewalDirectGrantReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/renewal/direct-grant`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantRenewalDirectGrant200Response>>(localVarPath, renewalDirectGrantReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询企业与应用的续期列表，支持状态、关键字、到期天数过滤。用于续期管理页面与顶部到期提醒。
* @summary 获取续期列表
* @param {RenewalListReq} renewalListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantRenewalGetList (
renewalListReq: RenewalListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/renewal/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantRenewalGetList200Response>>(localVarPath, renewalListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：使用授权码对指定企业或应用进行续费或扩容。企业套餐授权码会刷新企业套餐信息，扩容授权码会叠加支持的企业配额。租户管理员只能续费自己的租户，平台管理员可指定 tenantCode 为任意租户续费。
* @summary 续费
* @param {RenewalRenewReq} renewalRenewReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantRenewalRenew (
renewalRenewReq: RenewalRenewReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/renewal/renew`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantRenewalRenew200Response>>(localVarPath, renewalRenewReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantRenewalDirectGrant operation in SystemTenantRenewalApi.
 */
export interface SystemTenantRenewalApiPostApiV1SystemTenantRenewalDirectGrantRequest {
    readonly renewalDirectGrantReq: RenewalDirectGrantReq
}

/**
 * Request parameters for postApiV1SystemTenantRenewalGetList operation in SystemTenantRenewalApi.
 */
export interface SystemTenantRenewalApiPostApiV1SystemTenantRenewalGetListRequest {
    readonly renewalListReq: RenewalListReq
}

/**
 * Request parameters for postApiV1SystemTenantRenewalRenew operation in SystemTenantRenewalApi.
 */
export interface SystemTenantRenewalApiPostApiV1SystemTenantRenewalRenewRequest {
    readonly renewalRenewReq: RenewalRenewReq
}
