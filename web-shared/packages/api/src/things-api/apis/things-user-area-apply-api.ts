import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { UserAreaApplyCreateReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsUserAreaApplyApi - axios parameter creator
 */

/**
* 业务说明：用户向系统申请特定区域的访问权限，支持读权限（查看区域下设备和数据）和管理权限（编辑、控制设备）。申请提交后进入审批流程，审批通过后用户获得对应区域权限。
* @summary 申请用户区域权限
* @param {UserAreaApplyCreateReq} userAreaApplyCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserAreaApplyCreate (
userAreaApplyCreateReq: UserAreaApplyCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/area/apply/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userAreaApplyCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsUserAreaApplyCreate operation in ThingsUserAreaApplyApi.
 */
export interface ThingsUserAreaApplyApiPostApiV1ThingsUserAreaApplyCreateRequest {
    readonly userAreaApplyCreateReq: UserAreaApplyCreateReq
}
