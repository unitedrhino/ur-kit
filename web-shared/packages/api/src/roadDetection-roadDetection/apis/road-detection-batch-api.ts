import type { BatchGetLogsReq } from '../models';
import type { BatchScopeReq } from '../models';
import type { PostApiV1RoadDetectionBatchExecute200Response } from '../models';
import type { PostApiV1RoadDetectionBatchGetLogs200Response } from '../models';
import type { PostApiV1RoadDetectionBatchPreview200Response } from '../models';
import type { PostApiV1RoadDetectionBatchUndo200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionBatchApi - axios parameter creator
 */

/**
* 业务说明：三步向导第二步——单事务内逐委托修改工程名称【只改委托元数据，试验数值改动一律走冲正】+ 联动刷新【受影响委托的汇总记录重汇聚与台账条目重聚合，取新工程名称】+ 日志落库【记录逐条 old/new 反向补丁与联动刷新清单】；任一委托失败整体回滚；月报快照不回溯仅提示
* @summary 批量修改执行
* @param {BatchScopeReq} batchScopeReq  批量修改范围请求（preview/execute 三步向导共用：第一步配置范围，第二步原样传回执行）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionBatchExecute (
batchScopeReq: BatchScopeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/batch/execute`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionBatchExecute200Response>>(localVarPath, batchScopeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询批量修改操作日志【修改范围/反向补丁/受影响数/联动刷新清单/是否已撤销】，按执行时间倒序；每页大小上限 200
* @summary 批量修改日志列表
* @param {BatchGetLogsReq} batchGetLogsReq  批量修改日志列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionBatchGetLogs (
batchGetLogsReq: BatchGetLogsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/batch/get-logs`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionBatchGetLogs200Response>>(localVarPath, batchGetLogsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：三步向导第一步——按修改范围【委托编码列表或工程名称模糊过滤，可同时传取并集】与字段组【第一版仅 project_info 支持修改，date/personnel 暂无数据锚点】返回受影响委托清单【当前值/新值 diff】与联动影响预估【各委托已有汇总记录数/台账条目数】及月报不回溯提示，不落库
* @summary 批量修改预览
* @param {BatchScopeReq} batchScopeReq  批量修改范围请求（preview/execute 三步向导共用：第一步配置范围，第二步原样传回执行）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionBatchPreview (
batchScopeReq: BatchScopeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/batch/preview`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionBatchPreview200Response>>(localVarPath, batchScopeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：三步向导回退——仅最近一次未撤销的批量修改可撤销【更早的或已撤销的拒绝】，单事务内按反向补丁将工程名称写回旧值 + 再联动刷新汇总与台账 + 日志标记撤销时点
* @summary 批量修改撤销
* @param {object} body  批量修改撤销请求（固定撤销最近一次未撤销的批量修改，无需传 ID）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionBatchUndo (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/batch/undo`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionBatchUndo200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionBatchExecute operation in RoadDetectionBatchApi.
 */
export interface RoadDetectionBatchApiPostApiV1RoadDetectionBatchExecuteRequest {
    /**
     *  批量修改范围请求（preview/execute 三步向导共用：第一步配置范围，第二步原样传回执行）
     */
    readonly batchScopeReq: BatchScopeReq
}

/**
 * Request parameters for postApiV1RoadDetectionBatchGetLogs operation in RoadDetectionBatchApi.
 */
export interface RoadDetectionBatchApiPostApiV1RoadDetectionBatchGetLogsRequest {
    /**
     *  批量修改日志列表请求
     */
    readonly batchGetLogsReq: BatchGetLogsReq
}

/**
 * Request parameters for postApiV1RoadDetectionBatchPreview operation in RoadDetectionBatchApi.
 */
export interface RoadDetectionBatchApiPostApiV1RoadDetectionBatchPreviewRequest {
    /**
     *  批量修改范围请求（preview/execute 三步向导共用：第一步配置范围，第二步原样传回执行）
     */
    readonly batchScopeReq: BatchScopeReq
}

/**
 * Request parameters for postApiV1RoadDetectionBatchUndo operation in RoadDetectionBatchApi.
 */
export interface RoadDetectionBatchApiPostApiV1RoadDetectionBatchUndoRequest {
    /**
     *  批量修改撤销请求（固定撤销最近一次未撤销的批量修改，无需传 ID）
     */
    readonly body: object
}
