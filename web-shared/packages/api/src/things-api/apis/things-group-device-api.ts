import type { GroupDeviceBatchDeleteReq } from '../models';
import type { GroupDeviceBatchSaveReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsGroupDeviceApi - axios parameter creator
 */

/**
* 业务说明：批量将设备添加到分组。一个设备可属于多个分组。添加后设备可通过分组进行批量操作【如批量控制、批量查询】
* @summary 添加分组设备
* @param {GroupDeviceBatchSaveReq} groupDeviceBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsGroupDeviceBatchCreate (
groupDeviceBatchSaveReq: GroupDeviceBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/group/device/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, groupDeviceBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量从分组中移除设备。移除后设备不再属于该分组，设备本身配置和数据不受影响
* @summary 删除分组设备
* @param {GroupDeviceBatchDeleteReq} groupDeviceBatchDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsGroupDeviceBatchDelete (
groupDeviceBatchDeleteReq: GroupDeviceBatchDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/group/device/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, groupDeviceBatchDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量更新分组内的设备列表。传入的设备列表会完全替换原有设备关系。用于分组设备成员调整
* @summary 更新分组设备
* @param {GroupDeviceBatchSaveReq} groupDeviceBatchSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsGroupDeviceBatchUpdate (
groupDeviceBatchSaveReq: GroupDeviceBatchSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/group/device/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, groupDeviceBatchSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsGroupDeviceBatchCreate operation in ThingsGroupDeviceApi.
 */
export interface ThingsGroupDeviceApiPostApiV1ThingsGroupDeviceBatchCreateRequest {
    readonly groupDeviceBatchSaveReq: GroupDeviceBatchSaveReq
}

/**
 * Request parameters for postApiV1ThingsGroupDeviceBatchDelete operation in ThingsGroupDeviceApi.
 */
export interface ThingsGroupDeviceApiPostApiV1ThingsGroupDeviceBatchDeleteRequest {
    readonly groupDeviceBatchDeleteReq: GroupDeviceBatchDeleteReq
}

/**
 * Request parameters for postApiV1ThingsGroupDeviceBatchUpdate operation in ThingsGroupDeviceApi.
 */
export interface ThingsGroupDeviceApiPostApiV1ThingsGroupDeviceBatchUpdateRequest {
    readonly groupDeviceBatchSaveReq: GroupDeviceBatchSaveReq
}
