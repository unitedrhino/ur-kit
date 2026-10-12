import type { CardPacketCreateReq } from '../models';
import type { CardPacketGetListReq } from '../models';
import type { CardPacketUpdateReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCancel200Response } from '../models';
import type { PostApiV1ThingsCardInfoCreate200Response } from '../models';
import type { PostApiV1ThingsCardPacketGetList200Response } from '../models';
import type { PostApiV1ThingsCardPacketGetOne200Response } from '../models';
import type { PostApiV1ThingsCardPacketGetOption200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardPacketApi - axios parameter creator
 */

/**
* 业务说明：新增资费计划
* @summary 新增资费计划
* @param {CardPacketCreateReq} cardPacketCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPacketCreate (
cardPacketCreateReq: CardPacketCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/packet/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoCreate200Response>>(localVarPath, cardPacketCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除资费计划
* @summary 删除资费计划
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPacketDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/packet/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取资费计划列表
* @summary 获取资费计划列表
* @param {CardPacketGetListReq} cardPacketGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPacketGetList (
cardPacketGetListReq: CardPacketGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/packet/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPacketGetList200Response>>(localVarPath, cardPacketGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取资费计划详情
* @summary 获取资费计划详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPacketGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/packet/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPacketGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取资费计划下拉选项
* @summary 获取资费计划下拉选项
* @param {CardPacketGetListReq} cardPacketGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPacketGetOption (
cardPacketGetListReq: CardPacketGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/packet/get-option`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPacketGetOption200Response>>(localVarPath, cardPacketGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新资费计划
* @summary 更新资费计划
* @param {CardPacketUpdateReq} cardPacketUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPacketUpdate (
cardPacketUpdateReq: CardPacketUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/packet/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardPacketUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardPacketCreate operation in CardPacketApi.
 */
export interface CardPacketApiPostApiV1ThingsCardPacketCreateRequest {
    readonly cardPacketCreateReq: CardPacketCreateReq
}

/**
 * Request parameters for postApiV1ThingsCardPacketDelete operation in CardPacketApi.
 */
export interface CardPacketApiPostApiV1ThingsCardPacketDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardPacketGetList operation in CardPacketApi.
 */
export interface CardPacketApiPostApiV1ThingsCardPacketGetListRequest {
    readonly cardPacketGetListReq: CardPacketGetListReq

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
 * Request parameters for postApiV1ThingsCardPacketGetOne operation in CardPacketApi.
 */
export interface CardPacketApiPostApiV1ThingsCardPacketGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardPacketGetOption operation in CardPacketApi.
 */
export interface CardPacketApiPostApiV1ThingsCardPacketGetOptionRequest {
    readonly cardPacketGetListReq: CardPacketGetListReq

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
 * Request parameters for postApiV1ThingsCardPacketUpdate operation in CardPacketApi.
 */
export interface CardPacketApiPostApiV1ThingsCardPacketUpdateRequest {
    readonly cardPacketUpdateReq: CardPacketUpdateReq
}
