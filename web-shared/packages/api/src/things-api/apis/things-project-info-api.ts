import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProjectInfoCreate200Response } from '../models';
import type { PostApiV1ThingsProjectInfoGetList200Response } from '../models';
import type { PostApiV1ThingsProjectInfoGetOne200Response } from '../models';
import type { ProjectInfo } from '../models';
import type { ProjectInfoCreateReq } from '../models';
import type { ProjectInfoGetListReq } from '../models';
import type { ProjectWithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProjectInfoApi - axios parameter creator
 */

/**
* 创建新的项目空间，项目是物联网平台的顶层组织单元，包含区域、设备、用户等。支持设置项目名称、位置、图片、描述等基本信息，管理员默认为当前用户。
* @summary 新增项目
* @param {ProjectInfoCreateReq} projectInfoCreateReq  ProjectInfoCreateReq 新增项目请求体，仅包含可写字段
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectInfoCreate (
projectInfoCreateReq: ProjectInfoCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectInfoCreate200Response>>(localVarPath, projectInfoCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除项目及其所有关联数据（区域、设备绑定关系、用户权限等）。系统创建的项目需平台管理员权限。删除操作不可恢复，需谨慎操作。
* @summary 删除项目
* @param {ProjectWithID} projectWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectInfoDelete (
projectWithID: ProjectWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, projectWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询用户有权限的项目列表，支持按名称模糊搜索、按状态过滤。平台管理员可通过isGetAll获取所有租户的项目。返回数据包含设备统计和报警状态。
* @summary 获取项目列表
* @param {ProjectInfoGetListReq} projectInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectInfoGetList (
projectInfoGetListReq: ProjectInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectInfoGetList200Response>>(localVarPath, projectInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询单个项目的完整信息，包括区域统计、用户统计、设备统计、在线设备统计、报警状态等。支持同时获取管理员信息和顶层区域列表。
* @summary 获取项目详情
* @param {ProjectWithID} projectWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectInfoGetOne (
projectWithID: ProjectWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectInfoGetOne200Response>>(localVarPath, projectWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改项目的基本信息，包括名称、地址、图片、描述、标签、状态等。系统创建的项目（isSysCreated=1）只有平台管理员可删除。
* @summary 更新项目
* @param {ProjectInfo} projectInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProjectInfoUpdate (
projectInfo: ProjectInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/project/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, projectInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProjectInfoCreate operation in ThingsProjectInfoApi.
 */
export interface ThingsProjectInfoApiPostApiV1ThingsProjectInfoCreateRequest {
    /**
     *  ProjectInfoCreateReq 新增项目请求体，仅包含可写字段
     */
    readonly projectInfoCreateReq: ProjectInfoCreateReq
}

/**
 * Request parameters for postApiV1ThingsProjectInfoDelete operation in ThingsProjectInfoApi.
 */
export interface ThingsProjectInfoApiPostApiV1ThingsProjectInfoDeleteRequest {
    readonly projectWithID: ProjectWithID
}

/**
 * Request parameters for postApiV1ThingsProjectInfoGetList operation in ThingsProjectInfoApi.
 */
export interface ThingsProjectInfoApiPostApiV1ThingsProjectInfoGetListRequest {
    readonly projectInfoGetListReq: ProjectInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsProjectInfoGetOne operation in ThingsProjectInfoApi.
 */
export interface ThingsProjectInfoApiPostApiV1ThingsProjectInfoGetOneRequest {
    readonly projectWithID: ProjectWithID
}

/**
 * Request parameters for postApiV1ThingsProjectInfoUpdate operation in ThingsProjectInfoApi.
 */
export interface ThingsProjectInfoApiPostApiV1ThingsProjectInfoUpdateRequest {
    readonly projectInfo: ProjectInfo
}
