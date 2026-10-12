import type { PostApiV1RoadDetectionInstanceCreate200Response } from '../models';
import type { PostApiV1RoadDetectionReviewGetList200Response } from '../models';
import type { PostApiV1RoadDetectionReviewGetLogs200Response } from '../models';
import type { ReviewActionReq } from '../models';
import type { ReviewGetListReq } from '../models';
import type { ReviewGetLogsReq } from '../models';
import type { ReviewSubmitReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionReviewApi - axios parameter creator
 */

/**
* 审核逐级推进（review1→review2→review3→approval→done）；业务说明：操作人审核阶位须达到当前阶段要求（二阶/三阶/三阶/四阶，高阶可代办低阶），推进到 done 时写入锁定时间并将签章状态置为待签章，全程条件更新防并发
* @summary 审核推进
* @param {ReviewActionReq} reviewActionReq  审核动作请求（approve/reject/void 共用）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReviewApprove (
reviewActionReq: ReviewActionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/review/approve`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionInstanceCreate200Response>>(localVarPath, reviewActionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询报告实例审核列表，支持状态多选、委托 ID、报告编号过滤；审核中心按九态筛选待办（如 review1 待一审），列表项含委托编号冗余展示
* @summary 获取审核中心列表
* @param {ReviewGetListReq} reviewGetListReq  审核中心列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReviewGetList (
reviewGetListReq: ReviewGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/review/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionReviewGetList200Response>>(localVarPath, reviewGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按实例 ID 返回审核流转日志列表（submitReview/approve/reject/void 全留痕，按时间升序）；时间线展示每步 from/to 状态、操作人、原因
* @summary 获取实例审核历史
* @param {ReviewGetLogsReq} reviewGetLogsReq  审核日志查询请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReviewGetLogs (
reviewGetLogsReq: ReviewGetLogsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/review/get-logs`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionReviewGetLogs200Response>>(localVarPath, reviewGetLogsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 驳回审核中的报告实例（终态 rejected，不可恢复）；业务说明：仅审核中的实例可驳回，操作人阶位须达到当前阶段要求，驳回原因必填且不超过 500 字
* @summary 审核驳回
* @param {ReviewActionReq} reviewActionReq  审核动作请求（approve/reject/void 共用）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReviewReject (
reviewActionReq: ReviewActionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/review/reject`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionInstanceCreate200Response>>(localVarPath, reviewActionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 报告实例送审（状态 generated → review1）；业务说明：需操作人持有检测员（tester）岗位，实例必须关联委托且同委托当前无审核中实例（防重复送审），满足后进入一审
* @summary 报告送审
* @param {ReviewSubmitReq} reviewSubmitReq  送审请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReviewSubmit (
reviewSubmitReq: ReviewSubmitReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/review/submit`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionInstanceCreate200Response>>(localVarPath, reviewSubmitReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 作废审核中的报告实例（终态 void，不可恢复）；业务说明：仅审核中的实例可作废，操作人阶位须达到当前阶段要求，作废原因必填且不超过 500 字
* @summary 审核作废
* @param {ReviewActionReq} reviewActionReq  审核动作请求（approve/reject/void 共用）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionReviewVoid (
reviewActionReq: ReviewActionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/review/void`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionInstanceCreate200Response>>(localVarPath, reviewActionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionReviewApprove operation in RoadDetectionReviewApi.
 */
export interface RoadDetectionReviewApiPostApiV1RoadDetectionReviewApproveRequest {
    /**
     *  审核动作请求（approve/reject/void 共用）
     */
    readonly reviewActionReq: ReviewActionReq
}

/**
 * Request parameters for postApiV1RoadDetectionReviewGetList operation in RoadDetectionReviewApi.
 */
export interface RoadDetectionReviewApiPostApiV1RoadDetectionReviewGetListRequest {
    /**
     *  审核中心列表请求
     */
    readonly reviewGetListReq: ReviewGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionReviewGetLogs operation in RoadDetectionReviewApi.
 */
export interface RoadDetectionReviewApiPostApiV1RoadDetectionReviewGetLogsRequest {
    /**
     *  审核日志查询请求
     */
    readonly reviewGetLogsReq: ReviewGetLogsReq
}

/**
 * Request parameters for postApiV1RoadDetectionReviewReject operation in RoadDetectionReviewApi.
 */
export interface RoadDetectionReviewApiPostApiV1RoadDetectionReviewRejectRequest {
    /**
     *  审核动作请求（approve/reject/void 共用）
     */
    readonly reviewActionReq: ReviewActionReq
}

/**
 * Request parameters for postApiV1RoadDetectionReviewSubmit operation in RoadDetectionReviewApi.
 */
export interface RoadDetectionReviewApiPostApiV1RoadDetectionReviewSubmitRequest {
    /**
     *  送审请求
     */
    readonly reviewSubmitReq: ReviewSubmitReq
}

/**
 * Request parameters for postApiV1RoadDetectionReviewVoid operation in RoadDetectionReviewApi.
 */
export interface RoadDetectionReviewApiPostApiV1RoadDetectionReviewVoidRequest {
    /**
     *  审核动作请求（approve/reject/void 共用）
     */
    readonly reviewActionReq: ReviewActionReq
}
