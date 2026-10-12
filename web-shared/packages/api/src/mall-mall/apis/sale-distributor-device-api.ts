import type { DeviceCore } from '../models';
import type { DeviceInfoGetListReq } from '../models';
import type { DeviceInfoGetOneReq } from '../models';
import type { DeviceMoveReq } from '../models';
import type { DeviceSaveReq } from '../models';
import type { PostApiV1SaleDistributorApplyCreate200Response } from '../models';
import type { PostApiV1SaleDistributorDeviceGetList200Response } from '../models';
import type { PostApiV1SaleDistributorDeviceGetOne200Response } from '../models';
import type { PostApiV1SaleDistributorDeviceMultiImport200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SaleDistributorDeviceApi - axios parameter creator
 */

/**
* 将指定设备绑定到当前经销商
* @summary 绑定设备
* @param {DeviceSaveReq} deviceSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceCreate (
deviceSaveReq: DeviceSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/create`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, deviceSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 将指定设备从当前经销商解绑
* @summary 解绑设备
* @param {DeviceSaveReq} deviceSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceDelete (
deviceSaveReq: DeviceSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, deviceSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按经销商、产品、区域、分组等条件分页查询设备列表，支持同时返回设备扩展信息
* @summary 获取设备列表
* @param {DeviceInfoGetListReq} deviceInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceGetList (
deviceInfoGetListReq: DeviceInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorDeviceGetList200Response>>(localVarPath, deviceInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据产品ID和设备名称查询单个设备详情，支持同时返回拥有人、最新属性等扩展信息
* @summary 获取设备详情
* @param {DeviceInfoGetOneReq} deviceInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceGetOne (
deviceInfoGetOneReq: DeviceInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorDeviceGetOne200Response>>(localVarPath, deviceInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 将设备从一个产品/设备迁移到另一个产品/设备，可携带配置项
* @summary 迁移设备数据
* @param {DeviceMoveReq} deviceMoveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceMove (
deviceMoveReq: DeviceMoveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/move`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, deviceMoveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 通过上传Excel批量导入设备，支持绑定或解绑操作
* @summary 批量导入设备
* @param {File} [bodyParam.file]
* @param {number} [bodyParam.distributorID] 经销商id
* @param {number} [bodyParam.opt] 1:绑定 2:解绑
* @param {number} [bodyParam.distributorid] //经销商id
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceMultiImport (bodyParam: { file: File; distributorID?: number; opt?: number; distributorid?: number; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/multi-import`;
        if ((bodyParam as Record<string, unknown>)['distributorID'] !== undefined) {
            localVarQueryParameter['distributorID'] = (bodyParam as Record<string, unknown>)['distributorID'];
        }
        if ((bodyParam as Record<string, unknown>)['opt'] !== undefined) {
            localVarQueryParameter['opt'] = (bodyParam as Record<string, unknown>)['opt'];
        }
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorDeviceMultiImport200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 重置指定设备的状态或数据
* @summary 重置设备
* @param {DeviceCore} deviceCore
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceReset (
deviceCore: DeviceCore,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/reset`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, deviceCore, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 解除设备与用户的绑定关系
* @summary 解绑用户设备
* @param {DeviceCore} deviceCore
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SaleDistributorDeviceUnbind (
deviceCore: DeviceCore,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/sale/distributor/device/unbind`;
    return requestClient.post<ExtractDataType<PostApiV1SaleDistributorApplyCreate200Response>>(localVarPath, deviceCore, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SaleDistributorDeviceCreate operation in SaleDistributorDeviceApi.
 */
export interface SaleDistributorDeviceApiPostApiV1SaleDistributorDeviceCreateRequest {
    readonly deviceSaveReq: DeviceSaveReq
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceDelete operation in SaleDistributorDeviceApi.
 */
export interface SaleDistributorDeviceApiPostApiV1SaleDistributorDeviceDeleteRequest {
    readonly deviceSaveReq: DeviceSaveReq
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceGetList operation in SaleDistributorDeviceApi.
 */
export interface SaleDistributorDeviceApiPostApiV1SaleDistributorDeviceGetListRequest {
    readonly deviceInfoGetListReq: DeviceInfoGetListReq
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceGetOne operation in SaleDistributorDeviceApi.
 */
export interface SaleDistributorDeviceApiPostApiV1SaleDistributorDeviceGetOneRequest {
    readonly deviceInfoGetOneReq: DeviceInfoGetOneReq
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceMove operation in SaleDistributorDeviceApi.
 */
export interface SaleDistributorDeviceApiPostApiV1SaleDistributorDeviceMoveRequest {
    readonly deviceMoveReq: DeviceMoveReq
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceMultiImport operation in SaleDistributorDeviceApi.
 */
export interface SaleDistributorDeviceApiPostApiV1SaleDistributorDeviceMultiImportRequest {
    readonly file: File

    /**
     * 经销商id
     */
    readonly distributorID?: number

    /**
     * 1:绑定 2:解绑
     */
    readonly opt?: number

    /**
     * //经销商id
     */
    readonly distributorid?: number

    /**
     * //1:绑定 2:解绑
     */
    readonly opt2?: number
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceReset operation in SaleDistributorDeviceApi.
 */
export interface SaleDistributorDeviceApiPostApiV1SaleDistributorDeviceResetRequest {
    readonly deviceCore: DeviceCore
}

/**
 * Request parameters for postApiV1SaleDistributorDeviceUnbind operation in SaleDistributorDeviceApi.
 */
export interface SaleDistributorDeviceApiPostApiV1SaleDistributorDeviceUnbindRequest {
    readonly deviceCore: DeviceCore
}
