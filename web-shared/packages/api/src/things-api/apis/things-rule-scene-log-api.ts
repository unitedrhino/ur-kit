import type { PostApiV1ThingsRuleSceneLogGetList200Response } from '../models';
import type { SceneLogGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsRuleSceneLogApi - axios parameter creator
 */

/**
* 业务说明：查询场景联动规则的执行日志（已弃用）。记录每次场景触发的详情（触发时间、触发类型自动/手动、执行结果、执行动作列表及各动作执行状态）。用于自动化执行分析、规则调试、执行异常排查。支持按场景ID、时间范围过滤。
* @summary 获取场景日志列表(弃用)
* @param {SceneLogGetListReq} sceneLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsRuleSceneLogGetList (
sceneLogGetListReq: SceneLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/rule/scene/log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsRuleSceneLogGetList200Response>>(localVarPath, sceneLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsRuleSceneLogGetList operation in ThingsRuleSceneLogApi.
 */
export interface ThingsRuleSceneLogApiPostApiV1ThingsRuleSceneLogGetListRequest {
    readonly sceneLogGetListReq: SceneLogGetListReq
}
