import type { HookServerGetListReq } from '../models';
import type { HookServerInfo } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemHookServerGetList200Response } from '../models';
import type { PostApiV1SystemHookServerGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemHookServerApi - axios parameter creator
 */

/**
* 业务说明：注册外部Hook服务，配置服务端点、认证方式、超时重试策略等。Hook服务用于扩展平台业务逻辑，如数据过滤、事件通知、业务校验等。创建后可通过能力接口声明具体Hook点。
* @summary 新增Hook服务
* @param {HookServerInfo} hookServerInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookServerCreate (
hookServerInfo: HookServerInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/server/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, hookServerInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除Hook服务注册记录。删除前需确保没有能力声明引用该服务，否则删除失败。删除后该服务的所有Hook调用将停止。
* @summary 删除Hook服务
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookServerDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/server/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询Hook服务列表，支持按名称、状态筛选。用于Hook服务管理页面展示。返回结果包含服务基本信息和关联能力数量。
* @summary 获取Hook服务列表
* @param {HookServerGetListReq} hookServerGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookServerGetList (
hookServerGetListReq: HookServerGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/server/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemHookServerGetList200Response>>(localVarPath, hookServerGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据服务ID查询完整的Hook服务配置信息，包括端点、认证配置、超时重试策略、关联的能力列表等。用于编辑回显、配置查看等场景。
* @summary 获取Hook服务详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookServerGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/server/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemHookServerGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改已注册的Hook服务配置，支持更新名称、端点、认证配置、超时策略、失败策略等。部分更新，空值字段不修改。状态变更立即生效。
* @summary 更新Hook服务
* @param {HookServerInfo} hookServerInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemHookServerUpdate (
hookServerInfo: HookServerInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/hook/server/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, hookServerInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemHookServerCreate operation in SystemHookServerApi.
 */
export interface SystemHookServerApiPostApiV1SystemHookServerCreateRequest {
    readonly hookServerInfo: HookServerInfo
}

/**
 * Request parameters for postApiV1SystemHookServerDelete operation in SystemHookServerApi.
 */
export interface SystemHookServerApiPostApiV1SystemHookServerDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemHookServerGetList operation in SystemHookServerApi.
 */
export interface SystemHookServerApiPostApiV1SystemHookServerGetListRequest {
    readonly hookServerGetListReq: HookServerGetListReq
}

/**
 * Request parameters for postApiV1SystemHookServerGetOne operation in SystemHookServerApi.
 */
export interface SystemHookServerApiPostApiV1SystemHookServerGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemHookServerUpdate operation in SystemHookServerApi.
 */
export interface SystemHookServerApiPostApiV1SystemHookServerUpdateRequest {
    readonly hookServerInfo: HookServerInfo
}
