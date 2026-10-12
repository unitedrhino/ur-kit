import type { PostApiV1LowcodeRuleChainDetailUpdate200Response } from '../models';
import type { PostApiV1LowcodeRuleChainGroupCreate200Response } from '../models';
import type { PostApiV1LowcodeRuleChainGroupGetList200Response } from '../models';
import type { PostApiV1LowcodeRuleChainGroupGetOne200Response } from '../models';
import type { RuleChainGroup } from '../models';
import type { RuleChainGroupGetListReq } from '../models';
import type { RuleChainGroupGetOneReq } from '../models';
import type { WithIDStr } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeRuleChainGroupApi - axios parameter creator
 */

/**
* 业务说明：添加规则链分组
* @summary 添加规则链分组
* @param {RuleChainGroup} ruleChainGroup  RuleChainGroup 定义规则链
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainGroupCreate (
ruleChainGroup: RuleChainGroup,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/group/create`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainGroupCreate200Response>>(localVarPath, ruleChainGroup, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除规则链分组
* @summary 删除规则链分组
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainGroupDelete (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/group/delete`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取规则链分组列表
* @summary 获取规则链分组列表
* @param {RuleChainGroupGetListReq} ruleChainGroupGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainGroupGetList (
ruleChainGroupGetListReq: RuleChainGroupGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/group/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainGroupGetList200Response>>(localVarPath, ruleChainGroupGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取规则链分组信息
* @summary 获取规则链分组信息
* @param {RuleChainGroupGetOneReq} ruleChainGroupGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainGroupGetOne (
ruleChainGroupGetOneReq: RuleChainGroupGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/group/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainGroupGetOne200Response>>(localVarPath, ruleChainGroupGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新规则链分组
* @summary 更新规则链分组
* @param {RuleChainGroup} ruleChainGroup  RuleChainGroup 定义规则链
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainGroupUpdate (
ruleChainGroup: RuleChainGroup,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/group/update`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, ruleChainGroup, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeRuleChainGroupCreate operation in LowcodeRuleChainGroupApi.
 */
export interface LowcodeRuleChainGroupApiPostApiV1LowcodeRuleChainGroupCreateRequest {
    /**
     *  RuleChainGroup 定义规则链
     */
    readonly ruleChainGroup: RuleChainGroup
}

/**
 * Request parameters for postApiV1LowcodeRuleChainGroupDelete operation in LowcodeRuleChainGroupApi.
 */
export interface LowcodeRuleChainGroupApiPostApiV1LowcodeRuleChainGroupDeleteRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1LowcodeRuleChainGroupGetList operation in LowcodeRuleChainGroupApi.
 */
export interface LowcodeRuleChainGroupApiPostApiV1LowcodeRuleChainGroupGetListRequest {
    readonly ruleChainGroupGetListReq: RuleChainGroupGetListReq
}

/**
 * Request parameters for postApiV1LowcodeRuleChainGroupGetOne operation in LowcodeRuleChainGroupApi.
 */
export interface LowcodeRuleChainGroupApiPostApiV1LowcodeRuleChainGroupGetOneRequest {
    readonly ruleChainGroupGetOneReq: RuleChainGroupGetOneReq
}

/**
 * Request parameters for postApiV1LowcodeRuleChainGroupUpdate operation in LowcodeRuleChainGroupApi.
 */
export interface LowcodeRuleChainGroupApiPostApiV1LowcodeRuleChainGroupUpdateRequest {
    /**
     *  RuleChainGroup 定义规则链
     */
    readonly ruleChainGroup: RuleChainGroup
}
