import type { OtaFirmwareDeviceCancelReq } from '../models';
import type { OtaFirmwareDeviceConfirmReq } from '../models';
import type { OtaFirmwareDeviceGetListReq } from '../models';
import type { OtaFirmwareDeviceRetryReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsOtaFirmwareDeviceGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsOtaFirmwareDeviceApi - axios parameter creator
 */

/**
* 业务说明：取消指定升级批次中部分设备的OTA升级任务。支持批量取消多个设备的升级作业。取消后设备状态变为【已取消】，不再接收升级推送。适用于：设备升级失败需暂停、临时停止特定设备升级、调整升级范围时移除部分设备。注意：已进入【升级中】状态的设备可能无法立即取消。
* @summary 取消指定任务下的升级
* @param {OtaFirmwareDeviceCancelReq} otaFirmwareDeviceCancelReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareDeviceCancel (
otaFirmwareDeviceCancelReq: OtaFirmwareDeviceCancelReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/device/cancel`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, otaFirmwareDeviceCancelReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设备侧确认接收OTA升级任务。当升级批次配置为【需要确认】模式时，设备需通过此接口确认后才可获取升级包信息。确认后设备状态从【待确认】变为【待推送】。适用于：需要人工审核或设备主动确认后才执行升级的场景，如关键设备升级需运维人员确认。
* @summary 确认升级设备
* @param {OtaFirmwareDeviceConfirmReq} otaFirmwareDeviceConfirmReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareDeviceConfirm (
otaFirmwareDeviceConfirmReq: OtaFirmwareDeviceConfirmReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/device/confirm`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, otaFirmwareDeviceConfirmReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定OTA升级任务批次中各设备的升级作业状态。返回设备升级详情（目标版本、当前版本、升级进度、状态、是否在线等），支持按设备名称、状态、版本号过滤。用于监控批量升级进度、排查升级失败的设备、查看整体升级成功率。
* @summary 查询升级设备列表
* @param {OtaFirmwareDeviceGetListReq} otaFirmwareDeviceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareDeviceGetList (
otaFirmwareDeviceGetListReq: OtaFirmwareDeviceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/device/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsOtaFirmwareDeviceGetList200Response>>(localVarPath, otaFirmwareDeviceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：重新触发升级失败的设备执行OTA升级。支持批量重试多个设备。重试后设备状态从【升级失败】变为【待推送】，系统会重新推送升级包下载地址。适用于：因网络波动、设备临时离线导致的升级失败，在设备恢复在线后重新执行升级。重试次数受批次配置的重试次数限制。
* @summary 重试设备升级
* @param {OtaFirmwareDeviceRetryReq} otaFirmwareDeviceRetryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareDeviceRetry (
otaFirmwareDeviceRetryReq: OtaFirmwareDeviceRetryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/device/retry`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, otaFirmwareDeviceRetryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsOtaFirmwareDeviceCancel operation in ThingsOtaFirmwareDeviceApi.
 */
export interface ThingsOtaFirmwareDeviceApiPostApiV1ThingsOtaFirmwareDeviceCancelRequest {
    readonly otaFirmwareDeviceCancelReq: OtaFirmwareDeviceCancelReq
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareDeviceConfirm operation in ThingsOtaFirmwareDeviceApi.
 */
export interface ThingsOtaFirmwareDeviceApiPostApiV1ThingsOtaFirmwareDeviceConfirmRequest {
    readonly otaFirmwareDeviceConfirmReq: OtaFirmwareDeviceConfirmReq
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareDeviceGetList operation in ThingsOtaFirmwareDeviceApi.
 */
export interface ThingsOtaFirmwareDeviceApiPostApiV1ThingsOtaFirmwareDeviceGetListRequest {
    readonly otaFirmwareDeviceGetListReq: OtaFirmwareDeviceGetListReq
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareDeviceRetry operation in ThingsOtaFirmwareDeviceApi.
 */
export interface ThingsOtaFirmwareDeviceApiPostApiV1ThingsOtaFirmwareDeviceRetryRequest {
    readonly otaFirmwareDeviceRetryReq: OtaFirmwareDeviceRetryReq
}
