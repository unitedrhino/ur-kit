import type { MonthlyGenerateReq } from '../models';
import type { MonthlyGetListReq } from '../models';
import type { MonthlyUpdateReq } from '../models';
import type { PostApiV1RoadDetectionMonthlyGenerate200Response } from '../models';
import type { PostApiV1RoadDetectionMonthlyGetList200Response } from '../models';
import type { PostApiV1RoadDetectionMonthlyGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionMonthlyApi - axios parameter creator
 */

/**
* 业务说明：按月份与工程聚合生成月报 4 板块快照物化【工作量统计从台账条目按月计数 / 项目分布从委托按工程名分组 / 不合格汇总第一版恒空（锁定键无判定键） / 设备使用手填空数组】，同月份同工程 draft 重复生成覆盖更新，published 拒绝重新生成
* @summary 生成月报快照
* @param {MonthlyGenerateReq} monthlyGenerateReq  生成月报快照请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionMonthlyGenerate (
monthlyGenerateReq: MonthlyGenerateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/monthly/generate`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionMonthlyGenerate200Response>>(localVarPath, monthlyGenerateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询月报快照列表，支持月份/工程名称过滤，按生成时间倒序；每页大小上限 200
* @summary 获取月报列表
* @param {MonthlyGetListReq} monthlyGetListReq  月报列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionMonthlyGetList (
monthlyGetListReq: MonthlyGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/monthly/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionMonthlyGetList200Response>>(localVarPath, monthlyGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按 ID 返回月报快照详情【4 板块结构化：工作量统计/项目分布/不合格汇总/设备使用】
* @summary 获取月报详情
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionMonthlyGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/monthly/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionMonthlyGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：维护月报快照可编辑字段【工作量统计计划数 planCount（按统计项匹配更新）与设备使用板块（整体替换）】，支持 status=draft→published 单向发布；published 定稿后拒绝任何变更（快照不回溯）
* @summary 维护月报可编辑字段
* @param {MonthlyUpdateReq} monthlyUpdateReq  月报可编辑字段维护请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionMonthlyUpdate (
monthlyUpdateReq: MonthlyUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/monthly/update`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionMonthlyGetOne200Response>>(localVarPath, monthlyUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionMonthlyGenerate operation in RoadDetectionMonthlyApi.
 */
export interface RoadDetectionMonthlyApiPostApiV1RoadDetectionMonthlyGenerateRequest {
    /**
     *  生成月报快照请求
     */
    readonly monthlyGenerateReq: MonthlyGenerateReq
}

/**
 * Request parameters for postApiV1RoadDetectionMonthlyGetList operation in RoadDetectionMonthlyApi.
 */
export interface RoadDetectionMonthlyApiPostApiV1RoadDetectionMonthlyGetListRequest {
    /**
     *  月报列表请求
     */
    readonly monthlyGetListReq: MonthlyGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionMonthlyGetOne operation in RoadDetectionMonthlyApi.
 */
export interface RoadDetectionMonthlyApiPostApiV1RoadDetectionMonthlyGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionMonthlyUpdate operation in RoadDetectionMonthlyApi.
 */
export interface RoadDetectionMonthlyApiPostApiV1RoadDetectionMonthlyUpdateRequest {
    /**
     *  月报可编辑字段维护请求
     */
    readonly monthlyUpdateReq: MonthlyUpdateReq
}
