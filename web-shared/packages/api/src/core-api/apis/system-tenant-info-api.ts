import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemTenantInfoCreate200Response } from '../models';
import type { PostApiV1SystemTenantInfoGetList200Response } from '../models';
import type { PostApiV1SystemTenantInfoGetOne200Response } from '../models';
import type { TenantInfo } from '../models';
import type { TenantInfoGetListReq } from '../models';
import type { TenantInfoTransferReq } from '../models';
import type { WithIDOrCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantInfoApi - axios parameter creator
 */

/**
* 业务说明：创建新的租户实体，设置租户名称、编码、状态等基本信息。已登录用户可为自己创建首个企业，平台管理员也可用于平台管理后台的租户开通功能。
* @summary 添加租户
* @param {TenantInfo} tenantInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantInfoCreate (
tenantInfo: TenantInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantInfoCreate200Response>>(localVarPath, tenantInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除租户实体及其关联数据（用户、角色、配置等）。仅平台管理员可操作，用于平台管理后台的租户注销功能。删除前需确保租户下无活跃资源。
* @summary 删除租户
* @param {WithIDOrCode} withIDOrCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantInfoDelete (
withIDOrCode: WithIDOrCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withIDOrCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询租户列表，支持按名称、编码、状态过滤。平台管理员可查看所有租户，普通租户管理员只能查看自己租户。用于租户管理列表页。
* @summary 获取租户列表
* @param {TenantInfoGetListReq} tenantInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantInfoGetList (
tenantInfoGetListReq: TenantInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantInfoGetList200Response>>(localVarPath, tenantInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个租户的完整信息，包括名称、编码、状态、所有者等。用于租户详情页展示、编辑表单初始化。租户管理员可查看自己租户，平台管理员可查看任意租户。
* @summary 获取租户详情
* @param {WithIDOrCode} withIDOrCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantInfoGetOne (
withIDOrCode: WithIDOrCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantInfoGetOne200Response>>(localVarPath, withIDOrCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将租户所有权转让给其他用户。支持两种模式：不传tenantCode时为自助转让，仅当前租户所有者可操作；携带tenantCode时为强制转让，仅平台管理员可操作，可将任意租户转让给该租户下的启用成员，用于原所有者失联等平台管理场景。转让后原所有者变为普通成员，新所有者获得企业主身份并自动补齐该租户管理员角色。
* @summary 转让租户
* @param {TenantInfoTransferReq} tenantInfoTransferReq  租户信息相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantInfoTransfer (
tenantInfoTransferReq: TenantInfoTransferReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/info/transfer`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantInfoTransferReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改租户的基本信息，如名称、状态、联系人等。租户管理员可更新自己租户，平台管理员可更新任意租户。用于租户编辑功能。
* @summary 更新租户
* @param {TenantInfo} tenantInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantInfoUpdate (
tenantInfo: TenantInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantInfoCreate operation in SystemTenantInfoApi.
 */
export interface SystemTenantInfoApiPostApiV1SystemTenantInfoCreateRequest {
    readonly tenantInfo: TenantInfo
}

/**
 * Request parameters for postApiV1SystemTenantInfoDelete operation in SystemTenantInfoApi.
 */
export interface SystemTenantInfoApiPostApiV1SystemTenantInfoDeleteRequest {
    readonly withIDOrCode: WithIDOrCode
}

/**
 * Request parameters for postApiV1SystemTenantInfoGetList operation in SystemTenantInfoApi.
 */
export interface SystemTenantInfoApiPostApiV1SystemTenantInfoGetListRequest {
    readonly tenantInfoGetListReq: TenantInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemTenantInfoGetOne operation in SystemTenantInfoApi.
 */
export interface SystemTenantInfoApiPostApiV1SystemTenantInfoGetOneRequest {
    readonly withIDOrCode: WithIDOrCode
}

/**
 * Request parameters for postApiV1SystemTenantInfoTransfer operation in SystemTenantInfoApi.
 */
export interface SystemTenantInfoApiPostApiV1SystemTenantInfoTransferRequest {
    /**
     *  租户信息相关
     */
    readonly tenantInfoTransferReq: TenantInfoTransferReq
}

/**
 * Request parameters for postApiV1SystemTenantInfoUpdate operation in SystemTenantInfoApi.
 */
export interface SystemTenantInfoApiPostApiV1SystemTenantInfoUpdateRequest {
    readonly tenantInfo: TenantInfo
}
