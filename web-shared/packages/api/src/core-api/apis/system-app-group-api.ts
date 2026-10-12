import type { AppGroupInfo } from '../models';
import type { AppGroupInfoGetListReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemAppGroupGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemAppGroupApi - axios parameter creator
 */

/**
* 业务说明：创建新的应用分组，包括分组名称、图标、描述、排序。应用分组用于把相关应用按业务场景归类，应用最多属于一个分组，未分组应用 group_id=2。
* @summary 创建应用分组
* @param {AppGroupInfo} appGroupInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppGroupCreate (
appGroupInfo: AppGroupInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/group/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, appGroupInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定应用分组，删除后组内应用自动回置未分组(group_id=2)，不删除应用本身。默认组(ID=2,全部应用)不允许删除。
* @summary 删除应用分组
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppGroupDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/group/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询应用分组列表，支持按名称模糊筛选。所有登录用户可读，用于控制台首页按组展示、租户/角色授权界面按组展示。
* @summary 获取应用分组列表
* @param {AppGroupInfoGetListReq} appGroupInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppGroupGetList (
appGroupInfoGetListReq: AppGroupInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/group/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppGroupGetList200Response>>(localVarPath, appGroupInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改应用分组信息，包括名称、图标、描述、排序，支持部分更新。默认组(全部应用,ID=2)不允许删除但可调整展示字段。
* @summary 更新应用分组
* @param {AppGroupInfo} appGroupInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppGroupUpdate (
appGroupInfo: AppGroupInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/group/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, appGroupInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemAppGroupCreate operation in SystemAppGroupApi.
 */
export interface SystemAppGroupApiPostApiV1SystemAppGroupCreateRequest {
    readonly appGroupInfo: AppGroupInfo
}

/**
 * Request parameters for postApiV1SystemAppGroupDelete operation in SystemAppGroupApi.
 */
export interface SystemAppGroupApiPostApiV1SystemAppGroupDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemAppGroupGetList operation in SystemAppGroupApi.
 */
export interface SystemAppGroupApiPostApiV1SystemAppGroupGetListRequest {
    readonly appGroupInfoGetListReq: AppGroupInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemAppGroupUpdate operation in SystemAppGroupApi.
 */
export interface SystemAppGroupApiPostApiV1SystemAppGroupUpdateRequest {
    readonly appGroupInfo: AppGroupInfo
}
