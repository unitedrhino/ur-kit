import type { FlowProcessDefGetListReq } from '../models';
import type { FlowProcessDefInfo } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemFlowDefGetList200Response } from '../models';
import type { PostApiV1SystemFlowDefGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemFlowDefApi - axios parameter creator
 */

/**
* 业务说明：创建一个新的流程定义【草稿态】，传入流程编码【processCode，业务唯一】、流程名称、分类编码、图标、流程JSON模型【modelContent，节点树见设计方案2.1】与绑定的表单模板ID；创建后为草稿状态，需发布后用户才可发起。
* @summary 创建流程定义
* @param {FlowProcessDefInfo} flowProcessDefInfo  流程定义信息
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowDefCreate (
flowProcessDefInfo: FlowProcessDefInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/def/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, flowProcessDefInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的流程定义；若该定义存在运行中或历史流程实例则禁止删除，需要先清理实例或改为停用。
* @summary 删除流程定义
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowDefDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/def/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：发布指定的流程定义，定义版本号加一并转为已发布状态，同编码的旧发布版本自动转为历史版本【history】；发布后用户即可按流程编码发起新实例。
* @summary 发布流程定义
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowDefDeploy (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/def/deploy`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询流程定义列表，支持按流程编码精确、流程名称模糊、分类编码与状态【draft草稿/published已发布/history历史版本/stopped停用】筛选；用于流程定义管理列表页。
* @summary 获取流程定义分页
* @param {FlowProcessDefGetListReq} flowProcessDefGetListReq  流程定义分页请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowDefGetList (
flowProcessDefGetListReq: FlowProcessDefGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/def/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowDefGetList200Response>>(localVarPath, flowProcessDefGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据ID获取流程定义详情，返回流程编码、名称、分类、图标、流程JSON模型【modelContent】、版本号、状态与绑定的表单模板信息；用于流程设计器的数据加载。
* @summary 获取流程定义详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowDefGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/def/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemFlowDefGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：停用指定的流程定义，状态转为停用【stopped】；停用后用户不可再按该流程发起新实例，运行中的实例不受影响。
* @summary 停用流程定义
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowDefUnpublish (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/def/unpublish`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新流程定义信息，支持部分更新【仅传入需要修改的字段】；流程编码发布后不可修改，流程JSON模型修改后需重新发布生效。
* @summary 更新流程定义
* @param {FlowProcessDefInfo} flowProcessDefInfo  流程定义信息
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemFlowDefUpdate (
flowProcessDefInfo: FlowProcessDefInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/flow/def/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, flowProcessDefInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemFlowDefCreate operation in SystemFlowDefApi.
 */
export interface SystemFlowDefApiPostApiV1SystemFlowDefCreateRequest {
    /**
     *  流程定义信息
     */
    readonly flowProcessDefInfo: FlowProcessDefInfo
}

/**
 * Request parameters for postApiV1SystemFlowDefDelete operation in SystemFlowDefApi.
 */
export interface SystemFlowDefApiPostApiV1SystemFlowDefDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemFlowDefDeploy operation in SystemFlowDefApi.
 */
export interface SystemFlowDefApiPostApiV1SystemFlowDefDeployRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemFlowDefGetList operation in SystemFlowDefApi.
 */
export interface SystemFlowDefApiPostApiV1SystemFlowDefGetListRequest {
    /**
     *  流程定义分页请求
     */
    readonly flowProcessDefGetListReq: FlowProcessDefGetListReq
}

/**
 * Request parameters for postApiV1SystemFlowDefGetOne operation in SystemFlowDefApi.
 */
export interface SystemFlowDefApiPostApiV1SystemFlowDefGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemFlowDefUnpublish operation in SystemFlowDefApi.
 */
export interface SystemFlowDefApiPostApiV1SystemFlowDefUnpublishRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemFlowDefUpdate operation in SystemFlowDefApi.
 */
export interface SystemFlowDefApiPostApiV1SystemFlowDefUpdateRequest {
    /**
     *  流程定义信息
     */
    readonly flowProcessDefInfo: FlowProcessDefInfo
}
