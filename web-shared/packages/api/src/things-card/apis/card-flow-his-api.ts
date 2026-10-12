import type { CardFlowHisExportReq } from '../models';
import type { CardFlowHisGetListReq } from '../models';
import type { CardFlowHisStatisticsReq } from '../models';
import type { PostApiV1ThingsCardFlowHisExport200Response } from '../models';
import type { PostApiV1ThingsCardFlowHisGetList200Response } from '../models';
import type { PostApiV1ThingsCardFlowHisGetOne200Response } from '../models';
import type { PostApiV1ThingsCardFlowHisStatistics200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardFlowHisApi - axios parameter creator
 */

/**
* 业务说明：按搜索条件导出用量详情并返回 OSS 下载地址
* @summary 导出用量详情
* @param {CardFlowHisExportReq} cardFlowHisExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardFlowHisExport (
cardFlowHisExportReq: CardFlowHisExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/flow-his/export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardFlowHisExport200Response>>(localVarPath, cardFlowHisExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取用量详情列表
* @summary 获取用量详情列表
* @param {CardFlowHisGetListReq} cardFlowHisGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardFlowHisGetList (
cardFlowHisGetListReq: CardFlowHisGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/flow-his/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardFlowHisGetList200Response>>(localVarPath, cardFlowHisGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条历史用量记录
* @summary 获取用量详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardFlowHisGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/flow-his/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardFlowHisGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取用量统计
* @summary 获取用量统计
* @param {CardFlowHisStatisticsReq} cardFlowHisStatisticsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardFlowHisStatistics (
cardFlowHisStatisticsReq: CardFlowHisStatisticsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/flow-his/statistics`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardFlowHisStatistics200Response>>(localVarPath, cardFlowHisStatisticsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardFlowHisExport operation in CardFlowHisApi.
 */
export interface CardFlowHisApiPostApiV1ThingsCardFlowHisExportRequest {
    readonly cardFlowHisExportReq: CardFlowHisExportReq
}

/**
 * Request parameters for postApiV1ThingsCardFlowHisGetList operation in CardFlowHisApi.
 */
export interface CardFlowHisApiPostApiV1ThingsCardFlowHisGetListRequest {
    readonly cardFlowHisGetListReq: CardFlowHisGetListReq

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
 * Request parameters for postApiV1ThingsCardFlowHisGetOne operation in CardFlowHisApi.
 */
export interface CardFlowHisApiPostApiV1ThingsCardFlowHisGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardFlowHisStatistics operation in CardFlowHisApi.
 */
export interface CardFlowHisApiPostApiV1ThingsCardFlowHisStatisticsRequest {
    readonly cardFlowHisStatisticsReq: CardFlowHisStatisticsReq
}
