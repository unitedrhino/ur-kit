import type { PostApiV1LowcodeRuleChainOperateExecute200Response } from '../models';
import type { RuleChainExecuteReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeRuleChainOperateApi - axios parameter creator
 */

/**
* 业务说明：执行规则链
* @summary 执行规则链
* @param {RuleChainExecuteReq} ruleChainExecuteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainOperateExecute (
ruleChainExecuteReq: RuleChainExecuteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/operate/execute`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainOperateExecute200Response>>(localVarPath, ruleChainExecuteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeRuleChainOperateExecute operation in LowcodeRuleChainOperateApi.
 */
export interface LowcodeRuleChainOperateApiPostApiV1LowcodeRuleChainOperateExecuteRequest {
    readonly ruleChainExecuteReq: RuleChainExecuteReq
}
