import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsUserDeviceCollectGetList200Response } from '../models';
import type { UserCollectDeviceSave } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsUserDeviceCollectApi - axios parameter creator
 */

/**
* 业务说明：用户将多个设备添加到个人收藏列表，便于快速访问常用设备。收藏关系保存在用户设备关联表中，不影响设备实际归属和权限。
* @summary 批量收藏设备
* @param {UserCollectDeviceSave} userCollectDeviceSave
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceCollectBatchCreate (
userCollectDeviceSave: UserCollectDeviceSave,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/collect/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userCollectDeviceSave, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：用户从个人收藏列表中移除多个设备，取消收藏不影响设备实际归属，仅删除用户与设备的收藏关联关系。
* @summary 批量取消收藏设备
* @param {UserCollectDeviceSave} userCollectDeviceSave
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceCollectBatchDelete (
userCollectDeviceSave: UserCollectDeviceSave,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/collect/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userCollectDeviceSave, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询当前用户收藏的所有设备信息，返回设备详情列表（包括产品名称、设备别名、在线状态等），用于用户快速访问常用设备。
* @summary 获取收藏设备列表
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceCollectGetList (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/collect/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceCollectGetList200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsUserDeviceCollectBatchCreate operation in ThingsUserDeviceCollectApi.
 */
export interface ThingsUserDeviceCollectApiPostApiV1ThingsUserDeviceCollectBatchCreateRequest {
    readonly userCollectDeviceSave: UserCollectDeviceSave
}

/**
 * Request parameters for postApiV1ThingsUserDeviceCollectBatchDelete operation in ThingsUserDeviceCollectApi.
 */
export interface ThingsUserDeviceCollectApiPostApiV1ThingsUserDeviceCollectBatchDeleteRequest {
    readonly userCollectDeviceSave: UserCollectDeviceSave
}
