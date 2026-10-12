import type { DeviceGroupBatchSaveReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceGroupApi - axios parameter creator
 */

/**
* 批量将设备添加到多个分组。分组用于设备分类管理，可按用途（purpose）区分（如default默认分组、alarm告警分组等）。支持同时添加到多个分组ID，用于设备批量归类、场景分组管理。
* @summary 将设备加到多个分组中
* @param {DeviceGroupBatchSaveReq} deviceGroupBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceGroupBatchCreate (
deviceGroupBatchSaveReq: DeviceGroupBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/group/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceGroupBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 将设备从指定分组中移除。不影响设备本身，只解除设备与分组的关联关系。用于设备不再属于某分组时的移除操作。
* @summary 删除设备所在分组
* @param {DeviceGroupBatchSaveReq} deviceGroupBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceGroupBatchDelete (
deviceGroupBatchSaveReq: DeviceGroupBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/group/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceGroupBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改设备所属的分组关系。传入新的分组ID列表，会替换设备原有的该用途下的分组关系。用于设备重新分类、调整分组归属。
* @summary 更新设备所在分组
* @param {DeviceGroupBatchSaveReq} deviceGroupBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceGroupBatchUpdate (
deviceGroupBatchSaveReq: DeviceGroupBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/group/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceGroupBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceGroupBatchCreate operation in ThingsDeviceGroupApi.
 */
export interface ThingsDeviceGroupApiPostApiV1ThingsDeviceGroupBatchCreateRequest {
    readonly deviceGroupBatchSaveReq: DeviceGroupBatchSaveReq
}

/**
 * Request parameters for postApiV1ThingsDeviceGroupBatchDelete operation in ThingsDeviceGroupApi.
 */
export interface ThingsDeviceGroupApiPostApiV1ThingsDeviceGroupBatchDeleteRequest {
    readonly deviceGroupBatchSaveReq: DeviceGroupBatchSaveReq
}

/**
 * Request parameters for postApiV1ThingsDeviceGroupBatchUpdate operation in ThingsDeviceGroupApi.
 */
export interface ThingsDeviceGroupApiPostApiV1ThingsDeviceGroupBatchUpdateRequest {
    readonly deviceGroupBatchSaveReq: DeviceGroupBatchSaveReq
}
