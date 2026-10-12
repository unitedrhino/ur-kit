import type { DeviceProfile } from '../models';
import type { DeviceProfileGetListReq } from '../models';
import type { DeviceProfileGetOneReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsDeviceProfileGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceProfileGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceProfileApi - axios parameter creator
 */

/**
* 删除指定设备的配置信息，删除后设备将恢复使用产品物模型的默认配置。需要传入设备ID（productID+deviceName）和配置编码。
* @summary 删除设备配置
* @param {DeviceProfileGetOneReq} deviceProfileGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceProfileDelete (
deviceProfileGetOneReq: DeviceProfileGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/profile/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceProfileGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量获取设备配置信息列表。支持按设备ID、配置编码等条件筛选。当设备有多个配置时，可用于查看所有配置项。
* @summary 获取设备配置列表
* @param {DeviceProfileGetListReq} deviceProfileGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceProfileGetList (
deviceProfileGetListReq: DeviceProfileGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/profile/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceProfileGetList200Response>>(localVarPath, deviceProfileGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取单个设备的配置信息（profile），配置信息包含设备特定的参数设置，用于覆盖或补充产品物模型的默认配置。通过设备ID（productID+deviceName）和配置编码查询。
* @summary 获取设备配置详情
* @param {DeviceProfileGetOneReq} deviceProfileGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceProfileGetOne (
deviceProfileGetOneReq: DeviceProfileGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/profile/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceProfileGetOne200Response>>(localVarPath, deviceProfileGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新设备的配置信息，修改设备特定的参数设置。配置信息以JSON字符串形式存储，可覆盖产品物模型中对应属性的行为（如是否使用影子、是否记录历史等）。
* @summary 更新设备配置
* @param {DeviceProfile} deviceProfile
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceProfileUpdate (
deviceProfile: DeviceProfile,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/profile/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceProfile, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceProfileDelete operation in ThingsDeviceProfileApi.
 */
export interface ThingsDeviceProfileApiPostApiV1ThingsDeviceProfileDeleteRequest {
    readonly deviceProfileGetOneReq: DeviceProfileGetOneReq
}

/**
 * Request parameters for postApiV1ThingsDeviceProfileGetList operation in ThingsDeviceProfileApi.
 */
export interface ThingsDeviceProfileApiPostApiV1ThingsDeviceProfileGetListRequest {
    readonly deviceProfileGetListReq: DeviceProfileGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceProfileGetOne operation in ThingsDeviceProfileApi.
 */
export interface ThingsDeviceProfileApiPostApiV1ThingsDeviceProfileGetOneRequest {
    readonly deviceProfileGetOneReq: DeviceProfileGetOneReq
}

/**
 * Request parameters for postApiV1ThingsDeviceProfileUpdate operation in ThingsDeviceProfileApi.
 */
export interface ThingsDeviceProfileApiPostApiV1ThingsDeviceProfileUpdateRequest {
    readonly deviceProfile: DeviceProfile
}
