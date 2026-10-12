import type { AppInfoGetOneReq } from '../models';
import type { PostApiV1SystemAppCoreGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemAppCoreApi - axios parameter creator
 */

/**
* 业务说明：公开接口，用于登录页面或公开页面获取应用基本信息（如Logo、名称）。无需认证，任何人可调用，主要用于前端登录页展示应用标识。
* @summary 无需登录获取应用信息
* @param {AppInfoGetOneReq} appInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppCoreGetOne (
appInfoGetOneReq: AppInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/core/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppCoreGetOne200Response>>(localVarPath, appInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemAppCoreGetOne operation in SystemAppCoreApi.
 */
export interface SystemAppCoreApiPostApiV1SystemAppCoreGetOneRequest {
    readonly appInfoGetOneReq: AppInfoGetOneReq
}
