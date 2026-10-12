import type { FlowCategoryGetListReq } from '../models';
import type { FlowCategoryInfo } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemFlowCategoryGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemFlowCategoryApi - axios parameter creator
 */

/**
* 业务说明：创建一个流程分类，传入分类名称、分类编码【code，租户内唯一】、排序与备注；分类用于发起流程页的分组展示与流程定义归类。
* @summary 创建流程分类
* @param {FlowCategoryInfo} flowCategoryInfo  流程分类信息
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowCategoryCreate (
flowCategoryInfo: FlowCategoryInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/category/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, flowCategoryInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的流程分类；已被流程定义引用的分类应先调整引用关系后再删除。
* @summary 删除流程分类
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowCategoryDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/category/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询流程分类列表，支持按分类名称模糊、分类编码精确筛选；用于分类管理页与发起流程页的分组数据加载。
* @summary 获取流程分类分页
* @param {FlowCategoryGetListReq} flowCategoryGetListReq  流程分类分页请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowCategoryGetList (
flowCategoryGetListReq: FlowCategoryGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/category/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowCategoryGetList200Response>>(localVarPath, flowCategoryGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新流程分类信息，支持部分更新【仅传入需要修改的字段】；分类编码为租户内唯一标识，修改时需保证唯一性。
* @summary 更新流程分类
* @param {FlowCategoryInfo} flowCategoryInfo  流程分类信息
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowCategoryUpdate (
flowCategoryInfo: FlowCategoryInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/category/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowCategoryInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemFlowCategoryCreate operation in SystemFlowCategoryApi.
 */
export interface SystemFlowCategoryApiPostApiV1SystemFlowCategoryCreateRequest {
    /**
     *  流程分类信息
     */
    readonly flowCategoryInfo: FlowCategoryInfo
}

/**
 * Request parameters for postApiV1SystemFlowCategoryDelete operation in SystemFlowCategoryApi.
 */
export interface SystemFlowCategoryApiPostApiV1SystemFlowCategoryDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemFlowCategoryGetList operation in SystemFlowCategoryApi.
 */
export interface SystemFlowCategoryApiPostApiV1SystemFlowCategoryGetListRequest {
    /**
     *  流程分类分页请求
     */
    readonly flowCategoryGetListReq: FlowCategoryGetListReq
}

/**
 * Request parameters for postApiV1SystemFlowCategoryUpdate operation in SystemFlowCategoryApi.
 */
export interface SystemFlowCategoryApiPostApiV1SystemFlowCategoryUpdateRequest {
    /**
     *  流程分类信息
     */
    readonly flowCategoryInfo: FlowCategoryInfo
}
