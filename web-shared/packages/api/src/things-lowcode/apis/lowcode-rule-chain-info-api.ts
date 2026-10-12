import type { PostApiV1LowcodeRuleChainDetailUpdate200Response } from '../models';
import type { PostApiV1LowcodeRuleChainInfoCreate200Response } from '../models';
import type { PostApiV1LowcodeRuleChainInfoGetList200Response } from '../models';
import type { PostApiV1LowcodeRuleChainInfoGetOne200Response } from '../models';
import type { RuleChainInfo } from '../models';
import type { RuleChainInfoGetListReq } from '../models';
import type { RuleChainInfoGetOneReq } from '../models';
import type { WithStrID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeRuleChainInfoApi - axios parameter creator
 */

/**
* 业务说明：添加规则链
* @summary 添加规则链
* @param {RuleChainInfo} ruleChainInfo  RuleChainInfo 定义规则链
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainInfoCreate (
ruleChainInfo: RuleChainInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainInfoCreate200Response>>(localVarPath, ruleChainInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除规则链
* @summary 删除规则链
* @param {WithStrID} withStrID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainInfoDelete (
withStrID: WithStrID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, withStrID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取规则链列表
* @summary 获取规则链列表
* @param {RuleChainInfoGetListReq} ruleChainInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainInfoGetList (
ruleChainInfoGetListReq: RuleChainInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainInfoGetList200Response>>(localVarPath, ruleChainInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取规则链信息
* @summary 获取规则链信息
* @param {RuleChainInfoGetOneReq} ruleChainInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainInfoGetOne (
ruleChainInfoGetOneReq: RuleChainInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainInfoGetOne200Response>>(localVarPath, ruleChainInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新规则链
* @summary 更新规则链
* @param {RuleChainInfo} ruleChainInfo  RuleChainInfo 定义规则链
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeRuleChainInfoUpdate (
ruleChainInfo: RuleChainInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/rule/chain/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, ruleChainInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeRuleChainInfoCreate operation in LowcodeRuleChainInfoApi.
 */
export interface LowcodeRuleChainInfoApiPostApiV1LowcodeRuleChainInfoCreateRequest {
    /**
     *  RuleChainInfo 定义规则链
     */
    readonly ruleChainInfo: RuleChainInfo
}

/**
 * Request parameters for postApiV1LowcodeRuleChainInfoDelete operation in LowcodeRuleChainInfoApi.
 */
export interface LowcodeRuleChainInfoApiPostApiV1LowcodeRuleChainInfoDeleteRequest {
    readonly withStrID: WithStrID
}

/**
 * Request parameters for postApiV1LowcodeRuleChainInfoGetList operation in LowcodeRuleChainInfoApi.
 */
export interface LowcodeRuleChainInfoApiPostApiV1LowcodeRuleChainInfoGetListRequest {
    readonly ruleChainInfoGetListReq: RuleChainInfoGetListReq
}

/**
 * Request parameters for postApiV1LowcodeRuleChainInfoGetOne operation in LowcodeRuleChainInfoApi.
 */
export interface LowcodeRuleChainInfoApiPostApiV1LowcodeRuleChainInfoGetOneRequest {
    readonly ruleChainInfoGetOneReq: RuleChainInfoGetOneReq
}

/**
 * Request parameters for postApiV1LowcodeRuleChainInfoUpdate operation in LowcodeRuleChainInfoApi.
 */
export interface LowcodeRuleChainInfoApiPostApiV1LowcodeRuleChainInfoUpdateRequest {
    /**
     *  RuleChainInfo 定义规则链
     */
    readonly ruleChainInfo: RuleChainInfo
}
