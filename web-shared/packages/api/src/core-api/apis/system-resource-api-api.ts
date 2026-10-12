import type { ApiInfo } from '../models';
import type { ApiInfoGetListReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemResourceApiGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemResourceApiApi - axios parameter creator
 */

/**
* 业务说明：注册API接口定义。接口定义用于权限控制和操作日志记录，包含路由、请求方式、业务类型、日志模式等属性。用于新增业务接口后补充权限配置、API文档管理等场景。
* @summary 添加接口
* @param {ApiInfo} apiInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemResourceApiCreate (
apiInfo: ApiInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/resource/api/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, apiInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除API接口定义。删除前需确保无访问权限引用该接口，否则删除失败。用于清理废弃接口、API重构等场景。删除后相关权限配置需重新分配。
* @summary 删除接口
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemResourceApiDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/resource/api/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询API接口定义列表，支持按路由、请求方式、名称、授权类型筛选。用于接口管理页面、权限配置参考、API文档查看等场景。返回分页结果包含接口基本信息。
* @summary 获取接口列表
* @param {ApiInfoGetListReq} apiInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemResourceApiGetList (
apiInfoGetListReq: ApiInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/resource/api/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemResourceApiGetList200Response>>(localVarPath, apiInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改API接口定义。可调整接口名称、业务类型、日志模式等属性。路由和请求方式通常不可修改以保持权限引用稳定性。用于接口信息修正、日志策略调整等场景。
* @summary 更新接口
* @param {ApiInfo} apiInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemResourceApiUpdate (
apiInfo: ApiInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/resource/api/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, apiInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemResourceApiCreate operation in SystemResourceApiApi.
 */
export interface SystemResourceApiApiPostApiV1SystemResourceApiCreateRequest {
    readonly apiInfo: ApiInfo
}

/**
 * Request parameters for postApiV1SystemResourceApiDelete operation in SystemResourceApiApi.
 */
export interface SystemResourceApiApiPostApiV1SystemResourceApiDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemResourceApiGetList operation in SystemResourceApiApi.
 */
export interface SystemResourceApiApiPostApiV1SystemResourceApiGetListRequest {
    readonly apiInfoGetListReq: ApiInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemResourceApiUpdate operation in SystemResourceApiApi.
 */
export interface SystemResourceApiApiPostApiV1SystemResourceApiUpdateRequest {
    readonly apiInfo: ApiInfo
}
