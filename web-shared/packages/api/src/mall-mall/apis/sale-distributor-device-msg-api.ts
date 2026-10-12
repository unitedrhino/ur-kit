import type { DeviceMsgEventLogGetListReq } from '../models';
import type { DeviceMsgSendLogGetListReq } from '../models';
import type { DeviceMsgStatusLogGetListReq } from '../models';
import type { PostApiV1SaleDistributorDeviceMsgEventLogGetList200Response } from '../models';
import type { PostApiV1SaleDistributorDeviceMsgSendLogGetList200Response } from '../models';
import type { PostApiV1SaleDistributorDeviceMsgStatusLogGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorDeviceMsgApi - axios parameter creator
 */

/**
* 按时间范围和事件类型分页查询设备上报的事件历史
* @summary 获取事件历史记录
* @param {DeviceMsgEventLogGetListReq} deviceMsgEventLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceMsgEventLogGetList (
deviceMsgEventLogGetListReq: DeviceMsgEventLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/msg/event-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorDeviceMsgEventLogGetList200Response>>(localVarPath, deviceMsgEventLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按时间范围分页查询设备下发的命令及执行结果日志
* @summary 获取设备命令日志
* @param {DeviceMsgSendLogGetListReq} deviceMsgSendLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceMsgSendLogGetList (
deviceMsgSendLogGetListReq: DeviceMsgSendLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/msg/send-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorDeviceMsgSendLogGetList200Response>>(localVarPath, deviceMsgSendLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按时间范围分页查询设备上下线状态变更日志
* @summary 获取设备状态日志
* @param {DeviceMsgStatusLogGetListReq} deviceMsgStatusLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceMsgStatusLogGetList (
deviceMsgStatusLogGetListReq: DeviceMsgStatusLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/msg/status-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorDeviceMsgStatusLogGetList200Response>>(localVarPath, deviceMsgStatusLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorDeviceMsgEventLogGetList operation in SaleDistributorDeviceMsgApi.
 */
export interface SaleDistributorDeviceMsgApiPostApiV1SaleDistributorDeviceMsgEventLogGetListRequest {
    readonly deviceMsgEventLogGetListReq: DeviceMsgEventLogGetListReq
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceMsgSendLogGetList operation in SaleDistributorDeviceMsgApi.
 */
export interface SaleDistributorDeviceMsgApiPostApiV1SaleDistributorDeviceMsgSendLogGetListRequest {
    readonly deviceMsgSendLogGetListReq: DeviceMsgSendLogGetListReq
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceMsgStatusLogGetList operation in SaleDistributorDeviceMsgApi.
 */
export interface SaleDistributorDeviceMsgApiPostApiV1SaleDistributorDeviceMsgStatusLogGetListRequest {
    readonly deviceMsgStatusLogGetListReq: DeviceMsgStatusLogGetListReq
}
