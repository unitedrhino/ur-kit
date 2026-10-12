import type { PostApiV1RoadDetectionTraceGetCommissionTrace200Response } from '../models';
import type { PostApiV1RoadDetectionTraceGetValueTrace200Response } from '../models';
import type { TraceGetCommissionReq } from '../models';
import type { TraceGetValueReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionTraceApi - axios parameter creator
 */

/**
* 业务说明：按委托 ID 组装五层溯源投影【L1 识别记录实投影 + L4 原始提交族与链结果族历史版本全量 + 锁定键当前全量 + L5 实例清单含版本锁定三元组 + L2/L3 占位层】，raw/trace/output/draft JSON 原样透传由前端展开；委托不存在或跨租户报错
* @summary 获取委托维度五层溯源投影
* @param {TraceGetCommissionReq} traceGetCommissionReq  委托溯源投影请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTraceGetCommissionTrace (
traceGetCommissionReq: TraceGetCommissionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/trace/get-commission-trace`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionTraceGetCommissionTrace200Response>>(localVarPath, traceGetCommissionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按实例 ID 逐值投影数据来源【读实例全部数据值，按 P1.7 槽位绑定映射判定来源类型：锁定键值回填产出链与版本，数据源袋值标 ctx，公式计算值标 formula，无法判定标 unknown】；绑定映射缺失或坏数据降级 unknown 不报错（溯源是读侧增强能力）
* @summary 获取值级溯源投影
* @param {TraceGetValueReq} traceGetValueReq  值级溯源请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTraceGetValueTrace (
traceGetValueReq: TraceGetValueReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/trace/get-value-trace`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionTraceGetValueTrace200Response>>(localVarPath, traceGetValueReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionTraceGetCommissionTrace operation in RoadDetectionTraceApi.
 */
export interface RoadDetectionTraceApiPostApiV1RoadDetectionTraceGetCommissionTraceRequest {
    /**
     *  委托溯源投影请求
     */
    readonly traceGetCommissionReq: TraceGetCommissionReq
}

/**
 * Request parameters for postApiV1RoadDetectionTraceGetValueTrace operation in RoadDetectionTraceApi.
 */
export interface RoadDetectionTraceApiPostApiV1RoadDetectionTraceGetValueTraceRequest {
    /**
     *  值级溯源请求
     */
    readonly traceGetValueReq: TraceGetValueReq
}
