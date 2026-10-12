import type { DeviceModuleVersionGetListReq } from '../models';
import type { DeviceModuleVersionGetOneReq } from '../models';
import type { PostApiV1ThingsDeviceVersionGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceVersionGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceVersionApi - axios parameter creator
 */

/**
* 查询设备的模块版本信息列表。模块版本用于记录设备各个模块（如固件、软件、硬件）的版本号，便于OTA升级管理和版本追溯。支持按产品、模块编码筛选。
* @summary 获取设备模块版本列表
* @param {DeviceModuleVersionGetListReq} deviceModuleVersionGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceVersionGetList (
deviceModuleVersionGetListReq: DeviceModuleVersionGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/version/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceVersionGetList200Response>>(localVarPath, deviceModuleVersionGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取设备单个模块的版本详情信息。可通过ID、产品+模块编码等方式查询。用于查看特定模块的版本号、版本名称等详细信息。
* @summary 获取设备模块版本详情
* @param {DeviceModuleVersionGetOneReq} deviceModuleVersionGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceVersionGetOne (
deviceModuleVersionGetOneReq: DeviceModuleVersionGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/version/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceVersionGetOne200Response>>(localVarPath, deviceModuleVersionGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceVersionGetList operation in ThingsDeviceVersionApi.
 */
export interface ThingsDeviceVersionApiPostApiV1ThingsDeviceVersionGetListRequest {
    readonly deviceModuleVersionGetListReq: DeviceModuleVersionGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceVersionGetOne operation in ThingsDeviceVersionApi.
 */
export interface ThingsDeviceVersionApiPostApiV1ThingsDeviceVersionGetOneRequest {
    readonly deviceModuleVersionGetOneReq: DeviceModuleVersionGetOneReq
}
