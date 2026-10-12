import type { DeviceGateWayBatchCreateReq } from '../models';
import type { DeviceGateWayBatchDeleteReq } from '../models';
import type { DeviceGateWayGetListReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsDeviceGatewayGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceGatewayApi - axios parameter creator
 */

/**
* 批量将子设备添加到网关的拓扑关系中。子设备通过网关与云端通信，网关代理子设备的消息上下行。添加后子设备可通过该网关上报数据和接收指令。支持批量添加多个子设备。
* @summary 添加网关子设备
* @param {DeviceGateWayBatchCreateReq} deviceGateWayBatchCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceGatewayBatchCreate (
deviceGateWayBatchCreateReq: DeviceGateWayBatchCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/gateway/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceGateWayBatchCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量解除网关与子设备的拓扑关系。解绑后子设备无法通过该网关与云端通信，需重新绑定或改为直连模式。支持批量解绑多个子设备。
* @summary 解绑子设备
* @param {DeviceGateWayBatchDeleteReq} deviceGateWayBatchDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceGatewayBatchDelete (
deviceGateWayBatchDeleteReq: DeviceGateWayBatchDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/gateway/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceGateWayBatchDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询指定网关下绑定的子设备列表。返回子设备的详细信息，包括设备状态、在线情况、产品信息等。用于网关拓扑管理、子设备监控。
* @summary 获取子设备列表
* @param {DeviceGateWayGetListReq} deviceGateWayGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceGatewayGetList (
deviceGateWayGetListReq: DeviceGateWayGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/gateway/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceGatewayGetList200Response>>(localVarPath, deviceGateWayGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceGatewayBatchCreate operation in ThingsDeviceGatewayApi.
 */
export interface ThingsDeviceGatewayApiPostApiV1ThingsDeviceGatewayBatchCreateRequest {
    readonly deviceGateWayBatchCreateReq: DeviceGateWayBatchCreateReq
}

/**
 * Request parameters for postApiV1ThingsDeviceGatewayBatchDelete operation in ThingsDeviceGatewayApi.
 */
export interface ThingsDeviceGatewayApiPostApiV1ThingsDeviceGatewayBatchDeleteRequest {
    readonly deviceGateWayBatchDeleteReq: DeviceGateWayBatchDeleteReq
}

/**
 * Request parameters for postApiV1ThingsDeviceGatewayGetList operation in ThingsDeviceGatewayApi.
 */
export interface ThingsDeviceGatewayApiPostApiV1ThingsDeviceGatewayGetListRequest {
    readonly deviceGateWayGetListReq: DeviceGateWayGetListReq
}
