import type { PostApiV1RoadDetectionEventGetList200Response } from '../models';
import type { PostApiV1RoadDetectionEventGetOne200Response } from '../models';
import type { RoadDetectionEventGetListReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionEventApi - axios parameter creator
 */

/**
* 获取道路检测事件列表（骨架阶段返回空列表或模拟数据，后续对接真实检测数据源）
* @summary 获取道路检测事件列表
* @param {RoadDetectionEventGetListReq} roadDetectionEventGetListReq  道路检测事件列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionEventGetList (
roadDetectionEventGetListReq: RoadDetectionEventGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/event/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionEventGetList200Response>>(localVarPath, roadDetectionEventGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据事件 ID 获取道路检测事件详情
* @summary 获取道路检测事件详情
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionEventGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/event/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionEventGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionEventGetList operation in RoadDetectionEventApi.
 */
export interface RoadDetectionEventApiPostApiV1RoadDetectionEventGetListRequest {
    /**
     *  道路检测事件列表请求
     */
    readonly roadDetectionEventGetListReq: RoadDetectionEventGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionEventGetOne operation in RoadDetectionEventApi.
 */
export interface RoadDetectionEventApiPostApiV1RoadDetectionEventGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}
