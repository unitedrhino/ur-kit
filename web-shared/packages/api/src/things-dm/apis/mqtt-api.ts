import type { GetApiV1MqttApiV5Clients200Response } from '../models';
import type { PostApiV1MqttApiV5ClientsClientIDSubscribeBulk200Response } from '../models';
import type { SubscribeBulkReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * MqttApi - axios parameter creator
 */

/**
* 业务说明：分页查询 dmsvr 当前内置 MQTT 在线客户端列表，支持按用户名过滤，用于协议服务查询在线网关客户端并做订阅管理。
* @summary 获取客户端列表
* @param {string} [bodyParam.username]
* @param {number} [bodyParam.page]
* @param {number} [bodyParam.limit]
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1MqttApiV5Clients (bodyParam: { username?: string; page?: number; limit?: number; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/mqtt/api/v5/clients`;
        if ((bodyParam as Record<string, unknown>)['username'] !== undefined) {
            localVarQueryParameter['username'] = (bodyParam as Record<string, unknown>)['username'];
        }
        if ((bodyParam as Record<string, unknown>)['page'] !== undefined) {
            localVarQueryParameter['page'] = (bodyParam as Record<string, unknown>)['page'];
        }
        if ((bodyParam as Record<string, unknown>)['limit'] !== undefined) {
            localVarQueryParameter['limit'] = (bodyParam as Record<string, unknown>)['limit'];
        }
    return requestClient.get<ExtractDataType<GetApiV1MqttApiV5Clients200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定 MQTT 客户端当前持有的订阅主题列表，用于协议网关在增量订阅前判断已有订阅状态。
* @summary 获取订阅topic列表
* @param {string} [bodyParam.clientID]
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1MqttApiV5ClientsClientIDSubscriptions (bodyParam: { clientID: string; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/mqtt/api/v5/clients/{clientID}/subscriptions`
    .replace(`{${"clientID"}}`, encodeURIComponent(String((bodyParam as Record<string, unknown>)['clientID'] ?? '')));
    return requestClient.get<ExtractDataType<PostApiV1MqttApiV5ClientsClientIDSubscribeBulk200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：为指定 MQTT 客户端批量增加订阅主题，用于协议网关按设备在线状态动态调整客户端订阅列表。
* @summary 批量订阅
* @param {string} clientID
* @param {SubscribeBulkReq} subscribeBulkReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1MqttApiV5ClientsClientIDSubscribeBulk (
clientID: string,
subscribeBulkReq: SubscribeBulkReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/mqtt/api/v5/clients/{clientID}/subscribe/bulk`
    .replace(`{${"clientID"}}`, encodeURIComponent(String(clientID)));
    return requestClient.post<ExtractDataType<PostApiV1MqttApiV5ClientsClientIDSubscribeBulk200Response>>(localVarPath, subscribeBulkReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：为指定 MQTT 客户端批量移除订阅主题，用于协议网关在设备离线或解绑后回收不再需要的订阅。
* @summary 批量取消订阅
* @param {string} clientID
* @param {SubscribeBulkReq} subscribeBulkReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1MqttApiV5ClientsClientIDUnsubscribeBulk (
clientID: string,
subscribeBulkReq: SubscribeBulkReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/mqtt/api/v5/clients/{clientID}/unsubscribe/bulk`
    .replace(`{${"clientID"}}`, encodeURIComponent(String(clientID)));
    return requestClient.post<ExtractDataType<PostApiV1MqttApiV5ClientsClientIDSubscribeBulk200Response>>(localVarPath, subscribeBulkReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for getApiV1MqttApiV5Clients operation in MqttApi.
 */
export interface MqttApiGetApiV1MqttApiV5ClientsRequest {
    readonly username?: string

    readonly page?: number

    readonly limit?: number
}

/**
 * Request parameters for getApiV1MqttApiV5ClientsClientIDSubscriptions operation in MqttApi.
 */
export interface MqttApiGetApiV1MqttApiV5ClientsClientIDSubscriptionsRequest {
    readonly clientID: string
}

/**
 * Request parameters for postApiV1MqttApiV5ClientsClientIDSubscribeBulk operation in MqttApi.
 */
export interface MqttApiPostApiV1MqttApiV5ClientsClientIDSubscribeBulkRequest {
    readonly clientID: string

    readonly subscribeBulkReq: SubscribeBulkReq
}

/**
 * Request parameters for postApiV1MqttApiV5ClientsClientIDUnsubscribeBulk operation in MqttApi.
 */
export interface MqttApiPostApiV1MqttApiV5ClientsClientIDUnsubscribeBulkRequest {
    readonly clientID: string

    readonly subscribeBulkReq: SubscribeBulkReq
}
