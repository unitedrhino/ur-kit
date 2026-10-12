import type { FlowCcGetListReq } from '../models';
import type { FlowCcMarkReadReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemFlowCcGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemFlowCcApi - axios parameter creator
 */

/**
* 业务说明：分页查询抄送给当前用户的审批记录列表，返回实例标题、任务名、发起人与抄送时间等信息，用于抄送我的列表页展示。
* @summary 我收到的抄送分页
* @param {FlowCcGetListReq} flowCcGetListReq  抄送分页请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowCcGetList (
flowCcGetListReq: FlowCcGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/cc/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowCcGetList200Response>>(localVarPath, flowCcGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将指定的抄送记录批量标记为已阅，标记后抄送消息不再提示未读；传入抄送记录ID列表【ids】。
* @summary 抄送标记已阅
* @param {FlowCcMarkReadReq} flowCcMarkReadReq  抄送标记已阅请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowCcMarkRead (
flowCcMarkReadReq: FlowCcMarkReadReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/cc/mark-read`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowCcMarkReadReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemFlowCcGetList operation in SystemFlowCcApi.
 */
export interface SystemFlowCcApiPostApiV1SystemFlowCcGetListRequest {
    /**
     *  抄送分页请求
     */
    readonly flowCcGetListReq: FlowCcGetListReq
}

/**
 * Request parameters for postApiV1SystemFlowCcMarkRead operation in SystemFlowCcApi.
 */
export interface SystemFlowCcApiPostApiV1SystemFlowCcMarkReadRequest {
    /**
     *  抄送标记已阅请求
     */
    readonly flowCcMarkReadReq: FlowCcMarkReadReq
}
