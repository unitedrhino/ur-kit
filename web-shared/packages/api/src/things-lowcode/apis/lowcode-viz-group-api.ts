import type { PostApiV1LowcodeRuleChainDetailUpdate200Response } from '../models';
import type { PostApiV1LowcodeRuleChainGroupCreate200Response } from '../models';
import type { PostApiV1LowcodeVizGroupGetList200Response } from '../models';
import type { PostApiV1LowcodeVizGroupGetOne200Response } from '../models';
import type { VizGroup } from '../models';
import type { VizGroupGetListReq } from '../models';
import type { VizGroupGetOneReq } from '../models';
import type { WithIDStr } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeVizGroupApi - axios parameter creator
 */

/**
* 业务说明：添加可视化分组
* @summary 添加可视化分组
* @param {VizGroup} vizGroup  VizGroup 定义可视化
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizGroupCreate (
vizGroup: VizGroup,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/group/create`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainGroupCreate200Response>>(localVarPath, vizGroup, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除可视化分组
* @summary 删除可视化分组
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizGroupDelete (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/group/delete`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取可视化分组列表
* @summary 获取可视化分组列表
* @param {VizGroupGetListReq} vizGroupGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizGroupGetList (
vizGroupGetListReq: VizGroupGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/group/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeVizGroupGetList200Response>>(localVarPath, vizGroupGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取可视化分组信息
* @summary 获取可视化分组信息
* @param {VizGroupGetOneReq} vizGroupGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizGroupGetOne (
vizGroupGetOneReq: VizGroupGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/group/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeVizGroupGetOne200Response>>(localVarPath, vizGroupGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新可视化分组
* @summary 更新可视化分组
* @param {VizGroup} vizGroup  VizGroup 定义可视化
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizGroupUpdate (
vizGroup: VizGroup,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/group/update`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, vizGroup, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeVizGroupCreate operation in LowcodeVizGroupApi.
 */
export interface LowcodeVizGroupApiPostApiV1LowcodeVizGroupCreateRequest {
    /**
     *  VizGroup 定义可视化
     */
    readonly vizGroup: VizGroup
}

/**
 * Request parameters for postApiV1LowcodeVizGroupDelete operation in LowcodeVizGroupApi.
 */
export interface LowcodeVizGroupApiPostApiV1LowcodeVizGroupDeleteRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1LowcodeVizGroupGetList operation in LowcodeVizGroupApi.
 */
export interface LowcodeVizGroupApiPostApiV1LowcodeVizGroupGetListRequest {
    readonly vizGroupGetListReq: VizGroupGetListReq
}

/**
 * Request parameters for postApiV1LowcodeVizGroupGetOne operation in LowcodeVizGroupApi.
 */
export interface LowcodeVizGroupApiPostApiV1LowcodeVizGroupGetOneRequest {
    readonly vizGroupGetOneReq: VizGroupGetOneReq
}

/**
 * Request parameters for postApiV1LowcodeVizGroupUpdate operation in LowcodeVizGroupApi.
 */
export interface LowcodeVizGroupApiPostApiV1LowcodeVizGroupUpdateRequest {
    /**
     *  VizGroup 定义可视化
     */
    readonly vizGroup: VizGroup
}
