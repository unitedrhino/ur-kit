import type { PostApiV1SystemLogLoginGetList200Response } from '../models';
import type { PostApiV1SystemLogOperGetList200Response } from '../models';
import type { SysLogLoginGetListReq } from '../models';
import type { SysLogOperGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemLogApi - axios parameter creator
 */

/**
* 业务说明：查询用户登录日志列表，支持按IP、登录地点、时间范围、用户、登录状态筛选。用于安全审计、异常登录检测、用户行为分析等场景。返回分页结果包含登录IP、地点、浏览器、操作系统等信息。
* @summary 获取登录日志列表
* @param {SysLogLoginGetListReq} sysLogLoginGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemLogLoginGetList (
sysLogLoginGetListReq: SysLogLoginGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/log/login/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemLogLoginGetList200Response>>(localVarPath, sysLogLoginGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询用户操作日志列表，支持按操作名称、操作人、业务类型、时间范围、状态筛选。用于操作审计、问题追溯、安全合规等场景。返回分页结果包含操作详情、请求参数、响应结果、执行状态等完整信息。
* @summary 获取操作日志列表
* @param {SysLogOperGetListReq} sysLogOperGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemLogOperGetList (
sysLogOperGetListReq: SysLogOperGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/log/oper/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemLogOperGetList200Response>>(localVarPath, sysLogOperGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemLogLoginGetList operation in SystemLogApi.
 */
export interface SystemLogApiPostApiV1SystemLogLoginGetListRequest {
    readonly sysLogLoginGetListReq: SysLogLoginGetListReq
}

/**
 * Request parameters for postApiV1SystemLogOperGetList operation in SystemLogApi.
 */
export interface SystemLogApiPostApiV1SystemLogOperGetListRequest {
    readonly sysLogOperGetListReq: SysLogOperGetListReq
}
