import type { CardUsageReminderGetListReq } from '../models';
import type { CardUsageReminderSyncReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCreate200Response } from '../models';
import type { PostApiV1ThingsCardUsageReminderGetList200Response } from '../models';
import type { PostApiV1ThingsCardUsageReminderGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardUsageReminderApi - axios parameter creator
 */

/**
* 业务说明：分页查询物联卡套餐余量提醒
* @summary 获取套餐余量提醒列表
* @param {CardUsageReminderGetListReq} cardUsageReminderGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardUsageReminderGetList (
cardUsageReminderGetListReq: CardUsageReminderGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/usage-reminder/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardUsageReminderGetList200Response>>(localVarPath, cardUsageReminderGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条套餐余量快照
* @summary 获取套餐余量提醒详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardUsageReminderGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/usage-reminder/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardUsageReminderGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按 ICCID 手动同步套餐余量提醒
* @summary 手动同步套餐余量
* @param {CardUsageReminderSyncReq} cardUsageReminderSyncReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardUsageReminderSync (
cardUsageReminderSyncReq: CardUsageReminderSyncReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/usage-reminder/sync`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, cardUsageReminderSyncReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardUsageReminderGetList operation in CardUsageReminderApi.
 */
export interface CardUsageReminderApiPostApiV1ThingsCardUsageReminderGetListRequest {
    readonly cardUsageReminderGetListReq: CardUsageReminderGetListReq

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
 * Request parameters for postApiV1ThingsCardUsageReminderGetOne operation in CardUsageReminderApi.
 */
export interface CardUsageReminderApiPostApiV1ThingsCardUsageReminderGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardUsageReminderSync operation in CardUsageReminderApi.
 */
export interface CardUsageReminderApiPostApiV1ThingsCardUsageReminderSyncRequest {
    readonly cardUsageReminderSyncReq: CardUsageReminderSyncReq
}
