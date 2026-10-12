import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsRuleSceneInfoGetList200Response } from '../models';
import type { PostApiV1ThingsRuleSceneInfoGetOne200Response } from '../models';
import type { SceneInfo } from '../models';
import type { SceneInfoGetListReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsSceneInfoApi - axios parameter creator
 */

/**
* 创建场景联动规则，定义触发条件（if）、触发时机（when）和执行动作（then）。场景用于实现设备自动化控制逻辑，如温度超阈值自动开启空调。支持绑定区域和设置标签。
* @summary 新增场景
* @param {SceneInfo} sceneInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSceneInfoCreate (
sceneInfo: SceneInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/scene/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, sceneInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除场景规则，删除后不再响应触发事件。正在执行的场景会完成当前执行周期后停止。场景日志记录保留不受影响。
* @summary 删除场景
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSceneInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/scene/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询场景列表，支持按名称、标签、区域、触发类型、状态等过滤。可按设备模式过滤触发或执行相关场景。返回场景基本信息，isOnlyCore=true时不返回详细规则。
* @summary 获取场景信息列表
* @param {SceneInfoGetListReq} sceneInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSceneInfoGetList (
sceneInfoGetListReq: SceneInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/scene/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsRuleSceneInfoGetList200Response>>(localVarPath, sceneInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询单个场景的完整定义，包括if触发条件、when触发时机、then执行动作的详细配置。用于场景编辑或查看完整规则逻辑。
* @summary 获取场景信息详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSceneInfoGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/scene/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsRuleSceneInfoGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 手动触发场景立即执行，无视触发条件直接执行then动作。用于测试场景执行效果或紧急情况下的手动控制。触发类型记录为manual。
* @summary 手动触发场景
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSceneInfoManuallyTrigger (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/scene/info/manually-trigger`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改场景的触发条件、执行动作或基本信息。场景修改后立即生效，正在执行的场景不受影响。异常状态（status=3）的场景修复后需手动重置状态。
* @summary 更新场景
* @param {SceneInfo} sceneInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsSceneInfoUpdate (
sceneInfo: SceneInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/scene/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, sceneInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsSceneInfoCreate operation in ThingsSceneInfoApi.
 */
export interface ThingsSceneInfoApiPostApiV1ThingsSceneInfoCreateRequest {
    readonly sceneInfo: SceneInfo
}

/**
 * Request parameters for postApiV1ThingsSceneInfoDelete operation in ThingsSceneInfoApi.
 */
export interface ThingsSceneInfoApiPostApiV1ThingsSceneInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsSceneInfoGetList operation in ThingsSceneInfoApi.
 */
export interface ThingsSceneInfoApiPostApiV1ThingsSceneInfoGetListRequest {
    readonly sceneInfoGetListReq: SceneInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsSceneInfoGetOne operation in ThingsSceneInfoApi.
 */
export interface ThingsSceneInfoApiPostApiV1ThingsSceneInfoGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsSceneInfoManuallyTrigger operation in ThingsSceneInfoApi.
 */
export interface ThingsSceneInfoApiPostApiV1ThingsSceneInfoManuallyTriggerRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsSceneInfoUpdate operation in ThingsSceneInfoApi.
 */
export interface ThingsSceneInfoApiPostApiV1ThingsSceneInfoUpdateRequest {
    readonly sceneInfo: SceneInfo
}
