import type { DevicePairConfirmReq } from '../models';
import type { DevicePairGrantReq } from '../models';
import type { PostApiV1ThingsDeviceInfoPairConfirm200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoPairGrant200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDevicePairApi - axios parameter creator
 */

/**
* 业务说明：校验短期配对授权和设备返回的 pairAckPayload，确认随机数、MAC、用户及绑定版本均匹配。
* @summary S01 BLE 安全配对确认
* @param {DevicePairConfirmReq} devicePairConfirmReq  DevicePairConfirmReq 是设备配对回执确认请求。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoPairConfirm (
devicePairConfirmReq: DevicePairConfirmReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/pair-confirm`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoPairConfirm200Response>>(localVarPath, devicePairConfirmReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据产品 ProductSecret 前 16 个 ASCII 字节为指定设备生成短期配对授权、随机数、认证标签和本次配对密钥。
* @summary S01 BLE 安全配对授权
* @param {DevicePairGrantReq} devicePairGrantReq  DevicePairGrantReq 是 S01 BLE 配对授权请求。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoPairGrant (
devicePairGrantReq: DevicePairGrantReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/pair-grant`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoPairGrant200Response>>(localVarPath, devicePairGrantReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceInfoPairConfirm operation in ThingsDevicePairApi.
 */
export interface ThingsDevicePairApiPostApiV1ThingsDeviceInfoPairConfirmRequest {
    /**
     *  DevicePairConfirmReq 是设备配对回执确认请求。
     */
    readonly devicePairConfirmReq: DevicePairConfirmReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoPairGrant operation in ThingsDevicePairApi.
 */
export interface ThingsDevicePairApiPostApiV1ThingsDeviceInfoPairGrantRequest {
    /**
     *  DevicePairGrantReq 是 S01 BLE 配对授权请求。
     */
    readonly devicePairGrantReq: DevicePairGrantReq
}
