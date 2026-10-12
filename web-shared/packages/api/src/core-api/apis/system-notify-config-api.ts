import type { NotifyConfig } from '../models';
import type { NotifyConfigGetListReq } from '../models';
import type { NotifyConfigSendTestReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemNotifyConfigGetList200Response } from '../models';
import type { PostApiV1SystemNotifyConfigGetOne200Response } from '../models';
import type { PostApiV1SystemNotifyConfigTree200Response } from '../models';
import type { WithID } from '../models';
import type { WithIDOrCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemNotifyConfigApi - axios parameter creator
 */

/**
* 业务说明：创建新的通知配置项，定义通知类型编码、名称、支持的通知渠道类型（短信、邮件、钉钉等）、是否启用、是否记录到消息中心、防抖间隔等属性。平台管理员权限，用于配置系统通知的基础设置。
* @summary 添加通知配置
* @param {NotifyConfig} notifyConfig
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigCreate (
notifyConfig: NotifyConfig,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, notifyConfig, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的通知配置项，会同时清理该配置绑定的模板关联关系。平台管理员权限，删除前需确保无业务依赖该通知配置。
* @summary 删除通知配置
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询通知配置列表，支持按名称、编码、分组、启用状态筛选。可选择是否返回绑定的模板信息。用于通知配置管理页面的列表展示。
* @summary 获取通知列表
* @param {NotifyConfigGetListReq} notifyConfigGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigGetList (
notifyConfigGetListReq: NotifyConfigGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyConfigGetList200Response>>(localVarPath, notifyConfigGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据ID或编码获取单个通知配置的详细信息，包括配置属性和可选的绑定模板列表。用于通知配置编辑页面的数据加载，支持通过ID或唯一编码查询。
* @summary 获取通知详情
* @param {WithIDOrCode} withIDOrCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigGetOne (
withIDOrCode: WithIDOrCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyConfigGetOne200Response>>(localVarPath, withIDOrCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：验证通知配置是否正常工作，向指定账号发送测试消息。支持选择通知渠道类型、模板ID、模板变量参数。用于配置调试和上线前验证，确保通知渠道可达。
* @summary 测试发送通知
* @param {NotifyConfigSendTestReq} notifyConfigSendTestReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigSendTest (
notifyConfigSendTestReq: NotifyConfigSendTestReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/send-test`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, notifyConfigSendTestReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按分组维度组织通知配置，返回树形结构便于前端分类展示。每个分组包含该分组下的所有通知配置项，用于通知配置管理页面的左侧导航树或分组展示。
* @summary 获取通知列表树
* @param {NotifyConfigGetListReq} notifyConfigGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigTree (
notifyConfigGetListReq: NotifyConfigGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/tree`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyConfigTree200Response>>(localVarPath, notifyConfigGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改通知配置的属性，包括名称、支持渠道、启用状态、防抖间隔、变量参数等。平台管理员权限，用于维护通知配置的设置变更，支持部分更新。
* @summary 更新通知配置
* @param {NotifyConfig} notifyConfig
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigUpdate (
notifyConfig: NotifyConfig,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, notifyConfig, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemNotifyConfigCreate operation in SystemNotifyConfigApi.
 */
export interface SystemNotifyConfigApiPostApiV1SystemNotifyConfigCreateRequest {
    readonly notifyConfig: NotifyConfig
}

/**
 * Request parameters for postApiV1SystemNotifyConfigDelete operation in SystemNotifyConfigApi.
 */
export interface SystemNotifyConfigApiPostApiV1SystemNotifyConfigDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyConfigGetList operation in SystemNotifyConfigApi.
 */
export interface SystemNotifyConfigApiPostApiV1SystemNotifyConfigGetListRequest {
    readonly notifyConfigGetListReq: NotifyConfigGetListReq
}

/**
 * Request parameters for postApiV1SystemNotifyConfigGetOne operation in SystemNotifyConfigApi.
 */
export interface SystemNotifyConfigApiPostApiV1SystemNotifyConfigGetOneRequest {
    readonly withIDOrCode: WithIDOrCode
}

/**
 * Request parameters for postApiV1SystemNotifyConfigSendTest operation in SystemNotifyConfigApi.
 */
export interface SystemNotifyConfigApiPostApiV1SystemNotifyConfigSendTestRequest {
    readonly notifyConfigSendTestReq: NotifyConfigSendTestReq
}

/**
 * Request parameters for postApiV1SystemNotifyConfigTree operation in SystemNotifyConfigApi.
 */
export interface SystemNotifyConfigApiPostApiV1SystemNotifyConfigTreeRequest {
    readonly notifyConfigGetListReq: NotifyConfigGetListReq
}

/**
 * Request parameters for postApiV1SystemNotifyConfigUpdate operation in SystemNotifyConfigApi.
 */
export interface SystemNotifyConfigApiPostApiV1SystemNotifyConfigUpdateRequest {
    readonly notifyConfig: NotifyConfig
}
