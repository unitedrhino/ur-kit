import type { NotifyTemplate } from '../models';
import type { NotifyTemplateGetListReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemNotifyTemplateGetList200Response } from '../models';
import type { PostApiV1SystemNotifyTemplateGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemNotifyTemplateApi - axios parameter creator
 */

/**
* 业务说明：创建新的通知模版，定义模版名称、通知编码、渠道类型（短信/邮件/钉钉/微信等）、模版编码、主题、内容、备注等属性。不同渠道类型有不同的专属字段配置，用于统一管理各渠道的通知内容模版。
* @summary 添加通知模版
* @param {NotifyTemplate} notifyTemplate
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyTemplateCreate (
notifyTemplate: NotifyTemplate,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/template/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, notifyTemplate, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的通知模版，删除前需确保该模版未被通知配置绑定使用。用于清理不再使用的模版，管理员权限。
* @summary 删除通知模版
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyTemplateDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/template/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询通知模版列表，支持按模版名称、通知编码、渠道类型筛选。用于模版管理页面的列表展示，便于查找和管理各类通知模版。
* @summary 获取通知模版列表
* @param {NotifyTemplateGetListReq} notifyTemplateGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyTemplateGetList (
notifyTemplateGetListReq: NotifyTemplateGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/template/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyTemplateGetList200Response>>(localVarPath, notifyTemplateGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据ID获取单个通知模版的详细信息，包括模版名称、通知编码、渠道类型、模版编码、主题、内容、以及渠道专属配置等所有字段。用于模版编辑页面的数据加载。
* @summary 获取通知模版详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyTemplateGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/template/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyTemplateGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改通知模版的属性，包括名称、模版编码、主题、内容、备注以及渠道专属配置。用于维护模版内容变更，支持部分更新。
* @summary 更新通知模版
* @param {NotifyTemplate} notifyTemplate
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyTemplateUpdate (
notifyTemplate: NotifyTemplate,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/template/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, notifyTemplate, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemNotifyTemplateCreate operation in SystemNotifyTemplateApi.
 */
export interface SystemNotifyTemplateApiPostApiV1SystemNotifyTemplateCreateRequest {
    readonly notifyTemplate: NotifyTemplate
}

/**
 * Request parameters for postApiV1SystemNotifyTemplateDelete operation in SystemNotifyTemplateApi.
 */
export interface SystemNotifyTemplateApiPostApiV1SystemNotifyTemplateDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyTemplateGetList operation in SystemNotifyTemplateApi.
 */
export interface SystemNotifyTemplateApiPostApiV1SystemNotifyTemplateGetListRequest {
    readonly notifyTemplateGetListReq: NotifyTemplateGetListReq
}

/**
 * Request parameters for postApiV1SystemNotifyTemplateGetOne operation in SystemNotifyTemplateApi.
 */
export interface SystemNotifyTemplateApiPostApiV1SystemNotifyTemplateGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyTemplateUpdate operation in SystemNotifyTemplateApi.
 */
export interface SystemNotifyTemplateApiPostApiV1SystemNotifyTemplateUpdateRequest {
    readonly notifyTemplate: NotifyTemplate
}
