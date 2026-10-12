import type { CardMonthFlowExportReq } from '../models';
import type { CardMonthFlowGetListReq } from '../models';
import type { PostApiV1ThingsCardMonthFlowExport200Response } from '../models';
import type { PostApiV1ThingsCardMonthFlowGetList200Response } from '../models';
import type { PostApiV1ThingsCardMonthFlowStatistics200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardMonthFlowApi - axios parameter creator
 */

/**
* 业务说明：按 ICCID 号段与年份导出物联卡月流量报表，生成 Excel 后上传到 OSS 返回下载地址
* @summary 导出月流量报表
* @param {CardMonthFlowExportReq} cardMonthFlowExportReq  CardMonthFlowExportReq 月流量报表导出请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardMonthFlowExport (
cardMonthFlowExportReq: CardMonthFlowExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/month-flow/export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardMonthFlowExport200Response>>(localVarPath, cardMonthFlowExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按 ICCID 号段与年份分页查询物联卡 1~12 月流量使用情况
* @summary 获取月流量报表列表
* @param {CardMonthFlowGetListReq} cardMonthFlowGetListReq  CardMonthFlowGetListReq 月流量报表列表查询请求
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardMonthFlowGetList (
cardMonthFlowGetListReq: CardMonthFlowGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/month-flow/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardMonthFlowGetList200Response>>(localVarPath, cardMonthFlowGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户、ICCID 号段和年份汇总真实月用量数据
* @summary 获取月流量统计
* @param {CardMonthFlowExportReq} cardMonthFlowExportReq  CardMonthFlowExportReq 月流量报表导出请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardMonthFlowStatistics (
cardMonthFlowExportReq: CardMonthFlowExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/month-flow/statistics`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardMonthFlowStatistics200Response>>(localVarPath, cardMonthFlowExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardMonthFlowExport operation in CardMonthFlowApi.
 */
export interface CardMonthFlowApiPostApiV1ThingsCardMonthFlowExportRequest {
    /**
     *  CardMonthFlowExportReq 月流量报表导出请求
     */
    readonly cardMonthFlowExportReq: CardMonthFlowExportReq
}

/**
 * Request parameters for postApiV1ThingsCardMonthFlowGetList operation in CardMonthFlowApi.
 */
export interface CardMonthFlowApiPostApiV1ThingsCardMonthFlowGetListRequest {
    /**
     *  CardMonthFlowGetListReq 月流量报表列表查询请求
     */
    readonly cardMonthFlowGetListReq: CardMonthFlowGetListReq

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
 * Request parameters for postApiV1ThingsCardMonthFlowStatistics operation in CardMonthFlowApi.
 */
export interface CardMonthFlowApiPostApiV1ThingsCardMonthFlowStatisticsRequest {
    /**
     *  CardMonthFlowExportReq 月流量报表导出请求
     */
    readonly cardMonthFlowExportReq: CardMonthFlowExportReq
}
