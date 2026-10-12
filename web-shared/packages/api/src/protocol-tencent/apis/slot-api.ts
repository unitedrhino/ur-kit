import type { DeviceInfoBindReq } from '../models';
import type { GetApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SlotApi - axios parameter creator
 */

/**
* 业务说明：处理腾讯云设备与平台设备的绑定请求，写入设备扩展绑定信息。
* @summary 腾讯云设备绑定
* @param {DeviceInfoBindReq} deviceInfoBindReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ProtocolCloudTencentSlotDeviceBind (
deviceInfoBindReq: DeviceInfoBindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/protocol/cloud/tencent/slot/device-bind`;
    return requestClient.post<ExtractDataType<GetApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID200Response>>(localVarPath, deviceInfoBindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ProtocolCloudTencentSlotDeviceBind operation in SlotApi.
 */
export interface SlotApiPostApiV1ProtocolCloudTencentSlotDeviceBindRequest {
    readonly deviceInfoBindReq: DeviceInfoBindReq
}
