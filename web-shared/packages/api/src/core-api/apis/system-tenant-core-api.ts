import type { PostApiV1SystemTenantCoreGetList200Response } from '../models';
import type { PostApiV1SystemTenantCoreGetOne200Response } from '../models';
import type { TenantCoreGetListReq } from '../models';
import type { WithIDOrCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantCoreApi - axios parameter creator
 */

/**
* 搜索租户列表，用于租户选择、租户发现等场景，支持按名称、代码模糊搜索，无需登录即可调用
* @summary 搜索租户信息
* @param {TenantCoreGetListReq} tenantCoreGetListReq  租户核心信息相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantCoreGetList (
tenantCoreGetListReq: TenantCoreGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/core/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantCoreGetList200Response>>(localVarPath, tenantCoreGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据ID或租户代码获取租户基本信息，用于登录页展示租户配置（Logo、名称等），无需登录即可调用
* @summary 获取租户信息
* @param {WithIDOrCode} withIDOrCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantCoreGetOne (
withIDOrCode: WithIDOrCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/core/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantCoreGetOne200Response>>(localVarPath, withIDOrCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantCoreGetList operation in SystemTenantCoreApi.
 */
export interface SystemTenantCoreApiPostApiV1SystemTenantCoreGetListRequest {
    /**
     *  租户核心信息相关
     */
    readonly tenantCoreGetListReq: TenantCoreGetListReq
}

/**
 * Request parameters for postApiV1SystemTenantCoreGetOne operation in SystemTenantCoreApi.
 */
export interface SystemTenantCoreApiPostApiV1SystemTenantCoreGetOneRequest {
    readonly withIDOrCode: WithIDOrCode
}
