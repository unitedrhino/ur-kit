import type { CardDailyUsageReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCreate200Response } from '../models';
import type { PostApiV1ThingsCardDailyUsageGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardDailyUsageApi - axios parameter creator
 */

/**
* 业务说明：读取当前企业指定通道卡号日期的本地日总量快照，日期时区暂定东八区待官方核验
* @summary 查询单卡日总量
* @param {CardDailyUsageReq} cardDailyUsageReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardDailyUsageGetList (
cardDailyUsageReq: CardDailyUsageReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/daily-usage/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardDailyUsageGetList200Response>>(localVarPath, cardDailyUsageReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：仅同步显式绑定卡的近七日某一天日总量，APN 仅保存名称，不从空结果推断零用量
* @summary 同步单卡日总量
* @param {CardDailyUsageReq} cardDailyUsageReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardDailyUsageSync (
cardDailyUsageReq: CardDailyUsageReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/daily-usage/sync`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, cardDailyUsageReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardDailyUsageGetList operation in CardDailyUsageApi.
 */
export interface CardDailyUsageApiPostApiV1ThingsCardDailyUsageGetListRequest {
    readonly cardDailyUsageReq: CardDailyUsageReq
}

/**
 * Request parameters for postApiV1ThingsCardDailyUsageSync operation in CardDailyUsageApi.
 */
export interface CardDailyUsageApiPostApiV1ThingsCardDailyUsageSyncRequest {
    readonly cardDailyUsageReq: CardDailyUsageReq
}
