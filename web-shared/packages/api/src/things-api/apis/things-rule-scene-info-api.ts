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
 * ThingsRuleSceneInfoApi - axios parameter creator
 */

/**
* 业务说明：创建场景联动规则（已弃用，请使用新版规则引擎接口）。场景联动用于定义设备状态变化触发执行动作的自动化规则，如温度传感器超过阈值触发空调开启。包含触发条件（设备属性、定时、外部事件）和执行动作（设备控制、消息通知、场景触发）。创建后可手动触发或自动执行。
* @summary 新增场景(弃用)
* @param {SceneInfo} sceneInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsRuleSceneInfoCreate (
sceneInfo: SceneInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/rule/scene/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, sceneInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除场景联动规则（已弃用）。删除后规则不再执行，历史执行日志保留。适用于：清理废弃规则、简化自动化配置。注意：删除操作不可恢复，需确认无依赖场景后再删除。
* @summary 删除场景(弃用)
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsRuleSceneInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/rule/scene/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询场景联动规则列表（已弃用）。返回规则基本信息（名称、触发类型、执行状态、创建时间等），支持分页查询。用于管理界面展示自动化规则清单、规则执行状态监控。
* @summary 获取场景信息列表(弃用)
* @param {SceneInfoGetListReq} sceneInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsRuleSceneInfoGetList (
sceneInfoGetListReq: SceneInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/rule/scene/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsRuleSceneInfoGetList200Response>>(localVarPath, sceneInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取单个场景联动规则的完整配置（已弃用）。包括触发条件定义（设备属性条件、定时触发、外部事件触发）、执行动作列表（设备控制动作、消息通知动作、联动触发动作）、规则执行状态等。用于规则详情查看、复制规则配置、规则调试分析。
* @summary 获取场景信息详情(弃用)
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsRuleSceneInfoGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/rule/scene/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsRuleSceneInfoGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：人工触发场景联动规则执行（已弃用）。不等待触发条件满足，立即执行场景定义的所有动作。适用于：测试规则执行效果、紧急情况下手动执行自动化逻辑、临时触发批量设备操作。触发后场景执行日志会记录为手动触发类型。
* @summary 手动触发场景(弃用)
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsRuleSceneInfoManuallyTrigger (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/rule/scene/info/manually-trigger`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改场景联动规则配置（已弃用）。可调整触发条件、执行动作、规则名称、描述等。注意：更新后正在执行的场景不受影响，新触发按更新后规则执行。适用于：调整自动化逻辑、优化触发阈值、增加执行动作。
* @summary 更新场景(弃用)
* @param {SceneInfo} sceneInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsRuleSceneInfoUpdate (
sceneInfo: SceneInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/rule/scene/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, sceneInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsRuleSceneInfoCreate operation in ThingsRuleSceneInfoApi.
 */
export interface ThingsRuleSceneInfoApiPostApiV1ThingsRuleSceneInfoCreateRequest {
    readonly sceneInfo: SceneInfo
}

/**
 * Request parameters for postApiV1ThingsRuleSceneInfoDelete operation in ThingsRuleSceneInfoApi.
 */
export interface ThingsRuleSceneInfoApiPostApiV1ThingsRuleSceneInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsRuleSceneInfoGetList operation in ThingsRuleSceneInfoApi.
 */
export interface ThingsRuleSceneInfoApiPostApiV1ThingsRuleSceneInfoGetListRequest {
    readonly sceneInfoGetListReq: SceneInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsRuleSceneInfoGetOne operation in ThingsRuleSceneInfoApi.
 */
export interface ThingsRuleSceneInfoApiPostApiV1ThingsRuleSceneInfoGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsRuleSceneInfoManuallyTrigger operation in ThingsRuleSceneInfoApi.
 */
export interface ThingsRuleSceneInfoApiPostApiV1ThingsRuleSceneInfoManuallyTriggerRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsRuleSceneInfoUpdate operation in ThingsRuleSceneInfoApi.
 */
export interface ThingsRuleSceneInfoApiPostApiV1ThingsRuleSceneInfoUpdateRequest {
    readonly sceneInfo: SceneInfo
}
