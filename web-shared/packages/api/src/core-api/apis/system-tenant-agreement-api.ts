import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemTenantAgreementGetList200Response } from '../models';
import type { PostApiV1SystemTenantAgreementGetOne200Response } from '../models';
import type { TenantAgreement } from '../models';
import type { TenantAgreementGetListReq } from '../models';
import type { WithID } from '../models';
import type { WithIDOrCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantAgreementApi - axios parameter creator
 */

/**
* 创建新的租户协议，如用户协议、隐私政策等，协议内容支持富文本格式
* @summary 添加协议
* @param {TenantAgreement} tenantAgreement  租户协议相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAgreementCreate (
tenantAgreement: TenantAgreement,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/agreement/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, tenantAgreement, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除指定的租户协议，删除后不可恢复
* @summary 删除协议
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAgreementDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/agreement/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取租户协议列表，支持按类型筛选，返回协议基本信息（不含完整内容）
* @summary 获取协议列表
* @param {TenantAgreementGetListReq} tenantAgreementGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAgreementGetList (
tenantAgreementGetListReq: TenantAgreementGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/agreement/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantAgreementGetList200Response>>(localVarPath, tenantAgreementGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据ID或协议代码获取协议完整内容，用于用户注册/登录时展示用户协议、隐私政策等，无需登录即可调用
* @summary 获取协议详情
* @param {WithIDOrCode} withIDOrCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAgreementGetOne (
withIDOrCode: WithIDOrCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/agreement/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantAgreementGetOne200Response>>(localVarPath, withIDOrCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新租户协议内容和配置，支持更新名称、内容、状态等字段
* @summary 更新协议
* @param {TenantAgreement} tenantAgreement  租户协议相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAgreementUpdate (
tenantAgreement: TenantAgreement,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/agreement/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantAgreement, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantAgreementCreate operation in SystemTenantAgreementApi.
 */
export interface SystemTenantAgreementApiPostApiV1SystemTenantAgreementCreateRequest {
    /**
     *  租户协议相关
     */
    readonly tenantAgreement: TenantAgreement
}

/**
 * Request parameters for postApiV1SystemTenantAgreementDelete operation in SystemTenantAgreementApi.
 */
export interface SystemTenantAgreementApiPostApiV1SystemTenantAgreementDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemTenantAgreementGetList operation in SystemTenantAgreementApi.
 */
export interface SystemTenantAgreementApiPostApiV1SystemTenantAgreementGetListRequest {
    readonly tenantAgreementGetListReq: TenantAgreementGetListReq
}

/**
 * Request parameters for postApiV1SystemTenantAgreementGetOne operation in SystemTenantAgreementApi.
 */
export interface SystemTenantAgreementApiPostApiV1SystemTenantAgreementGetOneRequest {
    readonly withIDOrCode: WithIDOrCode
}

/**
 * Request parameters for postApiV1SystemTenantAgreementUpdate operation in SystemTenantAgreementApi.
 */
export interface SystemTenantAgreementApiPostApiV1SystemTenantAgreementUpdateRequest {
    /**
     *  租户协议相关
     */
    readonly tenantAgreement: TenantAgreement
}
