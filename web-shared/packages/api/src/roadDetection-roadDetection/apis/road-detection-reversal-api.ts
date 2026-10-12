import type { PostApiV1RoadDetectionReversalApprove200Response } from '../models';
import type { PostApiV1RoadDetectionReversalBase200Response } from '../models';
import type { PostApiV1RoadDetectionReversalGetDiff200Response } from '../models';
import type { PostApiV1RoadDetectionReversalGetList200Response } from '../models';
import type { ReversalBaseReq } from '../models';
import type { ReversalCreateReq } from '../models';
import type { ReversalDecisionReq } from '../models';
import type { ReversalGetDiffReq } from '../models';
import type { ReversalGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionReversalApi - axios parameter creator
 */

/**
* 审批通过冲正申请（单事务九步生效）；业务说明：审批人最高阶位须严格高于申请人阶位快照（N+1，隐含禁止自审），通过后单事务完成条件更新决策、基线版本校验、旧版标记冲正替代、新版本落库重跑计算链、锁定键更新、作业树推进、新版本回填与报告联动（已完成报告置为已废止并留审计三字段，审核中与已生成报告作废留痕）；基线版本已变化时整体回滚拒绝
* @summary 冲正审批通过
* @param {ReversalDecisionReq} reversalDecisionReq  冲正审批请求（approve/reject 共用）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReversalApprove (
reversalDecisionReq: ReversalDecisionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/reversal/approve`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionReversalApprove200Response>>(localVarPath, reversalDecisionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 返回节点最新版本原始数据供修正表单预填基线；业务说明：按委托与节点取版本号最大的原始数据提交记录，无提交记录时版本为 0 且原始数据为空对象
* @summary 获取修正基线
* @param {ReversalBaseReq} reversalBaseReq  获取修正基线请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReversalBase (
reversalBaseReq: ReversalBaseReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/reversal/base`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionReversalBase200Response>>(localVarPath, reversalBaseReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 对已提交试验数据的节点发起冲正申请（原始数据不动，批准后生成新版本）；业务说明：委托须处于检测中且节点须在计算链映射内，冲正原因限白名单（数据录入错误/测量仪器偏差/计算公式有误/其他），修正数据须为非空槽位键值 JSON 对象且满足必填槽，仅提交过数据的节点可冲正；申请时快照申请人阶位与基线版本
* @summary 发起冲正申请
* @param {ReversalCreateReq} reversalCreateReq  发起冲正申请请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReversalCreate (
reversalCreateReq: ReversalCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/reversal/create`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionReversalApprove200Response>>(localVarPath, reversalCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按冲正申请对比基线原始数据与修正数据的差异；业务说明：服务端按申请记录的基线版本取原始数据行与修正数据 JSON 对比，返回槽位键并集中取值不等的项（单侧存在的键缺失侧显示为空串），供审批人核对修正内容
* @summary 获取冲正版本差异
* @param {ReversalGetDiffReq} reversalGetDiffReq  获取冲正版本差异请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReversalGetDiff (
reversalGetDiffReq: ReversalGetDiffReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/reversal/get-diff`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionReversalGetDiff200Response>>(localVarPath, reversalGetDiffReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询冲正申请列表，支持委托 ID 过滤与状态过滤（待审批/已批准/已驳回），按申请时间倒序返回
* @summary 获取冲正申请列表
* @param {ReversalGetListReq} reversalGetListReq  冲正申请列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReversalGetList (
reversalGetListReq: ReversalGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/reversal/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionReversalGetList200Response>>(localVarPath, reversalGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 驳回冲正申请（仅置状态为已驳回，不动任何数据）；业务说明：仅待审批状态的申请可处理，审批意见可选填，重复处理返回已被处理
* @summary 冲正审批驳回
* @param {ReversalDecisionReq} reversalDecisionReq  冲正审批请求（approve/reject 共用）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReversalReject (
reversalDecisionReq: ReversalDecisionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/reversal/reject`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionReversalApprove200Response>>(localVarPath, reversalDecisionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionReversalApprove operation in RoadDetectionReversalApi.
 */
export interface RoadDetectionReversalApiPostApiV1RoadDetectionReversalApproveRequest {
    /**
     *  冲正审批请求（approve/reject 共用）
     */
    readonly reversalDecisionReq: ReversalDecisionReq
}

/**
 * Request parameters for postApiV1RoadDetectionReversalBase operation in RoadDetectionReversalApi.
 */
export interface RoadDetectionReversalApiPostApiV1RoadDetectionReversalBaseRequest {
    /**
     *  获取修正基线请求
     */
    readonly reversalBaseReq: ReversalBaseReq
}

/**
 * Request parameters for postApiV1RoadDetectionReversalCreate operation in RoadDetectionReversalApi.
 */
export interface RoadDetectionReversalApiPostApiV1RoadDetectionReversalCreateRequest {
    /**
     *  发起冲正申请请求
     */
    readonly reversalCreateReq: ReversalCreateReq
}

/**
 * Request parameters for postApiV1RoadDetectionReversalGetDiff operation in RoadDetectionReversalApi.
 */
export interface RoadDetectionReversalApiPostApiV1RoadDetectionReversalGetDiffRequest {
    /**
     *  获取冲正版本差异请求
     */
    readonly reversalGetDiffReq: ReversalGetDiffReq
}

/**
 * Request parameters for postApiV1RoadDetectionReversalGetList operation in RoadDetectionReversalApi.
 */
export interface RoadDetectionReversalApiPostApiV1RoadDetectionReversalGetListRequest {
    /**
     *  冲正申请列表请求
     */
    readonly reversalGetListReq: ReversalGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionReversalReject operation in RoadDetectionReversalApi.
 */
export interface RoadDetectionReversalApiPostApiV1RoadDetectionReversalRejectRequest {
    /**
     *  冲正审批请求（approve/reject 共用）
     */
    readonly reversalDecisionReq: ReversalDecisionReq
}
