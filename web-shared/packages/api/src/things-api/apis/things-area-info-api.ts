import type { AreaInfo } from '../models';
import type { AreaInfoGetListReq } from '../models';
import type { AreaInfoGetOneReq } from '../models';
import type { AreaWithID } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsAreaInfoCreate200Response } from '../models';
import type { PostApiV1ThingsAreaInfoGetList200Response } from '../models';
import type { PostApiV1ThingsAreaInfoGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAreaInfoApi - axios parameter creator
 */

/**
* 在指定项目下创建新的区域节点，支持设置父区域ID形成树形层级结构。区域是设备管理的基本空间单元，设备绑定到区域后受区域权限控制。
* @summary 新增项目区域
* @param {AreaInfo} areaInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAreaInfoCreate (
areaInfo: AreaInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/area/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAreaInfoCreate200Response>>(localVarPath, areaInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除指定区域节点。系统创建的区域（isSysCreated=1）只有平台管理员可删除。删除父区域时需先删除所有子区域。
* @summary 删除项目区域
* @param {AreaWithID} areaWithID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAreaInfoDelete (
areaWithID: AreaWithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/area/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, areaWithID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按项目查询区域列表，支持按父区域ID过滤获取子节点、按区域ID列表批量查询。isRetTopLevel=true返回有权限的最高层区域。返回数据包含设备/分组统计。
* @summary 获取项目区域列表
* @param {AreaInfoGetListReq} areaInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAreaInfoGetList (
areaInfoGetListReq: AreaInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/area/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAreaInfoGetList200Response>>(localVarPath, areaInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询单个区域的完整信息，包括层级路径、设备统计、子区域数量。支持withChildren参数同时返回子区域列表，用于树形展示。
* @summary 获取项目区域详情
* @param {AreaInfoGetOneReq} areaInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAreaInfoGetOne (
areaInfoGetOneReq: AreaInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/area/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAreaInfoGetOne200Response>>(localVarPath, areaInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改区域的基本信息（名称、位置、描述、标签等），不支持修改父区域ID（需通过删除重建调整层级）。更新后设备的区域归属不变。
* @summary 更新项目区域
* @param {AreaInfo} areaInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAreaInfoUpdate (
areaInfo: AreaInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/area/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, areaInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAreaInfoCreate operation in ThingsAreaInfoApi.
 */
export interface ThingsAreaInfoApiPostApiV1ThingsAreaInfoCreateRequest {
    readonly areaInfo: AreaInfo
}

/**
 * Request parameters for postApiV1ThingsAreaInfoDelete operation in ThingsAreaInfoApi.
 */
export interface ThingsAreaInfoApiPostApiV1ThingsAreaInfoDeleteRequest {
    readonly areaWithID: AreaWithID
}

/**
 * Request parameters for postApiV1ThingsAreaInfoGetList operation in ThingsAreaInfoApi.
 */
export interface ThingsAreaInfoApiPostApiV1ThingsAreaInfoGetListRequest {
    readonly areaInfoGetListReq: AreaInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsAreaInfoGetOne operation in ThingsAreaInfoApi.
 */
export interface ThingsAreaInfoApiPostApiV1ThingsAreaInfoGetOneRequest {
    readonly areaInfoGetOneReq: AreaInfoGetOneReq
}

/**
 * Request parameters for postApiV1ThingsAreaInfoUpdate operation in ThingsAreaInfoApi.
 */
export interface ThingsAreaInfoApiPostApiV1ThingsAreaInfoUpdateRequest {
    readonly areaInfo: AreaInfo
}
