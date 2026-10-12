import type { FlowInstanceGetListReq } from '../models';
import type { FlowInstanceGetRecordReq } from '../models';
import type { FlowInstanceOperateReq } from '../models';
import type { FlowInstanceRevokeReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemFlowInstanceGetMonitorList200Response } from '../models';
import type { PostApiV1SystemFlowInstanceGetRecord200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemFlowInstanceApi - axios parameter creator
 */

/**
* 业务说明：管理员将流程实例作废【destroy】，实例归档并标记为作废，不可再办理；可携带操作原因，用于错误发起或长期不处理的实例清理。
* @summary 作废流程实例
* @param {FlowInstanceOperateReq} flowInstanceOperateReq  流程实例管理操作请求（终止/恢复/作废）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowInstanceDestroy (
flowInstanceOperateReq: FlowInstanceOperateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/instance/destroy`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowInstanceOperateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：管理员分页查询本租户全部流程实例【含他人发起的】，支持按实例标题模糊、流程编码、实例状态、发起人筛选；用于管理员实例监控列表页。
* @summary 实例监控分页
* @param {FlowInstanceGetListReq} flowInstanceGetListReq  流程实例分页请求（我的申请/实例监控共用）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowInstanceGetMonitorList (
flowInstanceGetListReq: FlowInstanceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/instance/get-monitor-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowInstanceGetMonitorList200Response>>(localVarPath, flowInstanceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户发起的流程实例列表，支持按实例标题模糊、流程编码、实例状态筛选；返回实例当前节点名与耗时等信息，用于我的申请列表页展示。
* @summary 我的申请分页
* @param {FlowInstanceGetListReq} flowInstanceGetListReq  流程实例分页请求（我的申请/实例监控共用）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowInstanceGetMyList (
flowInstanceGetListReq: FlowInstanceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/instance/get-my-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowInstanceGetMonitorList200Response>>(localVarPath, flowInstanceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取流程实例的审批记录时间线，按办理时间升序返回各历史任务的节点名、类型【审批/抄送/转办/委派/拿回等】、办理结论、实际办理人、审批意见与参与人列表；用于审批详情页的时间线展示，属单实例办理轨迹聚合视图【故使用 get-record 例外路径词，理由见设计方案第5节】。
* @summary 获取审批记录时间线
* @param {FlowInstanceGetRecordReq} flowInstanceGetRecordReq  审批记录时间线请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowInstanceGetRecord (
flowInstanceGetRecordReq: FlowInstanceGetRecordReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/instance/get-record`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowInstanceGetRecord200Response>>(localVarPath, flowInstanceGetRecordReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：管理员将被挂起【suspend】的流程实例恢复为运行【active】状态，恢复后任务可继续办理；可携带操作原因。
* @summary 恢复流程实例
* @param {FlowInstanceOperateReq} flowInstanceOperateReq  流程实例管理操作请求（终止/恢复/作废）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowInstanceResume (
flowInstanceOperateReq: FlowInstanceOperateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/instance/resume`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowInstanceOperateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：发起人撤销自己发起的流程实例，仅当实例仍在运行【active】时允许撤销，撤销后整单作废【cancel】；可携带撤销原因。
* @summary 撤销流程实例
* @param {FlowInstanceRevokeReq} flowInstanceRevokeReq  撤销流程实例请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowInstanceRevoke (
flowInstanceRevokeReq: FlowInstanceRevokeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/instance/revoke`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowInstanceRevokeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：管理员挂起运行中的流程实例【suspend】，挂起期间任务不可办理；可携带操作原因，用于流程需要临时冻结的场景。
* @summary 终止流程实例
* @param {FlowInstanceOperateReq} flowInstanceOperateReq  流程实例管理操作请求（终止/恢复/作废）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowInstanceTerminate (
flowInstanceOperateReq: FlowInstanceOperateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/instance/terminate`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowInstanceOperateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemFlowInstanceDestroy operation in SystemFlowInstanceApi.
 */
export interface SystemFlowInstanceApiPostApiV1SystemFlowInstanceDestroyRequest {
    /**
     *  流程实例管理操作请求（终止/恢复/作废）
     */
    readonly flowInstanceOperateReq: FlowInstanceOperateReq
}

/**
 * Request parameters for postApiV1SystemFlowInstanceGetMonitorList operation in SystemFlowInstanceApi.
 */
export interface SystemFlowInstanceApiPostApiV1SystemFlowInstanceGetMonitorListRequest {
    /**
     *  流程实例分页请求（我的申请/实例监控共用）
     */
    readonly flowInstanceGetListReq: FlowInstanceGetListReq
}

/**
 * Request parameters for postApiV1SystemFlowInstanceGetMyList operation in SystemFlowInstanceApi.
 */
export interface SystemFlowInstanceApiPostApiV1SystemFlowInstanceGetMyListRequest {
    /**
     *  流程实例分页请求（我的申请/实例监控共用）
     */
    readonly flowInstanceGetListReq: FlowInstanceGetListReq
}

/**
 * Request parameters for postApiV1SystemFlowInstanceGetRecord operation in SystemFlowInstanceApi.
 */
export interface SystemFlowInstanceApiPostApiV1SystemFlowInstanceGetRecordRequest {
    /**
     *  审批记录时间线请求
     */
    readonly flowInstanceGetRecordReq: FlowInstanceGetRecordReq
}

/**
 * Request parameters for postApiV1SystemFlowInstanceResume operation in SystemFlowInstanceApi.
 */
export interface SystemFlowInstanceApiPostApiV1SystemFlowInstanceResumeRequest {
    /**
     *  流程实例管理操作请求（终止/恢复/作废）
     */
    readonly flowInstanceOperateReq: FlowInstanceOperateReq
}

/**
 * Request parameters for postApiV1SystemFlowInstanceRevoke operation in SystemFlowInstanceApi.
 */
export interface SystemFlowInstanceApiPostApiV1SystemFlowInstanceRevokeRequest {
    /**
     *  撤销流程实例请求
     */
    readonly flowInstanceRevokeReq: FlowInstanceRevokeReq
}

/**
 * Request parameters for postApiV1SystemFlowInstanceTerminate operation in SystemFlowInstanceApi.
 */
export interface SystemFlowInstanceApiPostApiV1SystemFlowInstanceTerminateRequest {
    /**
     *  流程实例管理操作请求（终止/恢复/作废）
     */
    readonly flowInstanceOperateReq: FlowInstanceOperateReq
}
