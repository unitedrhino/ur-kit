import type { NotifyConfigTemplate } from '../models';
import type { NotifyConfigTemplateDeleteReq } from '../models';
import type { NotifyConfigTemplateGetListReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemNotifyConfigTemplateGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemNotifyConfigTemplateApi - axios parameter creator
 */

/**
* 业务说明：解除通知配置与指定渠道模版的绑定关系。用于清理不再使用的模版绑定，删除后该通知配置在该渠道类型将无模版可用。
* @summary 删除通知绑定模版
* @param {NotifyConfigTemplateDeleteReq} notifyConfigTemplateDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigTemplateDelete (
notifyConfigTemplateDeleteReq: NotifyConfigTemplateDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/template/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, notifyConfigTemplateDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询某个通知配置绑定的模版列表，支持按渠道类型筛选。用于通知配置详情页展示已绑定的模版信息，便于管理和更新模版绑定关系。
* @summary 获取通知绑定模版列表
* @param {NotifyConfigTemplateGetListReq} notifyConfigTemplateGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigTemplateGetList (
notifyConfigTemplateGetListReq: NotifyConfigTemplateGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/template/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyConfigTemplateGetList200Response>>(localVarPath, notifyConfigTemplateGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改通知配置与模版的绑定关系，包括通知编码、渠道类型、模版ID。用于为通知配置指定各渠道类型的具体模版，实现通知内容的模版化管理。
* @summary 更新通知绑定模版
* @param {NotifyConfigTemplate} notifyConfigTemplate
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyConfigTemplateUpdate (
notifyConfigTemplate: NotifyConfigTemplate,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/config/template/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, notifyConfigTemplate, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemNotifyConfigTemplateDelete operation in SystemNotifyConfigTemplateApi.
 */
export interface SystemNotifyConfigTemplateApiPostApiV1SystemNotifyConfigTemplateDeleteRequest {
    readonly notifyConfigTemplateDeleteReq: NotifyConfigTemplateDeleteReq
}

/**
 * Request parameters for postApiV1SystemNotifyConfigTemplateGetList operation in SystemNotifyConfigTemplateApi.
 */
export interface SystemNotifyConfigTemplateApiPostApiV1SystemNotifyConfigTemplateGetListRequest {
    readonly notifyConfigTemplateGetListReq: NotifyConfigTemplateGetListReq
}

/**
 * Request parameters for postApiV1SystemNotifyConfigTemplateUpdate operation in SystemNotifyConfigTemplateApi.
 */
export interface SystemNotifyConfigTemplateApiPostApiV1SystemNotifyConfigTemplateUpdateRequest {
    readonly notifyConfigTemplate: NotifyConfigTemplate
}
