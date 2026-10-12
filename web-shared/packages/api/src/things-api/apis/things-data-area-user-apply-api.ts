import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsDataAreaUserApplyGetList200Response } from '../models';
import type { UserAreaApplyDealReq } from '../models';
import type { UserAreaApplyGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDataAreaUserApplyApi - axios parameter creator
 */

/**
* 审批用户的区域权限申请请求，同意或拒绝。同意后用户获得申请的区域访问权限，拒绝后申请记录被清除。支持批量审批多个申请。
* @summary 授权区域权限
* @param {UserAreaApplyDealReq} userAreaApplyDealReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataAreaUserApplyDeal (
userAreaApplyDealReq: UserAreaApplyDealReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/area/user/apply/deal`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userAreaApplyDealReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询待审批或已审批的区域权限申请列表，返回申请ID、用户信息、区域信息、权限类型、申请时间等。用于权限申请管理界面展示。
* @summary 获取区域权限列表
* @param {UserAreaApplyGetListReq} userAreaApplyGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataAreaUserApplyGetList (
userAreaApplyGetListReq: UserAreaApplyGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/area/user/apply/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDataAreaUserApplyGetList200Response>>(localVarPath, userAreaApplyGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDataAreaUserApplyDeal operation in ThingsDataAreaUserApplyApi.
 */
export interface ThingsDataAreaUserApplyApiPostApiV1ThingsDataAreaUserApplyDealRequest {
    readonly userAreaApplyDealReq: UserAreaApplyDealReq
}

/**
 * Request parameters for postApiV1ThingsDataAreaUserApplyGetList operation in ThingsDataAreaUserApplyApi.
 */
export interface ThingsDataAreaUserApplyApiPostApiV1ThingsDataAreaUserApplyGetListRequest {
    readonly userAreaApplyGetListReq: UserAreaApplyGetListReq
}
