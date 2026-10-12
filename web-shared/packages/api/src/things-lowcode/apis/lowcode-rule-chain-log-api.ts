import type { PostApiV1LowcodeRuleChainLogGetList200Response } from '../models';
import type { RuleChainLogGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeRuleChainLogApi - axios parameter creator
 */

/**
* 业务说明：调试日志
* @summary 调试日志
* @param {RuleChainLogGetListReq} ruleChainLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainLogGetList (
ruleChainLogGetListReq: RuleChainLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainLogGetList200Response>>(localVarPath, ruleChainLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeRuleChainLogGetList operation in LowcodeRuleChainLogApi.
 */
export interface LowcodeRuleChainLogApiPostApiV1LowcodeRuleChainLogGetListRequest {
    readonly ruleChainLogGetListReq: RuleChainLogGetListReq
}
