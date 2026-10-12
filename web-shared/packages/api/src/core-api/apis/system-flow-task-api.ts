import type { FlowTaskConsentReq } from '../models';
import type { FlowTaskGetApprovedListReq } from '../models';
import type { FlowTaskGetClaimListReq } from '../models';
import type { FlowTaskGetDetailReq } from '../models';
import type { FlowTaskGetPendingListReq } from '../models';
import type { FlowTaskOperateReq } from '../models';
import type { FlowTaskRejectReq } from '../models';
import type { FlowTaskSignReq } from '../models';
import type { FlowTaskTransferReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemFlowTaskGetApprovedList200Response } from '../models';
import type { PostApiV1SystemFlowTaskGetClaimList200Response } from '../models';
import type { PostApiV1SystemFlowTaskGetDetail200Response } from '../models';
import type { PostApiV1SystemFlowTaskGetPendingList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemFlowTaskApi - axios parameter creator
 */

/**
* 业务说明：为当前任务新增办理人【userIds 列表】，新增办理人需要一并办理后方可流转到下一节点；可携带操作意见。
* @summary 加签
* @param {FlowTaskSignReq} flowTaskSignReq  加签/减签请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskAddSign (
flowTaskSignReq: FlowTaskSignReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/add-sign`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowTaskSignReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：认领一个组任务【候选任务】，认领后任务办理人收敛为当前认领人，其他候选成员不再可见该任务；仅任务办理人为候选组时允许认领。
* @summary 认领任务
* @param {FlowTaskOperateReq} flowTaskOperateReq  审批任务操作请求（认领/拿回/催办）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskClaim (
flowTaskOperateReq: FlowTaskOperateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/claim`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowTaskOperateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：审批同意当前任务，完成任务并驱动流程流转到下一节点【事务内完成】；可携带审批意见【comment】、签名图片URL【signature】与修改后的表单数据JSON【variable，审批人可修改部分表单字段】；若为会签节点则按全部办理人意见判定。
* @summary 同意审批
* @param {FlowTaskConsentReq} flowTaskConsentReq  同意审批请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskConsent (
flowTaskConsentReq: FlowTaskConsentReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/consent`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowTaskConsentReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户已办理的审批任务列表，支持按任务名、流程名称模糊筛选与办理结论【taskState：complete同意/reject驳回等】筛选；返回办理时间与办理耗时等信息，用于已办列表页展示。
* @summary 我的已办任务分页
* @param {FlowTaskGetApprovedListReq} flowTaskGetApprovedListReq  已办任务分页请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskGetApprovedList (
flowTaskGetApprovedListReq: FlowTaskGetApprovedListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/get-approved-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowTaskGetApprovedList200Response>>(localVarPath, flowTaskGetApprovedListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户所在候选组【角色/部门】可认领的组任务列表；请求未传候选对象列表时由网关按当前登录用户的角色自动解析填充【actorIds】；认领后任务办理人收敛为认领人。
* @summary 可认领任务分页
* @param {FlowTaskGetClaimListReq} flowTaskGetClaimListReq  可认领任务分页请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskGetClaimList (
flowTaskGetClaimListReq: FlowTaskGetClaimListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/get-claim-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowTaskGetClaimList200Response>>(localVarPath, flowTaskGetClaimListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取审批任务详情聚合视图，返回当前任务信息、所属实例ID、表单JSON schema【formSchema】、表单数据【variable】、当前用户操作权限JSON【operationPerm，含同意/驳回/转办/加签等操作开关组与字段级表单权限】以及已产生的审批记录列表；用于审批办理页一次性加载数据，属聚合多源数据的详情视图【故使用 get-detail 例外路径词，理由见设计方案第5节】。
* @summary 获取审批详情
* @param {FlowTaskGetDetailReq} flowTaskGetDetailReq  审批详情请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskGetDetail (
flowTaskGetDetailReq: FlowTaskGetDetailReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/get-detail`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowTaskGetDetail200Response>>(localVarPath, flowTaskGetDetailReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户待办理的审批任务列表，支持按任务名、流程名称模糊筛选；返回任务ID、实例标题、流程名、当前节点名、发起人与任务创建时间等信息，用于审批待办列表页展示。
* @summary 我的待办任务分页
* @param {FlowTaskGetPendingListReq} flowTaskGetPendingListReq  待办任务分页请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskGetPendingList (
flowTaskGetPendingListReq: FlowTaskGetPendingListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/get-pending-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowTaskGetPendingList200Response>>(localVarPath, flowTaskGetPendingListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：发起人或其他办理人拿回已提交的任务重办【reclaim】，仅当下一节点任务尚未办理时允许拿回，拿回后流程回退、当前任务重新回到待办。
* @summary 拿回任务
* @param {FlowTaskOperateReq} flowTaskOperateReq  审批任务操作请求（认领/拿回/催办）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskReclaim (
flowTaskOperateReq: FlowTaskOperateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/reclaim`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowTaskOperateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：驳回当前审批任务，按驳回策略【strategy：toInitiator退回发起人/toPreviousNode退回上一节点/toSpecifiedNode退回指定节点/terminateApproval终止审批/toParentNode退回父流程】回退流程；strategy 为 toSpecifiedNode 时必须传目标节点key【targetNodeKey】；可携带审批意见。
* @summary 驳回审批
* @param {FlowTaskRejectReq} flowTaskRejectReq  驳回审批请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskReject (
flowTaskRejectReq: FlowTaskRejectReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/reject`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowTaskRejectReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：移除当前任务的指定办理人【userIds 列表】；若移除后任务无剩余办理人，任务作废并回退到上一节点重新产生任务；可携带操作意见。
* @summary 减签
* @param {FlowTaskSignReq} flowTaskSignReq  加签/减签请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskRemoveSign (
flowTaskSignReq: FlowTaskSignReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/remove-sign`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowTaskSignReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将当前任务转办给其他用户，任务办理人替换为受让人【toUserId】，原办理人不再办理；可携带转办意见，转办会记录原办理人便于追溯。
* @summary 转办任务
* @param {FlowTaskTransferReq} flowTaskTransferReq  转办请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskTransfer (
flowTaskTransferReq: FlowTaskTransferReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/transfer`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowTaskTransferReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：对当前待办任务发起催办，任务的催办次数加一并向任务办理人发送催办通知事件；用于发起人或上一步办理人提醒当前办理人尽快处理。
* @summary 催办任务
* @param {FlowTaskOperateReq} flowTaskOperateReq  审批任务操作请求（认领/拿回/催办）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowTaskUrge (
flowTaskOperateReq: FlowTaskOperateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/task/urge`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowTaskOperateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemFlowTaskAddSign operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskAddSignRequest {
    /**
     *  加签/减签请求
     */
    readonly flowTaskSignReq: FlowTaskSignReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskClaim operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskClaimRequest {
    /**
     *  审批任务操作请求（认领/拿回/催办）
     */
    readonly flowTaskOperateReq: FlowTaskOperateReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskConsent operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskConsentRequest {
    /**
     *  同意审批请求
     */
    readonly flowTaskConsentReq: FlowTaskConsentReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskGetApprovedList operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskGetApprovedListRequest {
    /**
     *  已办任务分页请求
     */
    readonly flowTaskGetApprovedListReq: FlowTaskGetApprovedListReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskGetClaimList operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskGetClaimListRequest {
    /**
     *  可认领任务分页请求
     */
    readonly flowTaskGetClaimListReq: FlowTaskGetClaimListReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskGetDetail operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskGetDetailRequest {
    /**
     *  审批详情请求
     */
    readonly flowTaskGetDetailReq: FlowTaskGetDetailReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskGetPendingList operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskGetPendingListRequest {
    /**
     *  待办任务分页请求
     */
    readonly flowTaskGetPendingListReq: FlowTaskGetPendingListReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskReclaim operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskReclaimRequest {
    /**
     *  审批任务操作请求（认领/拿回/催办）
     */
    readonly flowTaskOperateReq: FlowTaskOperateReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskReject operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskRejectRequest {
    /**
     *  驳回审批请求
     */
    readonly flowTaskRejectReq: FlowTaskRejectReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskRemoveSign operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskRemoveSignRequest {
    /**
     *  加签/减签请求
     */
    readonly flowTaskSignReq: FlowTaskSignReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskTransfer operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskTransferRequest {
    /**
     *  转办请求
     */
    readonly flowTaskTransferReq: FlowTaskTransferReq
}

/**
 * Request parameters for postApiV1SystemFlowTaskUrge operation in SystemFlowTaskApi.
 */
export interface SystemFlowTaskApiPostApiV1SystemFlowTaskUrgeRequest {
    /**
     *  审批任务操作请求（认领/拿回/催办）
     */
    readonly flowTaskOperateReq: FlowTaskOperateReq
}
