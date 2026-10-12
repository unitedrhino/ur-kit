import type { GroupCreateReq } from '../models';
import type { GroupDeleteReq } from '../models';
import type { GroupGetListReq } from '../models';
import type { GroupUpdateReq } from '../models';
import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewGroupGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewGroupApi - axios parameter creator
 */

/**
* 业务说明：创建可视化资源分组，支持数据集、组件、资源库等分组场景。用于左侧分组栏管理。
* @summary 创建分组
* @param {GroupCreateReq} groupCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewGroupCreate (
groupCreateReq: GroupCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/group/create`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, groupCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除可视化分组。用于清理无效分组。
* @summary 删除分组
* @param {GroupDeleteReq} groupDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewGroupDelete (
groupDeleteReq: GroupDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/group/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, groupDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询可视化分组列表，支持数据集、组件、资源库等类型。用于页面左侧分组栏展示。
* @summary 获取分组列表
* @param {GroupGetListReq} groupGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewGroupGetList (
groupGetListReq: GroupGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/group/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ViewGroupGetList200Response>>(localVarPath, groupGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新可视化分组名称和排序。用于分组栏维护。
* @summary 更新分组
* @param {GroupUpdateReq} groupUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewGroupUpdate (
groupUpdateReq: GroupUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/group/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, groupUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewGroupCreate operation in ViewGroupApi.
 */
export interface ViewGroupApiPostApiV1ViewGroupCreateRequest {
    readonly groupCreateReq: GroupCreateReq
}

/**
 * Request parameters for postApiV1ViewGroupDelete operation in ViewGroupApi.
 */
export interface ViewGroupApiPostApiV1ViewGroupDeleteRequest {
    readonly groupDeleteReq: GroupDeleteReq
}

/**
 * Request parameters for postApiV1ViewGroupGetList operation in ViewGroupApi.
 */
export interface ViewGroupApiPostApiV1ViewGroupGetListRequest {
    readonly groupGetListReq: GroupGetListReq
}

/**
 * Request parameters for postApiV1ViewGroupUpdate operation in ViewGroupApi.
 */
export interface ViewGroupApiPostApiV1ViewGroupUpdateRequest {
    readonly groupUpdateReq: GroupUpdateReq
}
