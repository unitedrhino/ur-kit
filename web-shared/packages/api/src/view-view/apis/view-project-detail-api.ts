import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewProjectDetailGetOne200Response } from '../models';
import type { ProjectDetail } from '../models';
import type { ProjectInfoGetOneReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewProjectDetailApi - axios parameter creator
 */

/**
* 业务说明：查询可视化项目的详细内容定义，用于设计器加载项目内容。
* @summary 获取项目详情内容
* @param {ProjectInfoGetOneReq} projectInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewProjectDetailGetOne (
projectInfoGetOneReq: ProjectInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/project/detail/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ViewProjectDetailGetOne200Response>>(localVarPath, projectInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：保存可视化项目的详细内容定义，用于项目设计稿和画布内容更新。
* @summary 更新项目详情
* @param {ProjectDetail} projectDetail
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewProjectDetailUpdate (
projectDetail: ProjectDetail,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/project/detail/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, projectDetail, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewProjectDetailGetOne operation in ViewProjectDetailApi.
 */
export interface ViewProjectDetailApiPostApiV1ViewProjectDetailGetOneRequest {
    readonly projectInfoGetOneReq: ProjectInfoGetOneReq
}

/**
 * Request parameters for postApiV1ViewProjectDetailUpdate operation in ViewProjectDetailApi.
 */
export interface ViewProjectDetailApiPostApiV1ViewProjectDetailUpdateRequest {
    readonly projectDetail: ProjectDetail
}
