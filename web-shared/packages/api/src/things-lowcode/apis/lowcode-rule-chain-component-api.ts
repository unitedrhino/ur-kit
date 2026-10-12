import type { PostApiV1LowcodeRuleChainComponentGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeRuleChainComponentApi - axios parameter creator
 */

/**
* 业务说明：获取规则链组件列表
* @summary 获取规则链组件列表
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainComponentGetList (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/component/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainComponentGetList200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeRuleChainComponentGetList operation in LowcodeRuleChainComponentApi.
 */
export interface LowcodeRuleChainComponentApiPostApiV1LowcodeRuleChainComponentGetListRequest {
    readonly body: object
}
