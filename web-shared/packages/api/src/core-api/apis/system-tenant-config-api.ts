import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemTenantConfigGetOne200Response } from '../models';
import type { TenantConfig } from '../models';
import type { WithTenantCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantConfigApi - axios parameter creator
 */

/**
* 业务说明：查询当前租户的配置详情，包括注册默认角色、自动创建项目/区域策略等。用于租户管理页面展示和编辑配置。
* @summary 获取租户配置
* @param {WithTenantCode} withTenantCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantConfigGetOne (
withTenantCode: WithTenantCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/config/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantConfigGetOne200Response>>(localVarPath, withTenantCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新租户级配置信息，如注册角色、自动创建项目等配置项。仅租户管理员可操作，用于定制租户的默认行为策略。
* @summary 更新租户配置
* @param {TenantConfig} tenantConfig
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantConfigUpdate (
tenantConfig: TenantConfig,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/config/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantConfig, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantConfigGetOne operation in SystemTenantConfigApi.
 */
export interface SystemTenantConfigApiPostApiV1SystemTenantConfigGetOneRequest {
    readonly withTenantCode: WithTenantCode
}

/**
 * Request parameters for postApiV1SystemTenantConfigUpdate operation in SystemTenantConfigApi.
 */
export interface SystemTenantConfigApiPostApiV1SystemTenantConfigUpdateRequest {
    readonly tenantConfig: TenantConfig
}
