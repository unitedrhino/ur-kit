import type { Agreement } from '../models';
import type { AgreementGetListReq } from '../models';
import type { AgreementPreviewRenderReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemAgreementGetList200Response } from '../models';
import type { PostApiV1SystemAgreementGetOne200Response } from '../models';
import type { PostApiV1SystemAgreementPreviewRender200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemAgreementApi - axios parameter creator
 */

/**
* 业务说明：创建独立协议模板。协议内容由前端以 HTML 形式提交，支持模板变量【{{.appName}}】、【{{.tenantName}}】、【{{.platformName}}】用于后续按应用与企业上下文渲染。
* @summary 创建协议
* @param {Agreement} agreement
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAgreementCreate (
agreement: Agreement,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/agreement/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, agreement, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定协议，并同步清理关联的应用绑定关系。删除后不可恢复。
* @summary 删除协议
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAgreementDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/agreement/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询协议库，支持按编码、名称、标题、状态和绑定应用过滤。协议编码在协议库内允许重复。
* @summary 获取协议列表
* @param {AgreementGetListReq} agreementGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAgreementGetList (
agreementGetListReq: AgreementGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/agreement/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementGetList200Response>>(localVarPath, agreementGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取独立协议的完整详情，返回协议 HTML 内容模板，用于编辑页回填。
* @summary 获取协议详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAgreementGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/agreement/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据应用、企业和平台上下文预渲染协议 HTML 模板，替换变量后返回最终 HTML。
* @summary 预览渲染协议
* @param {AgreementPreviewRenderReq} agreementPreviewRenderReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAgreementPreviewRender (
agreementPreviewRenderReq: AgreementPreviewRenderReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/agreement/preview-render`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementPreviewRender200Response>>(localVarPath, agreementPreviewRenderReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新协议的基础信息、HTML 内容与状态。协议编码在协议库内允许重复。
* @summary 更新协议
* @param {Agreement} agreement
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAgreementUpdate (
agreement: Agreement,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/agreement/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, agreement, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemAgreementCreate operation in SystemAgreementApi.
 */
export interface SystemAgreementApiPostApiV1SystemAgreementCreateRequest {
    readonly agreement: Agreement
}

/**
 * Request parameters for postApiV1SystemAgreementDelete operation in SystemAgreementApi.
 */
export interface SystemAgreementApiPostApiV1SystemAgreementDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemAgreementGetList operation in SystemAgreementApi.
 */
export interface SystemAgreementApiPostApiV1SystemAgreementGetListRequest {
    readonly agreementGetListReq: AgreementGetListReq
}

/**
 * Request parameters for postApiV1SystemAgreementGetOne operation in SystemAgreementApi.
 */
export interface SystemAgreementApiPostApiV1SystemAgreementGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemAgreementPreviewRender operation in SystemAgreementApi.
 */
export interface SystemAgreementApiPostApiV1SystemAgreementPreviewRenderRequest {
    readonly agreementPreviewRenderReq: AgreementPreviewRenderReq
}

/**
 * Request parameters for postApiV1SystemAgreementUpdate operation in SystemAgreementApi.
 */
export interface SystemAgreementApiPostApiV1SystemAgreementUpdateRequest {
    readonly agreement: Agreement
}
