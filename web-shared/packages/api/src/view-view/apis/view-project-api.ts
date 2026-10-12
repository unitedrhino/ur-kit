import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewProjectGetList200Response } from '../models';
import type { PostApiV1ViewProjectGetOne200Response } from '../models';
import type { ProjectInfoCreateReq } from '../models';
import type { ProjectInfoDeleteReq } from '../models';
import type { ProjectInfoGetListReqEx } from '../models';
import type { ProjectInfoGetOneReq } from '../models';
import type { ProjectInfoUpdateReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewProjectApi - axios parameter creator
 */

/**
* 业务说明：创建新的可视化项目或模板，设置封面、名称、类型和发布状态，用于大屏项目初始化。
* @summary 新增项目
* @param {ProjectInfoCreateReq} projectInfoCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewProjectCreate (
projectInfoCreateReq: ProjectInfoCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/project/create`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, projectInfoCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除可视化项目记录，用于清理废弃项目或模板。
* @summary 删除项目
* @param {ProjectInfoDeleteReq} projectInfoDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewProjectDelete (
projectInfoDeleteReq: ProjectInfoDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/project/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, projectInfoDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询可视化项目列表，支持按类型、作用域、来源、名称、状态、创建人和时间范围筛选，用于项目管理页面。
* @summary 获取项目列表
* @param {ProjectInfoGetListReqEx} projectInfoGetListReqEx
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewProjectGetList (
projectInfoGetListReqEx: ProjectInfoGetListReqEx,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/project/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ViewProjectGetList200Response>>(localVarPath, projectInfoGetListReqEx, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个可视化项目的基础信息，用于项目编辑回显和详情查看。
* @summary 获取项目详情
* @param {ProjectInfoGetOneReq} projectInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewProjectGetOne (
projectInfoGetOneReq: ProjectInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/project/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ViewProjectGetOne200Response>>(localVarPath, projectInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新可视化项目的基础信息，如封面、名称、描述和状态，用于项目维护。
* @summary 更新项目
* @param {ProjectInfoUpdateReq} projectInfoUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewProjectUpdate (
projectInfoUpdateReq: ProjectInfoUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/project/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, projectInfoUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewProjectCreate operation in ViewProjectApi.
 */
export interface ViewProjectApiPostApiV1ViewProjectCreateRequest {
    readonly projectInfoCreateReq: ProjectInfoCreateReq
}

/**
 * Request parameters for postApiV1ViewProjectDelete operation in ViewProjectApi.
 */
export interface ViewProjectApiPostApiV1ViewProjectDeleteRequest {
    readonly projectInfoDeleteReq: ProjectInfoDeleteReq
}

/**
 * Request parameters for postApiV1ViewProjectGetList operation in ViewProjectApi.
 */
export interface ViewProjectApiPostApiV1ViewProjectGetListRequest {
    readonly projectInfoGetListReqEx: ProjectInfoGetListReqEx
}

/**
 * Request parameters for postApiV1ViewProjectGetOne operation in ViewProjectApi.
 */
export interface ViewProjectApiPostApiV1ViewProjectGetOneRequest {
    readonly projectInfoGetOneReq: ProjectInfoGetOneReq
}

/**
 * Request parameters for postApiV1ViewProjectUpdate operation in ViewProjectApi.
 */
export interface ViewProjectApiPostApiV1ViewProjectUpdateRequest {
    readonly projectInfoUpdateReq: ProjectInfoUpdateReq
}
