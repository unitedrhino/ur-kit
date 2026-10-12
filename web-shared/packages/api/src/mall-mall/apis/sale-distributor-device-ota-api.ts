import type { OtaFirmwareDeviceConfirmReq } from '../models';
import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorDeviceOtaApi - axios parameter creator
 */

/**
* 确认对指定设备执行OTA固件升级
* @summary 确认升级设备
* @param {OtaFirmwareDeviceConfirmReq} otaFirmwareDeviceConfirmReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceOtaConfirm (
otaFirmwareDeviceConfirmReq: OtaFirmwareDeviceConfirmReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/ota/confirm`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, otaFirmwareDeviceConfirmReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorDeviceOtaConfirm operation in SaleDistributorDeviceOtaApi.
 */
export interface SaleDistributorDeviceOtaApiPostApiV1SaleDistributorDeviceOtaConfirmRequest {
    readonly otaFirmwareDeviceConfirmReq: OtaFirmwareDeviceConfirmReq
}
