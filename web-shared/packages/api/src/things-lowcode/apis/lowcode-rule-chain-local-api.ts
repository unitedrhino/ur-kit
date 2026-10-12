import type { PostApiV1LowcodeRuleChainLocalGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeRuleChainLocalApi - axios parameter creator
 */

/**
* 业务说明：本地配置
* @summary 本地配置
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainLocalGetOne (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/local/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainLocalGetOne200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeRuleChainLocalGetOne operation in LowcodeRuleChainLocalApi.
 */
export interface LowcodeRuleChainLocalApiPostApiV1LowcodeRuleChainLocalGetOneRequest {
    readonly body: object
}
