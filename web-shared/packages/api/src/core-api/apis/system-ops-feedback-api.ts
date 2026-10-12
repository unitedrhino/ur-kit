import type { OpsFeedback } from '../models';
import type { OpsFeedbackGetListReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemOpsFeedbackGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemOpsFeedbackApi - axios parameter creator
 */

/**
* 业务说明：用户提交反馈信息，包括反馈类型（设备问题/智能场景/体验问题）、联系方式、问题描述等。反馈进入待处理状态，运营人员跟进处理。支持所有登录用户提交反馈。
* @summary 添加帮助与反馈
* @param {OpsFeedback} opsFeedback
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemOpsFeedbackCreate (
opsFeedback: OpsFeedback,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/ops/feedback/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, opsFeedback, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询反馈列表，支持按类型、状态、项目、租户等条件筛选。普通用户查看自己提交的反馈，平台管理员可查看所有租户的反馈。用于反馈管理页面的列表展示。
* @summary 获取帮助与反馈
* @param {OpsFeedbackGetListReq} opsFeedbackGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemOpsFeedbackGetList (
opsFeedbackGetListReq: OpsFeedbackGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/ops/feedback/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemOpsFeedbackGetList200Response>>(localVarPath, opsFeedbackGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新反馈状态和处理信息，支持状态流转（待处理→处理中→已完成）。运营人员跟进反馈时调用，记录处理进度。用户也可更新自己提交的反馈内容。
* @summary 更新帮助与反馈
* @param {OpsFeedback} opsFeedback
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemOpsFeedbackUpdate (
opsFeedback: OpsFeedback,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/ops/feedback/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, opsFeedback, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemOpsFeedbackCreate operation in SystemOpsFeedbackApi.
 */
export interface SystemOpsFeedbackApiPostApiV1SystemOpsFeedbackCreateRequest {
    readonly opsFeedback: OpsFeedback
}

/**
 * Request parameters for postApiV1SystemOpsFeedbackGetList operation in SystemOpsFeedbackApi.
 */
export interface SystemOpsFeedbackApiPostApiV1SystemOpsFeedbackGetListRequest {
    readonly opsFeedbackGetListReq: OpsFeedbackGetListReq
}

/**
 * Request parameters for postApiV1SystemOpsFeedbackUpdate operation in SystemOpsFeedbackApi.
 */
export interface SystemOpsFeedbackApiPostApiV1SystemOpsFeedbackUpdateRequest {
    readonly opsFeedback: OpsFeedback
}
