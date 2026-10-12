import type { PostApiV1LowcodeRuleChainDetailGetOne200Response } from '../models';
import type { PostApiV1LowcodeRuleChainDetailUpdate200Response } from '../models';
import type { RuleChainDetail } from '../models';
import type { WithStrID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeRuleChainDetailApi - axios parameter creator
 */

/**
* 业务说明：获取规则链详情
* @summary 获取规则链详情
* @param {WithStrID} withStrID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainDetailGetOne (
withStrID: WithStrID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/detail/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailGetOne200Response>>(localVarPath, withStrID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新规则链详情
* @summary 更新规则链详情
* @param {RuleChainDetail} ruleChainDetail
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainDetailUpdate (
ruleChainDetail: RuleChainDetail,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/detail/update`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, ruleChainDetail, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeRuleChainDetailGetOne operation in LowcodeRuleChainDetailApi.
 */
export interface LowcodeRuleChainDetailApiPostApiV1LowcodeRuleChainDetailGetOneRequest {
    readonly withStrID: WithStrID
}

/**
 * Request parameters for postApiV1LowcodeRuleChainDetailUpdate operation in LowcodeRuleChainDetailApi.
 */
export interface LowcodeRuleChainDetailApiPostApiV1LowcodeRuleChainDetailUpdateRequest {
    readonly ruleChainDetail: RuleChainDetail
}
