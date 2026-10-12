import type { PostApiV1RoadDetectionCommissionDelete200Response } from '../models';
import type { PostApiV1RoadDetectionTemplateGetList200Response } from '../models';
import type { PostApiV1RoadDetectionTemplateGetOne200Response } from '../models';
import type { PostApiV1RoadDetectionTemplateGroupGetList200Response } from '../models';
import type { PostApiV1RoadDetectionTemplateRelationGetList200Response } from '../models';
import type { PostApiV1RoadDetectionTemplateUpload200Response } from '../models';
import type { TemplateGetListReq } from '../models';
import type { TemplateUpdateReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionTemplateApi - axios parameter creator
 */

/**
* 删除模板及其关联关系
* @summary 删除模板
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTemplateDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/template/delete`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 分页查询已拆分的模板列表
* @summary 获取模板列表
* @param {TemplateGetListReq} templateGetListReq  模板列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTemplateGetList (
templateGetListReq: TemplateGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/template/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionTemplateGetList200Response>>(localVarPath, templateGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按 ID 获取模板详情（含字段与关联关系）
* @summary 获取模板详情
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTemplateGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/template/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionTemplateGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按上传批次分组展示模板（一次上传的模板归为一组）
* @summary 获取模板分组列表
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTemplateGroupGetList (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/template/group/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionTemplateGroupGetList200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取模板间自动识别的关联关系
* @summary 获取关联关系
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTemplateRelationGetList (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/template/relation/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionTemplateRelationGetList200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新模板名称、字段标签等
* @summary 更新模板
* @param {TemplateUpdateReq} templateUpdateReq  模板更新请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTemplateUpdate (
templateUpdateReq: TemplateUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/template/update`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionDelete200Response>>(localVarPath, templateUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 上传检测报告 Excel，按工作表动态拆分为模板并自动识别公式关联关系（不写死结构）
* @summary 上传 Excel 拆分模板
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionTemplateUpload (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/template/upload`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionTemplateUpload200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionTemplateDelete operation in RoadDetectionTemplateApi.
 */
export interface RoadDetectionTemplateApiPostApiV1RoadDetectionTemplateDeleteRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionTemplateGetList operation in RoadDetectionTemplateApi.
 */
export interface RoadDetectionTemplateApiPostApiV1RoadDetectionTemplateGetListRequest {
    /**
     *  模板列表请求
     */
    readonly templateGetListReq: TemplateGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionTemplateGetOne operation in RoadDetectionTemplateApi.
 */
export interface RoadDetectionTemplateApiPostApiV1RoadDetectionTemplateGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionTemplateUpdate operation in RoadDetectionTemplateApi.
 */
export interface RoadDetectionTemplateApiPostApiV1RoadDetectionTemplateUpdateRequest {
    /**
     *  模板更新请求
     */
    readonly templateUpdateReq: TemplateUpdateReq
}
