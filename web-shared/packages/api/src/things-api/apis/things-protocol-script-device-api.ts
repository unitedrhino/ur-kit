import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProjectCrudCreate200Response } from '../models';
import type { PostApiV1ThingsProtocolScriptDeviceGetList200Response } from '../models';
import type { PostApiV1ThingsProtocolScriptDeviceGetOne200Response } from '../models';
import type { ProtocolScriptDevice } from '../models';
import type { ProtocolScriptDeviceGetListReq } from '../models';
import type { WithIDStr } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProtocolScriptDeviceApi - axios parameter creator
 */

/**
* 为产品或设备绑定协议脚本，设置触发源（产品级/设备级）、脚本ID和执行优先级。设备消息按优先级顺序执行绑定的脚本。
* @summary 新增协议脚本设备
* @param {ProtocolScriptDevice} protocolScriptDevice
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptDeviceCreate (
protocolScriptDevice: ProtocolScriptDevice,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/device/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectCrudCreate200Response>>(localVarPath, protocolScriptDevice, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 解除设备与脚本的绑定关系。删除后该设备不再执行此脚本，其他绑定的脚本不受影响。
* @summary 删除协议脚本设备
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptDeviceDelete (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/device/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询脚本与设备的绑定关系列表，支持按触发源、产品ID、设备名、脚本ID过滤。withScript/withDevice参数可同时返回脚本/设备详情。
* @summary 获取协议脚本设备列表
* @param {ProtocolScriptDeviceGetListReq} protocolScriptDeviceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptDeviceGetList (
protocolScriptDeviceGetListReq: ProtocolScriptDeviceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/device/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolScriptDeviceGetList200Response>>(localVarPath, protocolScriptDeviceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询单个脚本设备绑定记录的完整信息，包括绑定配置和关联的脚本、设备信息。
* @summary 获取协议脚本设备详情
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptDeviceGetOne (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/device/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolScriptDeviceGetOne200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改设备与脚本的绑定关系，可更新脚本ID、优先级、启用状态等。同一设备可绑定多个脚本，优先级决定执行顺序。
* @summary 更新协议脚本设备
* @param {ProtocolScriptDevice} protocolScriptDevice
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptDeviceUpdate (
protocolScriptDevice: ProtocolScriptDevice,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/device/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, protocolScriptDevice, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProtocolScriptDeviceCreate operation in ThingsProtocolScriptDeviceApi.
 */
export interface ThingsProtocolScriptDeviceApiPostApiV1ThingsProtocolScriptDeviceCreateRequest {
    readonly protocolScriptDevice: ProtocolScriptDevice
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptDeviceDelete operation in ThingsProtocolScriptDeviceApi.
 */
export interface ThingsProtocolScriptDeviceApiPostApiV1ThingsProtocolScriptDeviceDeleteRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptDeviceGetList operation in ThingsProtocolScriptDeviceApi.
 */
export interface ThingsProtocolScriptDeviceApiPostApiV1ThingsProtocolScriptDeviceGetListRequest {
    readonly protocolScriptDeviceGetListReq: ProtocolScriptDeviceGetListReq
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptDeviceGetOne operation in ThingsProtocolScriptDeviceApi.
 */
export interface ThingsProtocolScriptDeviceApiPostApiV1ThingsProtocolScriptDeviceGetOneRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptDeviceUpdate operation in ThingsProtocolScriptDeviceApi.
 */
export interface ThingsProtocolScriptDeviceApiPostApiV1ThingsProtocolScriptDeviceUpdateRequest {
    readonly protocolScriptDevice: ProtocolScriptDevice
}
