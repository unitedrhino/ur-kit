import type { CardOrderHistoryExportReq } from '../models';
import type { CardOrderHistoryGetListReq } from '../models';
import type { CardOrderHistorySyncReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCreate200Response } from '../models';
import type { PostApiV1ThingsCardOrderHistoryExport200Response } from '../models';
import type { PostApiV1ThingsCardOrderHistoryGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardOrderHistoryApi - axios parameter creator
 */

/**
* 业务说明：按搜索条件导出订购历史并返回 OSS 下载地址
* @summary 导出订购历史记录
* @param {CardOrderHistoryExportReq} cardOrderHistoryExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOrderHistoryExport (
cardOrderHistoryExportReq: CardOrderHistoryExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/order-history/export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardOrderHistoryExport200Response>>(localVarPath, cardOrderHistoryExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询物联卡订购历史记录
* @summary 获取订购历史列表
* @param {CardOrderHistoryGetListReq} cardOrderHistoryGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOrderHistoryGetList (
cardOrderHistoryGetListReq: CardOrderHistoryGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/order-history/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardOrderHistoryGetList200Response>>(localVarPath, cardOrderHistoryGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按显式 ICCID 从卡绑定通道同步只读预定事实；不执行取消、支付或续费
* @summary 同步联通订购历史
* @param {CardOrderHistorySyncReq} cardOrderHistorySyncReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOrderHistorySync (
cardOrderHistorySyncReq: CardOrderHistorySyncReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/order-history/sync`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, cardOrderHistorySyncReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardOrderHistoryExport operation in CardOrderHistoryApi.
 */
export interface CardOrderHistoryApiPostApiV1ThingsCardOrderHistoryExportRequest {
    readonly cardOrderHistoryExportReq: CardOrderHistoryExportReq
}

/**
 * Request parameters for postApiV1ThingsCardOrderHistoryGetList operation in CardOrderHistoryApi.
 */
export interface CardOrderHistoryApiPostApiV1ThingsCardOrderHistoryGetListRequest {
    readonly cardOrderHistoryGetListReq: CardOrderHistoryGetListReq

    /**
     *  页码
     */
    readonly page?: number

    /**
     *  每页大小
     */
    readonly size?: number
}

/**
 * Request parameters for postApiV1ThingsCardOrderHistorySync operation in CardOrderHistoryApi.
 */
export interface CardOrderHistoryApiPostApiV1ThingsCardOrderHistorySyncRequest {
    readonly cardOrderHistorySyncReq: CardOrderHistorySyncReq
}
