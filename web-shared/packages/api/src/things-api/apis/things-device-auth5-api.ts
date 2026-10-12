import type { DeviceAuth5AccessReq } from '../models';
import type { DeviceAuth5LoginReq } from '../models';
import type { PostApiV1ThingsDeviceAuth5Access200Response } from '../models';
import type { PostApiV1ThingsDeviceAuth5Login200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceAuth5Api - axios parameter creator
 */

/**
* MQTT Broker（如EMQX 5.x）的设备发布/订阅操作认证接口。设备进行MQTT发布或订阅时，Broker调用此接口验证操作权限。检查设备是否有权限操作指定主题，返回allow/deny/ignore。
* @summary 设备操作认证
* @param {DeviceAuth5AccessReq} deviceAuth5AccessReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceAuth5Access (
deviceAuth5AccessReq: DeviceAuth5AccessReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/auth5/access`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceAuth5Access200Response>>(localVarPath, deviceAuth5AccessReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* MQTT Broker（如EMQX 5.x）的设备登录认证接口。设备连接MQTT时，Broker调用此接口验证设备身份（用户名+密码/证书）。返回allow/deny/ignore决定是否允许连接，is_superuser标识是否为超级用户（可订阅所有主题）。
* @summary 设备登录认证
* @param {DeviceAuth5LoginReq} deviceAuth5LoginReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceAuth5Login (
deviceAuth5LoginReq: DeviceAuth5LoginReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/auth5/login`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceAuth5Login200Response>>(localVarPath, deviceAuth5LoginReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceAuth5Access operation in ThingsDeviceAuth5Api.
 */
export interface ThingsDeviceAuth5ApiPostApiV1ThingsDeviceAuth5AccessRequest {
    readonly deviceAuth5AccessReq: DeviceAuth5AccessReq
}

/**
 * Request parameters for postApiV1ThingsDeviceAuth5Login operation in ThingsDeviceAuth5Api.
 */
export interface ThingsDeviceAuth5ApiPostApiV1ThingsDeviceAuth5LoginRequest {
    readonly deviceAuth5LoginReq: DeviceAuth5LoginReq
}
