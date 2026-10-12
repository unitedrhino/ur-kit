import type { CardPollingProgressCommandReq } from '../models';
import type { CardPollingProgressGetListReq } from '../models';
import type { CardPollingProgressGetOneReq } from '../models';
import type { PostApiV1ThingsCardPollingProgressCancel200Response } from '../models';
import type { PostApiV1ThingsCardPollingProgressGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardPollingProgressApi - axios parameter creator
 */

/**
* 业务说明：仅持久化取消请求，实际停止由后台执行器处理
* @summary 请求取消轮询批次
* @param {CardPollingProgressCommandReq} cardPollingProgressCommandReq  CardPollingProgressCommandReq 提交持久化状态请求。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingProgressCancel (
cardPollingProgressCommandReq: CardPollingProgressCommandReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-progress/cancel`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPollingProgressCancel200Response>>(localVarPath, cardPollingProgressCommandReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询持久化轮询批次和恢复状态
* @summary 查询轮询批次
* @param {CardPollingProgressGetListReq} cardPollingProgressGetListReq  CardPollingProgressGetListReq 查询轮询批次。
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingProgressGetList (
cardPollingProgressGetListReq: CardPollingProgressGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-progress/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPollingProgressGetList200Response>>(localVarPath, cardPollingProgressGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按轮询批次号查询持久化进度、游标与请求状态
* @summary 查询轮询批次详情
* @param {CardPollingProgressGetOneReq} cardPollingProgressGetOneReq  CardPollingProgressGetOneReq 按稳定批次号查询详情。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingProgressGetOne (
cardPollingProgressGetOneReq: CardPollingProgressGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-progress/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPollingProgressCancel200Response>>(localVarPath, cardPollingProgressGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：仅持久化重试请求，实际恢复执行由后台执行器处理
* @summary 请求重试轮询批次
* @param {CardPollingProgressCommandReq} cardPollingProgressCommandReq  CardPollingProgressCommandReq 提交持久化状态请求。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPollingProgressRetry (
cardPollingProgressCommandReq: CardPollingProgressCommandReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/polling-progress/retry`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPollingProgressCancel200Response>>(localVarPath, cardPollingProgressCommandReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardPollingProgressCancel operation in CardPollingProgressApi.
 */
export interface CardPollingProgressApiPostApiV1ThingsCardPollingProgressCancelRequest {
    /**
     *  CardPollingProgressCommandReq 提交持久化状态请求。
     */
    readonly cardPollingProgressCommandReq: CardPollingProgressCommandReq
}

/**
 * Request parameters for postApiV1ThingsCardPollingProgressGetList operation in CardPollingProgressApi.
 */
export interface CardPollingProgressApiPostApiV1ThingsCardPollingProgressGetListRequest {
    /**
     *  CardPollingProgressGetListReq 查询轮询批次。
     */
    readonly cardPollingProgressGetListReq: CardPollingProgressGetListReq

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
 * Request parameters for postApiV1ThingsCardPollingProgressGetOne operation in CardPollingProgressApi.
 */
export interface CardPollingProgressApiPostApiV1ThingsCardPollingProgressGetOneRequest {
    /**
     *  CardPollingProgressGetOneReq 按稳定批次号查询详情。
     */
    readonly cardPollingProgressGetOneReq: CardPollingProgressGetOneReq
}

/**
 * Request parameters for postApiV1ThingsCardPollingProgressRetry operation in CardPollingProgressApi.
 */
export interface CardPollingProgressApiPostApiV1ThingsCardPollingProgressRetryRequest {
    /**
     *  CardPollingProgressCommandReq 提交持久化状态请求。
     */
    readonly cardPollingProgressCommandReq: CardPollingProgressCommandReq
}
