import type { CardPollingErrorGetListReq } from '../models';
import type { CardPollingErrorGroupGetListReq } from '../models';
import type { CardPollingErrorMarkReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCancel200Response } from '../models';
import type { PostApiV1ThingsCardPollingErrorGetList200Response } from '../models';
import type { PostApiV1ThingsCardPollingErrorGetOne200Response } from '../models';
import type { PostApiV1ThingsCardPollingErrorGroupGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardPollingErrorApi - axios parameter creator
 */

/**
* 业务说明：获取轮询错误列表
* @summary 获取轮询错误列表
* @param {CardPollingErrorGetListReq} cardPollingErrorGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingErrorGetList (
cardPollingErrorGetListReq: CardPollingErrorGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-error/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPollingErrorGetList200Response>>(localVarPath, cardPollingErrorGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条轮询错误
* @summary 获取轮询错误详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingErrorGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-error/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPollingErrorGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取轮询错误分组列表
* @summary 获取轮询错误分组列表
* @param {CardPollingErrorGroupGetListReq} cardPollingErrorGroupGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingErrorGroupGetList (
cardPollingErrorGroupGetListReq: CardPollingErrorGroupGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-error/group/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPollingErrorGroupGetList200Response>>(localVarPath, cardPollingErrorGroupGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：标记轮询错误分组通知状态
* @summary 标记轮询错误分组通知状态
* @param {CardPollingErrorMarkReq} cardPollingErrorMarkReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingErrorGroupMarkNotice (
cardPollingErrorMarkReq: CardPollingErrorMarkReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-error/group/mark-notice`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardPollingErrorMarkReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：标记轮询错误通知状态
* @summary 标记轮询错误通知状态
* @param {CardPollingErrorMarkReq} cardPollingErrorMarkReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingErrorMarkNotice (
cardPollingErrorMarkReq: CardPollingErrorMarkReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-error/mark-notice`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardPollingErrorMarkReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardPollingErrorGetList operation in CardPollingErrorApi.
 */
export interface CardPollingErrorApiPostApiV1ThingsCardPollingErrorGetListRequest {
    readonly cardPollingErrorGetListReq: CardPollingErrorGetListReq

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
 * Request parameters for postApiV1ThingsCardPollingErrorGetOne operation in CardPollingErrorApi.
 */
export interface CardPollingErrorApiPostApiV1ThingsCardPollingErrorGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardPollingErrorGroupGetList operation in CardPollingErrorApi.
 */
export interface CardPollingErrorApiPostApiV1ThingsCardPollingErrorGroupGetListRequest {
    readonly cardPollingErrorGroupGetListReq: CardPollingErrorGroupGetListReq

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
 * Request parameters for postApiV1ThingsCardPollingErrorGroupMarkNotice operation in CardPollingErrorApi.
 */
export interface CardPollingErrorApiPostApiV1ThingsCardPollingErrorGroupMarkNoticeRequest {
    readonly cardPollingErrorMarkReq: CardPollingErrorMarkReq
}

/**
 * Request parameters for postApiV1ThingsCardPollingErrorMarkNotice operation in CardPollingErrorApi.
 */
export interface CardPollingErrorApiPostApiV1ThingsCardPollingErrorMarkNoticeRequest {
    readonly cardPollingErrorMarkReq: CardPollingErrorMarkReq
}
