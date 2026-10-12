import type { PostApiV1ThingsRuleSceneLogGetList200Response } from '../models';
import type { SceneLogGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsSceneLogApi - axios parameter creator
 */

/**
* 查询场景执行日志，包括触发时间、触发类型（设备触发/定时触发/手动触发）、执行动作、执行状态（成功/失败）、错误信息等。用于场景执行监控和问题排查。
* @summary 获取场景日志列表
* @param {SceneLogGetListReq} sceneLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSceneLogGetList (
sceneLogGetListReq: SceneLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/scene/log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsRuleSceneLogGetList200Response>>(localVarPath, sceneLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsSceneLogGetList operation in ThingsSceneLogApi.
 */
export interface ThingsSceneLogApiPostApiV1ThingsSceneLogGetListRequest {
    readonly sceneLogGetListReq: SceneLogGetListReq
}
