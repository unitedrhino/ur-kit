import type { LedgerGenerateReq } from '../models';
import type { LedgerGetListReq } from '../models';
import type { PostApiV1RoadDetectionLedgerGenerate200Response } from '../models';
import type { PostApiV1RoadDetectionLedgerGetList200Response } from '../models';
import type { PostApiV1RoadDetectionLedgerGetOne200Response } from '../models';
import type { PostApiV1RoadDetectionLedgerGetTypes200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionLedgerApi - axios parameter creator
 */

/**
* 业务说明：按委托与台账类型聚合生成台账条目物化【strength_raw 从锁定键强度族抄录禁止重算 / sample 从样品域投影 / 其余 3 类框架落地】，同委托同类型幂等存在即覆盖更新不取新号；锁定键缺失时明确报错不生成
* @summary 生成台账条目
* @param {LedgerGenerateReq} ledgerGenerateReq  生成台账条目请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionLedgerGenerate (
ledgerGenerateReq: LedgerGenerateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/ledger/generate`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionLedgerGenerate200Response>>(localVarPath, ledgerGenerateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询台账条目列表，支持台账类型/委托 ID/月份过滤，列表项回填台账类型中文名与委托编号/工程名称冗余，按生成时间倒序；每页大小上限 200
* @summary 获取台账条目列表
* @param {LedgerGetListReq} ledgerGetListReq  台账条目列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionLedgerGetList (
ledgerGetListReq: LedgerGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/ledger/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionLedgerGetList200Response>>(localVarPath, ledgerGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按 ID 返回台账条目详情【条目内容 ItemJSON 按 ledgerType 解析对应结构 + 来源键清单】，5 类异构结构定义见域内 ledgerType 定稿
* @summary 获取台账条目详情
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionLedgerGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/ledger/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionLedgerGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：返回 5 类台账类型字典【样品取样/混凝土砂浆强度原始数据/混凝土砂浆试件取样/现场检测/试验室工作】，每项含类型编码/中文标签/数据源现状说明，供台账生成页选择类型
* @summary 获取台账类型字典
* @param {object} body  台账类型字典查询请求（固定返回 5 类）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionLedgerGetTypes (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/ledger/get-types`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionLedgerGetTypes200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionLedgerGenerate operation in RoadDetectionLedgerApi.
 */
export interface RoadDetectionLedgerApiPostApiV1RoadDetectionLedgerGenerateRequest {
    /**
     *  生成台账条目请求
     */
    readonly ledgerGenerateReq: LedgerGenerateReq
}

/**
 * Request parameters for postApiV1RoadDetectionLedgerGetList operation in RoadDetectionLedgerApi.
 */
export interface RoadDetectionLedgerApiPostApiV1RoadDetectionLedgerGetListRequest {
    /**
     *  台账条目列表请求
     */
    readonly ledgerGetListReq: LedgerGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionLedgerGetOne operation in RoadDetectionLedgerApi.
 */
export interface RoadDetectionLedgerApiPostApiV1RoadDetectionLedgerGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionLedgerGetTypes operation in RoadDetectionLedgerApi.
 */
export interface RoadDetectionLedgerApiPostApiV1RoadDetectionLedgerGetTypesRequest {
    /**
     *  台账类型字典查询请求（固定返回 5 类）
     */
    readonly body: object
}
