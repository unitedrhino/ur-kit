import type { FlowProcessGetLaunchListReq } from '../models';
import type { FlowProcessLaunchReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemFlowProcessGetLaunchList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemFlowProcessApi - axios parameter creator
 */

/**
* 业务说明：获取当前用户可发起的流程列表，仅返回已发布【published】状态的流程定义，同时返回流程分类分组列表；列表按最近使用排序，前端用于发起流程的选择页【分类分组+流程卡片聚合视图，同一视图返回两类数据，故使用 get-launch-list 例外路径词，理由见设计方案第5节】。
* @summary 获取可发起流程列表
* @param {FlowProcessGetLaunchListReq} flowProcessGetLaunchListReq  可发起流程列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowProcessGetLaunchList (
flowProcessGetLaunchListReq: FlowProcessGetLaunchListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/process/get-launch-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowProcessGetLaunchList200Response>>(localVarPath, flowProcessGetLaunchListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按流程编码发起一个流程实例，传入流程编码【processCode】、业务单据键【businessKey，可空】、实例标题【title，可空】与流程变量JSON【variable，表单数据扁平化键值对】；引擎解析流程JSON模型创建首节点任务并产生抄送，调用者为实例发起人。
* @summary 发起流程
* @param {FlowProcessLaunchReq} flowProcessLaunchReq  发起流程请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowProcessLaunch (
flowProcessLaunchReq: FlowProcessLaunchReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/process/launch`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, flowProcessLaunchReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemFlowProcessGetLaunchList operation in SystemFlowProcessApi.
 */
export interface SystemFlowProcessApiPostApiV1SystemFlowProcessGetLaunchListRequest {
    /**
     *  可发起流程列表请求
     */
    readonly flowProcessGetLaunchListReq: FlowProcessGetLaunchListReq
}

/**
 * Request parameters for postApiV1SystemFlowProcessLaunch operation in SystemFlowProcessApi.
 */
export interface SystemFlowProcessApiPostApiV1SystemFlowProcessLaunchRequest {
    /**
     *  发起流程请求
     */
    readonly flowProcessLaunchReq: FlowProcessLaunchReq
}
