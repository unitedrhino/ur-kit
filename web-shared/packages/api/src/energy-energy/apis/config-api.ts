import type { EnergyConfigUpdateReq } from '../models';
import type { PostApiV1EnergyConfigGetOne200Response } from '../models';
import type { PostApiV1EnergyConfigUpdate200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ConfigApi - axios parameter creator
 */

/**
* 业务说明：查询预付费系统配置，包括水电单价、预警阈值、自动断供和微信支付参数的已配置状态。用于后台配置页面回显。
* @summary 获取系统配置
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyConfigGetOne (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/config/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigGetOne200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新预付费系统配置，包括水电单价、预警阈值、自动断供参数和微信支付配置。用于管理员维护收费和支付规则。
* @summary 更新系统配置
* @param {EnergyConfigUpdateReq} energyConfigUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyConfigUpdate (
energyConfigUpdateReq: EnergyConfigUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/config/update`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, energyConfigUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyConfigUpdate operation in ConfigApi.
 */
export interface ConfigApiPostApiV1EnergyConfigUpdateRequest {
    readonly energyConfigUpdateReq: EnergyConfigUpdateReq
}
