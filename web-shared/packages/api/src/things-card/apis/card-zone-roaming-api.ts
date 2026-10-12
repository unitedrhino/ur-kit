import type { CardRoamingProvinceGetListReq } from '../models';
import type { CardRoamingProvinceSyncReq } from '../models';
import type { CardZoneUsageGetListReq } from '../models';
import type { CardZoneUsageSyncReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCreate200Response } from '../models';
import type { PostApiV1ThingsCardZoneRoamingRoamingProvinceGetList200Response } from '../models';
import type { PostApiV1ThingsCardZoneRoamingZoneUsageGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardZoneRoamingApi - axios parameter creator
 */

/**
* 业务说明：分页查询已同步的联通 CMP 漫游省份事实
* @summary 查询漫游省份事实
* @param {CardRoamingProvinceGetListReq} cardRoamingProvinceGetListReq  CardRoamingProvinceGetListReq 漫游省份事实查询请求。
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardZoneRoamingRoamingProvinceGetList (
cardRoamingProvinceGetListReq: CardRoamingProvinceGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/zone-roaming/roaming-province/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardZoneRoamingRoamingProvinceGetList200Response>>(localVarPath, cardRoamingProvinceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按官方 billing 或 latest 口径拉取漫游省份并幂等替换本地事实
* @summary 同步漫游省份事实
* @param {CardRoamingProvinceSyncReq} cardRoamingProvinceSyncReq  CardRoamingProvinceSyncReq 漫游省份同步请求。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardZoneRoamingRoamingProvinceSync (
cardRoamingProvinceSyncReq: CardRoamingProvinceSyncReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/zone-roaming/roaming-province/sync`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, cardRoamingProvinceSyncReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询已同步的联通 CMP 区域用量事实
* @summary 查询区域用量事实
* @param {CardZoneUsageGetListReq} cardZoneUsageGetListReq  CardZoneUsageGetListReq 区域用量事实查询请求。
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardZoneRoamingZoneUsageGetList (
cardZoneUsageGetListReq: CardZoneUsageGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/zone-roaming/zone-usage/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardZoneRoamingZoneUsageGetList200Response>>(localVarPath, cardZoneUsageGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按官方 recent 或 terminal 口径拉取区域用量并幂等替换本地事实
* @summary 同步区域用量事实
* @param {CardZoneUsageSyncReq} cardZoneUsageSyncReq  CardZoneUsageSyncReq 区域用量同步请求。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardZoneRoamingZoneUsageSync (
cardZoneUsageSyncReq: CardZoneUsageSyncReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/zone-roaming/zone-usage/sync`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, cardZoneUsageSyncReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardZoneRoamingRoamingProvinceGetList operation in CardZoneRoamingApi.
 */
export interface CardZoneRoamingApiPostApiV1ThingsCardZoneRoamingRoamingProvinceGetListRequest {
    /**
     *  CardRoamingProvinceGetListReq 漫游省份事实查询请求。
     */
    readonly cardRoamingProvinceGetListReq: CardRoamingProvinceGetListReq

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
 * Request parameters for postApiV1ThingsCardZoneRoamingRoamingProvinceSync operation in CardZoneRoamingApi.
 */
export interface CardZoneRoamingApiPostApiV1ThingsCardZoneRoamingRoamingProvinceSyncRequest {
    /**
     *  CardRoamingProvinceSyncReq 漫游省份同步请求。
     */
    readonly cardRoamingProvinceSyncReq: CardRoamingProvinceSyncReq
}

/**
 * Request parameters for postApiV1ThingsCardZoneRoamingZoneUsageGetList operation in CardZoneRoamingApi.
 */
export interface CardZoneRoamingApiPostApiV1ThingsCardZoneRoamingZoneUsageGetListRequest {
    /**
     *  CardZoneUsageGetListReq 区域用量事实查询请求。
     */
    readonly cardZoneUsageGetListReq: CardZoneUsageGetListReq

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
 * Request parameters for postApiV1ThingsCardZoneRoamingZoneUsageSync operation in CardZoneRoamingApi.
 */
export interface CardZoneRoamingApiPostApiV1ThingsCardZoneRoamingZoneUsageSyncRequest {
    /**
     *  CardZoneUsageSyncReq 区域用量同步请求。
     */
    readonly cardZoneUsageSyncReq: CardZoneUsageSyncReq
}
