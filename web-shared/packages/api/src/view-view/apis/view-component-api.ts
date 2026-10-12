import type { ComponentCopyReq } from '../models';
import type { ComponentCreateReq } from '../models';
import type { ComponentDeleteReq } from '../models';
import type { ComponentDesignReq } from '../models';
import type { ComponentGetListReq } from '../models';
import type { ComponentGetOneReq } from '../models';
import type { ComponentUpdateReq } from '../models';
import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewComponentGetList200Response } from '../models';
import type { PostApiV1ViewComponentGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewComponentApi - axios parameter creator
 */

/**
* 业务说明：复制现有组件生成新的组件记录，用于快速复用已有组件模板。
* @summary 复制组件
* @param {ComponentCopyReq} componentCopyReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewComponentCopy (
componentCopyReq: ComponentCopyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/component/copy`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, componentCopyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建新的可视化组件，登记组件名称、分类、内容和入口信息。用于组件库建设。
* @summary 新增组件
* @param {ComponentCreateReq} componentCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewComponentCreate (
componentCreateReq: ComponentCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/component/create`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, componentCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除组件库中的组件记录。用于清理废弃组件。
* @summary 删除组件
* @param {ComponentDeleteReq} componentDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewComponentDelete (
componentDeleteReq: ComponentDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/component/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, componentDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：保存组件的设计内容 JSON，用于组件设计器编辑后的内容持久化。
* @summary 保存组件设计内容
* @param {ComponentDesignReq} componentDesignReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewComponentDesign (
componentDesignReq: ComponentDesignReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/component/design`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, componentDesignReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询组件库列表，支持按名称、分类、状态、来源、创建人、创建时间、更新时间和分组筛选。用于组件选择和管理。
* @summary 获取组件列表
* @param {ComponentGetListReq} componentGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewComponentGetList (
componentGetListReq: ComponentGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/component/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ViewComponentGetList200Response>>(localVarPath, componentGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个组件的完整定义和设计内容，用于组件编辑回显。
* @summary 获取组件详情
* @param {ComponentGetOneReq} componentGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewComponentGetOne (
componentGetOneReq: ComponentGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/component/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ViewComponentGetOne200Response>>(localVarPath, componentGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新组件的基础信息、分类、版本、封面或状态。用于组件维护和发布管理。
* @summary 更新组件
* @param {ComponentUpdateReq} componentUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewComponentUpdate (
componentUpdateReq: ComponentUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/component/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, componentUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewComponentCopy operation in ViewComponentApi.
 */
export interface ViewComponentApiPostApiV1ViewComponentCopyRequest {
    readonly componentCopyReq: ComponentCopyReq
}

/**
 * Request parameters for postApiV1ViewComponentCreate operation in ViewComponentApi.
 */
export interface ViewComponentApiPostApiV1ViewComponentCreateRequest {
    readonly componentCreateReq: ComponentCreateReq
}

/**
 * Request parameters for postApiV1ViewComponentDelete operation in ViewComponentApi.
 */
export interface ViewComponentApiPostApiV1ViewComponentDeleteRequest {
    readonly componentDeleteReq: ComponentDeleteReq
}

/**
 * Request parameters for postApiV1ViewComponentDesign operation in ViewComponentApi.
 */
export interface ViewComponentApiPostApiV1ViewComponentDesignRequest {
    readonly componentDesignReq: ComponentDesignReq
}

/**
 * Request parameters for postApiV1ViewComponentGetList operation in ViewComponentApi.
 */
export interface ViewComponentApiPostApiV1ViewComponentGetListRequest {
    readonly componentGetListReq: ComponentGetListReq
}

/**
 * Request parameters for postApiV1ViewComponentGetOne operation in ViewComponentApi.
 */
export interface ViewComponentApiPostApiV1ViewComponentGetOneRequest {
    readonly componentGetOneReq: ComponentGetOneReq
}

/**
 * Request parameters for postApiV1ViewComponentUpdate operation in ViewComponentApi.
 */
export interface ViewComponentApiPostApiV1ViewComponentUpdateRequest {
    readonly componentUpdateReq: ComponentUpdateReq
}
