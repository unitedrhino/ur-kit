import type { PostApiV1RoadDetectionSummaryGenerate200Response } from '../models';
import type { PostApiV1RoadDetectionSummaryGetCatalog200Response } from '../models';
import type { PostApiV1RoadDetectionSummaryGetList200Response } from '../models';
import type { PostApiV1RoadDetectionSummaryGetOne200Response } from '../models';
import type { PostApiV1RoadDetectionSummaryVerifyConsistency200Response } from '../models';
import type { SummaryGenerateReq } from '../models';
import type { SummaryGetListReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionSummaryApi - axios parameter creator
 */

/**
* 业务说明：按委托与目录从锁定键只读抄录物化汇总值袋【禁止重算，decimal 文本原样】并登记来源锁定键清单；同委托同目录重新生成 = 覆盖更新；锁定键缺失时明确报错不生成空汇总，P3a 仅 JH27 配置了实列骨架
* @summary 生成JH汇总记录
* @param {SummaryGenerateReq} summaryGenerateReq  生成汇总记录请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSummaryGenerate (
summaryGenerateReq: SummaryGenerateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/summary/generate`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSummaryGenerate200Response>>(localVarPath, summaryGenerateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：返回 JH 汇总表目录【四大类分组：材料/施工/现场/专项，common 种子只读共享】，每行含编码/名称/对应 GLQ/GLP 源表/汇总列骨架，供汇总表生成页选择目录与列预览
* @summary 获取JH汇总目录
* @param {object} body  汇总目录查询请求（固定返回全部四大类分组）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSummaryGetCatalog (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/summary/get-catalog`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSummaryGetCatalog200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询汇总记录列表，支持目录编码/委托 ID/月份过滤，列表项回填目录名称与委托编号/工程名称冗余，按生成时间倒序
* @summary 获取汇总记录列表
* @param {SummaryGetListReq} summaryGetListReq  汇总记录列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSummaryGetList (
summaryGetListReq: SummaryGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/summary/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSummaryGetList200Response>>(localVarPath, summaryGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按 ID 返回汇总记录详情【汇总值袋逐列 + 来源锁定键清单】，供汇总表查看与一致性核对入口
* @summary 获取汇总记录详情
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSummaryGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/summary/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSummaryGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：M3 验收门端点——重新收集来源锁定键当前值与记录值袋逐键比对【文本原样比对优先、decimal 等值兜底】，返回是否一致与逐键差异明细（存储值/当前值）；ctx 来源列不在比对锚点内
* @summary 汇总一致性校验
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionSummaryVerifyConsistency (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/summary/verify-consistency`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionSummaryVerifyConsistency200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionSummaryGenerate operation in RoadDetectionSummaryApi.
 */
export interface RoadDetectionSummaryApiPostApiV1RoadDetectionSummaryGenerateRequest {
    /**
     *  生成汇总记录请求
     */
    readonly summaryGenerateReq: SummaryGenerateReq
}

/**
 * Request parameters for postApiV1RoadDetectionSummaryGetCatalog operation in RoadDetectionSummaryApi.
 */
export interface RoadDetectionSummaryApiPostApiV1RoadDetectionSummaryGetCatalogRequest {
    /**
     *  汇总目录查询请求（固定返回全部四大类分组）
     */
    readonly body: object
}

/**
 * Request parameters for postApiV1RoadDetectionSummaryGetList operation in RoadDetectionSummaryApi.
 */
export interface RoadDetectionSummaryApiPostApiV1RoadDetectionSummaryGetListRequest {
    /**
     *  汇总记录列表请求
     */
    readonly summaryGetListReq: SummaryGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionSummaryGetOne operation in RoadDetectionSummaryApi.
 */
export interface RoadDetectionSummaryApiPostApiV1RoadDetectionSummaryGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionSummaryVerifyConsistency operation in RoadDetectionSummaryApi.
 */
export interface RoadDetectionSummaryApiPostApiV1RoadDetectionSummaryVerifyConsistencyRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}
