import type { PostApiV1RoadDetectionSampleCreate200Response } from '../models';
import type { PostApiV1RoadDetectionSampleGetList200Response } from '../models';
import type { PostApiV1RoadDetectionSampleGetOne200Response } from '../models';
import type { SampleCreateReq } from '../models';
import type { SampleGetListReq } from '../models';
import type { SampleTransitReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionSampleApi - axios parameter creator
 */

/**
* 登记样品并自动赋码（SP-YYYY-NNNN，序列表年粒度取号），关联委托时回填委托编号与工程名称冗余，写登记首条流转记录
* @summary 登记样品
* @param {SampleCreateReq} sampleCreateReq  样品登记请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSampleCreate (
sampleCreateReq: SampleCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/sample/create`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSampleCreate200Response>>(localVarPath, sampleCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 分页查询样品列表，支持关键字（样品编号/名称/委托编号）、状态、委托 ID 筛选
* @summary 获取样品列表
* @param {SampleGetListReq} sampleGetListReq  样品列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSampleGetList (
sampleGetListReq: SampleGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/sample/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSampleGetList200Response>>(localVarPath, sampleGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按 ID 返回样品主体与流转记录列表（登记/开始检测/检测完成留痕）
* @summary 获取样品详情
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSampleGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/sample/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSampleGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 状态机端点独占状态写入：start_test（待检→试验中）/ finish_test（试验中→已检），乐观锁条件更新并写流转记录
* @summary 样品状态流转
* @param {SampleTransitReq} sampleTransitReq  样品状态流转请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSampleTransit (
sampleTransitReq: SampleTransitReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/sample/transit`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSampleCreate200Response>>(localVarPath, sampleTransitReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionSampleCreate operation in RoadDetectionSampleApi.
 */
export interface RoadDetectionSampleApiPostApiV1RoadDetectionSampleCreateRequest {
    /**
     *  样品登记请求
     */
    readonly sampleCreateReq: SampleCreateReq
}

/**
 * Request parameters for postApiV1RoadDetectionSampleGetList operation in RoadDetectionSampleApi.
 */
export interface RoadDetectionSampleApiPostApiV1RoadDetectionSampleGetListRequest {
    /**
     *  样品列表请求
     */
    readonly sampleGetListReq: SampleGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionSampleGetOne operation in RoadDetectionSampleApi.
 */
export interface RoadDetectionSampleApiPostApiV1RoadDetectionSampleGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionSampleTransit operation in RoadDetectionSampleApi.
 */
export interface RoadDetectionSampleApiPostApiV1RoadDetectionSampleTransitRequest {
    /**
     *  样品状态流转请求
     */
    readonly sampleTransitReq: SampleTransitReq
}
