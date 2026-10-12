import type { DeviceAuthAccessReq } from '../models';
import type { DeviceAuthLoginReq } from '../models';
import type { DeviceAuthRootCheckReq } from '../models';
import type { DeviceRegisterReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsDeviceAuthRegister200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceAuthApi - axios parameter creator
 */

/**
* MQTT Broker的设备发布/订阅操作认证接口。设备进行MQTT发布或订阅时，Broker调用此接口验证操作权限。检查设备是否有权限访问指定主题。用于EMQX等MQTT Broker的ACL钩子。
* @summary 设备操作认证
* @param {DeviceAuthAccessReq} deviceAuthAccessReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceAuthAccess (
deviceAuthAccessReq: DeviceAuthAccessReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/auth/access`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceAuthAccessReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* MQTT Broker的设备登录认证接口。设备连接MQTT时，Broker调用此接口验证设备身份（用户名+密码或证书）。验证成功后设备获得连接权限，否则连接被拒绝。用于EMQX等MQTT Broker的认证钩子。
* @summary 设备登录认证
* @param {DeviceAuthLoginReq} deviceAuthLoginReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceAuthLogin (
deviceAuthLoginReq: DeviceAuthLoginReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/auth/login`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceAuthLoginReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 设备动态注册接口，用于设备首次连接时自动创建设备记录。设备使用产品秘钥进行签名认证，验证通过后返回设备秘钥（PSK）或证书。适用于产品配置了动态注册功能，设备无需预先创建即可接入的场景。
* @summary 设备自动注册
* @param {DeviceRegisterReq} deviceRegisterReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceAuthRegister (
deviceRegisterReq: DeviceRegisterReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/auth/register`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceAuthRegister200Response>>(localVarPath, deviceRegisterReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 检查设备认证账号是否为root超级账号。root账号拥有最高权限，可订阅所有主题、执行所有操作。用于区分普通设备和调试设备、管理设备的权限级别。
* @summary 鉴定是否是root账号
* @param {DeviceAuthRootCheckReq} deviceAuthRootCheckReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceAuthRootCheck (
deviceAuthRootCheckReq: DeviceAuthRootCheckReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/auth/root-check`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceAuthRootCheckReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceAuthAccess operation in ThingsDeviceAuthApi.
 */
export interface ThingsDeviceAuthApiPostApiV1ThingsDeviceAuthAccessRequest {
    readonly deviceAuthAccessReq: DeviceAuthAccessReq
}

/**
 * Request parameters for postApiV1ThingsDeviceAuthLogin operation in ThingsDeviceAuthApi.
 */
export interface ThingsDeviceAuthApiPostApiV1ThingsDeviceAuthLoginRequest {
    readonly deviceAuthLoginReq: DeviceAuthLoginReq
}

/**
 * Request parameters for postApiV1ThingsDeviceAuthRegister operation in ThingsDeviceAuthApi.
 */
export interface ThingsDeviceAuthApiPostApiV1ThingsDeviceAuthRegisterRequest {
    readonly deviceRegisterReq: DeviceRegisterReq
}

/**
 * Request parameters for postApiV1ThingsDeviceAuthRootCheck operation in ThingsDeviceAuthApi.
 */
export interface ThingsDeviceAuthApiPostApiV1ThingsDeviceAuthRootCheckRequest {
    readonly deviceAuthRootCheckReq: DeviceAuthRootCheckReq
}
