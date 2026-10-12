import type { PositionBindReq } from '../models';
import type { PositionUnbindReq } from '../models';
import type { PostApiV1RoadDetectionPositionBind200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionPositionApi - axios parameter creator
 */

/**
* 管理员为指定用户批量绑定审核岗位（一人可多岗位，重复绑定幂等跳过）；业务说明：绑定后用户获得对应审核阶位，可执行四阶审核中相应阶段的动作
* @summary 绑定用户岗位
* @param {PositionBindReq} positionBindReq  绑定岗位请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionPositionBind (
positionBindReq: PositionBindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/position/bind`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionPositionBind200Response>>(localVarPath, positionBindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 返回审核岗位字典（COMMON 种子 4 行：检测员/复核人/审核人/批准人，含每岗位已绑定用户数）；业务说明：岗位为审核阶位体系基础数据，level 1-4 用于四阶审核与冲正 N+1 阶位比较
* @summary 获取岗位列表
* @param {object} body  岗位列表请求（无需过滤参数，固定返回种子字典）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionPositionGetList (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/position/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionPositionBind200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 移除指定用户的岗位绑定（幂等，未绑定时无副作用）；业务说明：解绑后用户失去对应审核阶位
* @summary 解绑用户岗位
* @param {PositionUnbindReq} positionUnbindReq  解绑岗位请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionPositionUnbind (
positionUnbindReq: PositionUnbindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/position/unbind`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionPositionBind200Response>>(localVarPath, positionUnbindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionPositionBind operation in RoadDetectionPositionApi.
 */
export interface RoadDetectionPositionApiPostApiV1RoadDetectionPositionBindRequest {
    /**
     *  绑定岗位请求
     */
    readonly positionBindReq: PositionBindReq
}

/**
 * Request parameters for postApiV1RoadDetectionPositionGetList operation in RoadDetectionPositionApi.
 */
export interface RoadDetectionPositionApiPostApiV1RoadDetectionPositionGetListRequest {
    /**
     *  岗位列表请求（无需过滤参数，固定返回种子字典）
     */
    readonly body: object
}

/**
 * Request parameters for postApiV1RoadDetectionPositionUnbind operation in RoadDetectionPositionApi.
 */
export interface RoadDetectionPositionApiPostApiV1RoadDetectionPositionUnbindRequest {
    /**
     *  解绑岗位请求
     */
    readonly positionUnbindReq: PositionUnbindReq
}
