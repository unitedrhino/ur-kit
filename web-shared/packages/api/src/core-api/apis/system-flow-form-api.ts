import type { FlowFormTemplateGetListReq } from '../models';
import type { FlowFormTemplateInfo } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemFlowFormGetList200Response } from '../models';
import type { PostApiV1SystemFlowFormGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemFlowFormApi - axios parameter creator
 */

/**
* 业务说明：创建一个表单模板【草稿态】，传入表单名称、分类编码与表单JSON schema【formSchema，组件树+属性+校验规则，见设计方案2.6】；表单模板可被流程定义绑定，作为发起与审批时的表单结构。
* @summary 创建表单模板
* @param {FlowFormTemplateInfo} flowFormTemplateInfo  表单模板信息
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowFormCreate (
flowFormTemplateInfo: FlowFormTemplateInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/form/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, flowFormTemplateInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的表单模板；被任一流程定义引用的表单禁止删除【删除前校验引用，命中则报错】，此类表单只允许停用。
* @summary 删除表单模板
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowFormDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/form/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询表单模板列表，支持按表单名称模糊、分类编码与状态【draft草稿/published已发布】筛选；用于表单模板管理列表页。
* @summary 获取表单模板分页
* @param {FlowFormTemplateGetListReq} flowFormTemplateGetListReq  表单模板分页请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowFormGetList (
flowFormTemplateGetListReq: FlowFormTemplateGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/form/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowFormGetList200Response>>(localVarPath, flowFormTemplateGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据ID获取表单模板详情，返回表单名称、分类、表单JSON schema、版本号与状态；用于表单设计器与流程定义绑定的数据加载。
* @summary 获取表单模板详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowFormGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/form/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowFormGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新表单模板信息，支持部分更新【仅传入需要修改的字段】；表单结构【formSchema】修改后版本号自增，已绑定该模板的流程定义按最新结构渲染。
* @summary 更新表单模板
* @param {FlowFormTemplateInfo} flowFormTemplateInfo  表单模板信息
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowFormUpdate (
flowFormTemplateInfo: FlowFormTemplateInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/form/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowFormTemplateInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemFlowFormCreate operation in SystemFlowFormApi.
 */
export interface SystemFlowFormApiPostApiV1SystemFlowFormCreateRequest {
    /**
     *  表单模板信息
     */
    readonly flowFormTemplateInfo: FlowFormTemplateInfo
}

/**
 * Request parameters for postApiV1SystemFlowFormDelete operation in SystemFlowFormApi.
 */
export interface SystemFlowFormApiPostApiV1SystemFlowFormDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemFlowFormGetList operation in SystemFlowFormApi.
 */
export interface SystemFlowFormApiPostApiV1SystemFlowFormGetListRequest {
    /**
     *  表单模板分页请求
     */
    readonly flowFormTemplateGetListReq: FlowFormTemplateGetListReq
}

/**
 * Request parameters for postApiV1SystemFlowFormGetOne operation in SystemFlowFormApi.
 */
export interface SystemFlowFormApiPostApiV1SystemFlowFormGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemFlowFormUpdate operation in SystemFlowFormApi.
 */
export interface SystemFlowFormApiPostApiV1SystemFlowFormUpdateRequest {
    /**
     *  表单模板信息
     */
    readonly flowFormTemplateInfo: FlowFormTemplateInfo
}
