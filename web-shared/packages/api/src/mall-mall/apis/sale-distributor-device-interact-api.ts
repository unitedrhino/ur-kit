import type { DeviceInteractMultiSendPropertyReq } from '../models';
import type { DeviceInteractSendPropertyReq } from '../models';
import type { PostApiV1SaleDistributorDeviceInteractPropertyControlMultiSend200Response } from '../models';
import type { PostApiV1SaleDistributorDeviceInteractPropertyControlSend200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorDeviceInteractApi - axios parameter creator
 */

/**
* 按区域、分组或设备列表批量下发属性控制指令
* @summary 批量调用设备属性
* @param {DeviceInteractMultiSendPropertyReq} deviceInteractMultiSendPropertyReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceInteractPropertyControlMultiSend (
deviceInteractMultiSendPropertyReq: DeviceInteractMultiSendPropertyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/interact/property-control-multi-send`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorDeviceInteractPropertyControlMultiSend200Response>>(localVarPath, deviceInteractMultiSendPropertyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 向单个设备下发属性控制指令，支持同步/异步、设备影子等控制策略
* @summary 调用设备属性
* @param {DeviceInteractSendPropertyReq} deviceInteractSendPropertyReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceInteractPropertyControlSend (
deviceInteractSendPropertyReq: DeviceInteractSendPropertyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/interact/property-control-send`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorDeviceInteractPropertyControlSend200Response>>(localVarPath, deviceInteractSendPropertyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorDeviceInteractPropertyControlMultiSend operation in SaleDistributorDeviceInteractApi.
 */
export interface SaleDistributorDeviceInteractApiPostApiV1SaleDistributorDeviceInteractPropertyControlMultiSendRequest {
    readonly deviceInteractMultiSendPropertyReq: DeviceInteractMultiSendPropertyReq
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceInteractPropertyControlSend operation in SaleDistributorDeviceInteractApi.
 */
export interface SaleDistributorDeviceInteractApiPostApiV1SaleDistributorDeviceInteractPropertyControlSendRequest {
    readonly deviceInteractSendPropertyReq: DeviceInteractSendPropertyReq
}
