import type { AppAgreementBindBatchUpdateReq } from '../models';
import type { AppAgreementBindGetListReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemAppAgreementGetBindList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemAppAgreementApi - axios parameter creator
 */

/**
* 业务说明：按应用维度或协议维度批量覆盖绑定关系，同时保存协议类型、排序和启用状态。同一应用下协议 code 必须唯一。
* @summary 批量更新应用协议绑定
* @param {AppAgreementBindBatchUpdateReq} appAgreementBindBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppAgreementBindBatchUpdate (
appAgreementBindBatchUpdateReq: AppAgreementBindBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/agreement/bind-batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, appAgreementBindBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询应用与协议的绑定关系，支持按应用或协议双向查看，并按需携带应用详情或协议详情。用于协议管理页和应用详情页的双向绑定管理。
* @summary 获取应用协议绑定列表
* @param {AppAgreementBindGetListReq} appAgreementBindGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppAgreementGetBindList (
appAgreementBindGetListReq: AppAgreementBindGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/agreement/get-bind-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppAgreementGetBindList200Response>>(localVarPath, appAgreementBindGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemAppAgreementBindBatchUpdate operation in SystemAppAgreementApi.
 */
export interface SystemAppAgreementApiPostApiV1SystemAppAgreementBindBatchUpdateRequest {
    readonly appAgreementBindBatchUpdateReq: AppAgreementBindBatchUpdateReq
}

/**
 * Request parameters for postApiV1SystemAppAgreementGetBindList operation in SystemAppAgreementApi.
 */
export interface SystemAppAgreementApiPostApiV1SystemAppAgreementGetBindListRequest {
    readonly appAgreementBindGetListReq: AppAgreementBindGetListReq
}
