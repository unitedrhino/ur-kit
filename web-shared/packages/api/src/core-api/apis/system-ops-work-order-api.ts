import type { OpsWorkOrder } from '../models';
import type { OpsWorkOrderGetListReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemOpsWorkOrderGetList200Response } from '../models';
import type { PostApiV1SystemOpsWorkOrderGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemOpsWorkOrderApi - axios parameter creator
 */

/**
* 业务说明：用户创建运维工单，记录问题类型（如设备维修）、问题描述、相关区域等信息。工单进入待处理状态，运营人员可接单处理。支持所有登录用户提交工单。
* @summary 添加工单
* @param {OpsWorkOrder} opsWorkOrder
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemOpsWorkOrderCreate (
opsWorkOrder: OpsWorkOrder,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/ops/work-order/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, opsWorkOrder, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：软删除指定工单。仅租户管理员及以上可删除。用于工单管理页面的删除操作。
* @summary 删除工单
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemOpsWorkOrderDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/ops/work-order/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询运维工单列表，支持按状态、类型、区域、编号等条件筛选。普通用户查看自己提交的工单，平台管理员可查看所有租户的工单。用于工单管理页面的列表展示。
* @summary 获取工单列表
* @param {OpsWorkOrderGetListReq} opsWorkOrderGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemOpsWorkOrderGetList (
opsWorkOrderGetListReq: OpsWorkOrderGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/ops/work-order/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemOpsWorkOrderGetList200Response>>(localVarPath, opsWorkOrderGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据工单 ID 查询单个工单的完整信息。支持所有登录用户查看，非管理员只能查看自己提交的工单。用于工单详情抽屉展示。
* @summary 获取工单详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemOpsWorkOrderGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/ops/work-order/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemOpsWorkOrderGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新工单状态和处理信息，支持状态流转（待处理→处理中→已完成）。运营人员接单、处理完成时调用，记录处理时间和完成时间。
* @summary 更新工单
* @param {OpsWorkOrder} opsWorkOrder
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemOpsWorkOrderUpdate (
opsWorkOrder: OpsWorkOrder,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/ops/work-order/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, opsWorkOrder, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemOpsWorkOrderCreate operation in SystemOpsWorkOrderApi.
 */
export interface SystemOpsWorkOrderApiPostApiV1SystemOpsWorkOrderCreateRequest {
    readonly opsWorkOrder: OpsWorkOrder
}

/**
 * Request parameters for postApiV1SystemOpsWorkOrderDelete operation in SystemOpsWorkOrderApi.
 */
export interface SystemOpsWorkOrderApiPostApiV1SystemOpsWorkOrderDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemOpsWorkOrderGetList operation in SystemOpsWorkOrderApi.
 */
export interface SystemOpsWorkOrderApiPostApiV1SystemOpsWorkOrderGetListRequest {
    readonly opsWorkOrderGetListReq: OpsWorkOrderGetListReq
}

/**
 * Request parameters for postApiV1SystemOpsWorkOrderGetOne operation in SystemOpsWorkOrderApi.
 */
export interface SystemOpsWorkOrderApiPostApiV1SystemOpsWorkOrderGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemOpsWorkOrderUpdate operation in SystemOpsWorkOrderApi.
 */
export interface SystemOpsWorkOrderApiPostApiV1SystemOpsWorkOrderUpdateRequest {
    readonly opsWorkOrder: OpsWorkOrder
}
