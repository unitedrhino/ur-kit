import type { DeviceInteractActionRespReq } from '../models';
import type { DeviceInteractBatchSendPropertyReq } from '../models';
import type { DeviceInteractEventSendReq } from '../models';
import type { DeviceInteractPropertyGetReportBatchSendReq } from '../models';
import type { DeviceInteractPropertyGetReportSendReq } from '../models';
import type { DeviceInteractRespGetOneReq } from '../models';
import type { DeviceInteractSchemaMockGenReq } from '../models';
import type { DeviceInteractSendActionReq } from '../models';
import type { DeviceInteractSendMsgReq } from '../models';
import type { DeviceInteractSendPropertyReq } from '../models';
import type { GatewayGetFoundReq } from '../models';
import type { GatewayNotifyBindSendReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsAlarmConditionTemplateDelete200Response } from '../models';
import type { PostApiV1ThingsDeviceInteractActionGetOne200Response } from '../models';
import type { PostApiV1ThingsDeviceInteractPropertyControlBatchSend200Response } from '../models';
import type { PostApiV1ThingsDeviceInteractPropertyControlGetOne200Response } from '../models';
import type { PostApiV1ThingsDeviceInteractPropertyGetReportBatchSend200Response } from '../models';
import type { PostApiV1ThingsDeviceInteractPropertyGetReportSend200Response } from '../models';
import type { PostApiV1ThingsDeviceInteractSchemaMockGen200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceInteractApi - axios parameter creator
 */

/**
* 查询异步行为调用的执行结果。通过msgToken（调用ID）查询设备是否已响应、返回的输出参数、执行状态码等。用于异步调用场景的结果追踪。
* @summary 获取调用设备行为的结果
* @param {DeviceInteractRespGetOneReq} deviceInteractRespGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractActionGetOne (
deviceInteractRespGetOneReq: DeviceInteractRespGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/action-get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInteractActionGetOne200Response>>(localVarPath, deviceInteractRespGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 设备发起行为调用（上行行为）时，云端通过此接口回复执行结果。用于云端处理设备请求后返回响应，如设备请求云端执行某操作，云端完成后告知结果。
* @summary 回复设备行为调用结果
* @param {DeviceInteractActionRespReq} deviceInteractActionRespReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractActionResp (
deviceInteractActionRespReq: DeviceInteractActionRespReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/action-resp`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInteractActionRespReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 向设备下发行为调用指令。行为是物模型中定义的可执行操作（如重启、复位、配置更新等）。支持同步调用（等待设备返回结果）和异步调用（通过msgToken查询结果）。设备执行后返回输出参数。
* @summary 调用设备行为
* @param {DeviceInteractSendActionReq} deviceInteractSendActionReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractActionSend (
deviceInteractSendActionReq: DeviceInteractSendActionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/action-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInteractActionGetOne200Response>>(localVarPath, deviceInteractSendActionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 向设备下发事件通知。云端主动向设备发送事件消息，用于通知设备执行某些操作或告警。事件类型包括info（信息）、alert（告警）、fault（故障）。
* @summary 下行事件通知设备
* @param {DeviceInteractEventSendReq} deviceInteractEventSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractEventSend (
deviceInteractEventSendReq: DeviceInteractEventSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/event-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInteractEventSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 请求网关设备上报当前的子设备拓扑关系。网关收到请求后，上报已绑定的子设备列表。用于查询网关与子设备的连接状态、发现拓扑变化。
* @summary 请求网关上报拓扑关系
* @param {GatewayGetFoundReq} gatewayGetFoundReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractGatewayGetFoundSend (
gatewayGetFoundReq: GatewayGetFoundReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/gateway-get-found-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, gatewayGetFoundReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 通知网关设备绑定指定的子设备列表。网关收到通知后，与子设备建立拓扑关系，子设备可通过网关与云端通信。用于网关添加子设备的场景。
* @summary 通知网关绑定子设备
* @param {GatewayNotifyBindSendReq} gatewayNotifyBindSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractGatewayNotifyBindSend (
gatewayNotifyBindSendReq: GatewayNotifyBindSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/gateway-notify-bind-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, gatewayNotifyBindSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 通过平台标准设备下行通道发送原始文本载荷。仅组织管理员和平台管理员可操作；接口成功仅表示消息已交给设备通信链路。
* @summary 下行透传消息给设备
* @param {DeviceInteractSendMsgReq} deviceInteractSendMsgReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractMessageSend (
deviceInteractSendMsgReq: DeviceInteractSendMsgReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/message-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmConditionTemplateDelete200Response>>(localVarPath, deviceInteractSendMsgReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量向多个设备下发相同的属性控制指令。支持按区域、分组、设备列表批量控制。适用于批量开关灯、批量调温等场景。返回每个设备的执行结果。
* @summary 批量调用设备属性
* @param {DeviceInteractBatchSendPropertyReq} deviceInteractBatchSendPropertyReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractPropertyControlBatchSend (
deviceInteractBatchSendPropertyReq: DeviceInteractBatchSendPropertyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/property-control-batch-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInteractPropertyControlBatchSend200Response>>(localVarPath, deviceInteractBatchSendPropertyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询异步属性控制调用的执行结果。通过msgToken查询设备是否已响应、返回的状态码、消息等。用于异步控制场景的结果追踪。
* @summary 获取调用设备属性的结果
* @param {DeviceInteractRespGetOneReq} deviceInteractRespGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractPropertyControlGetOne (
deviceInteractRespGetOneReq: DeviceInteractRespGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/property-control-get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInteractPropertyControlGetOne200Response>>(localVarPath, deviceInteractRespGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 向设备下发属性控制指令，修改设备的属性值。属性控制是物模型中最常用的交互方式，如开关设备、设置温度、调节亮度等。支持同步/异步模式，支持设备影子机制（离线时写影子，在线时下发）。
* @summary 调用设备属性
* @param {DeviceInteractSendPropertyReq} deviceInteractSendPropertyReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractPropertyControlSend (
deviceInteractSendPropertyReq: DeviceInteractSendPropertyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/property-control-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInteractPropertyControlGetOne200Response>>(localVarPath, deviceInteractSendPropertyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量向多个设备下发获取属性请求。支持按区域、分组、设备列表批量请求。适用于需要刷新多个设备实时状态的场景，如大屏展示前获取最新数据。
* @summary 批量请求设备获取设备最新属性
* @param {DeviceInteractPropertyGetReportBatchSendReq} deviceInteractPropertyGetReportBatchSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractPropertyGetReportBatchSend (
deviceInteractPropertyGetReportBatchSendReq: DeviceInteractPropertyGetReportBatchSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/property-get-report-batch-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInteractPropertyGetReportBatchSend200Response>>(localVarPath, deviceInteractPropertyGetReportBatchSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 向设备下发获取属性请求，要求设备上报最新的属性值。设备收到请求后，主动上报当前属性状态。用于需要获取设备实时状态但设备未自动上报的场景。
* @summary 请求设备获取设备最新属性
* @param {DeviceInteractPropertyGetReportSendReq} deviceInteractPropertyGetReportSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractPropertyGetReportSend (
deviceInteractPropertyGetReportSendReq: DeviceInteractPropertyGetReportSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/property-get-report-send`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInteractPropertyGetReportSend200Response>>(localVarPath, deviceInteractPropertyGetReportSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据设备的物模型定义，生成符合数据类型的模拟数据。用于设备调试、测试场景，无需真实设备即可模拟上报数据。支持生成属性、事件、行为的模拟参数。
* @summary 生成物模型模拟数据
* @param {DeviceInteractSchemaMockGenReq} deviceInteractSchemaMockGenReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInteractSchemaMockGen (
deviceInteractSchemaMockGenReq: DeviceInteractSchemaMockGenReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/interact/schema-mock-gen`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInteractSchemaMockGen200Response>>(localVarPath, deviceInteractSchemaMockGenReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceInteractActionGetOne operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractActionGetOneRequest {
    readonly deviceInteractRespGetOneReq: DeviceInteractRespGetOneReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractActionResp operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractActionRespRequest {
    readonly deviceInteractActionRespReq: DeviceInteractActionRespReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractActionSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractActionSendRequest {
    readonly deviceInteractSendActionReq: DeviceInteractSendActionReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractEventSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractEventSendRequest {
    readonly deviceInteractEventSendReq: DeviceInteractEventSendReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractGatewayGetFoundSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractGatewayGetFoundSendRequest {
    readonly gatewayGetFoundReq: GatewayGetFoundReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractGatewayNotifyBindSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractGatewayNotifyBindSendRequest {
    readonly gatewayNotifyBindSendReq: GatewayNotifyBindSendReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractMessageSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractMessageSendRequest {
    readonly deviceInteractSendMsgReq: DeviceInteractSendMsgReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractPropertyControlBatchSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractPropertyControlBatchSendRequest {
    readonly deviceInteractBatchSendPropertyReq: DeviceInteractBatchSendPropertyReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractPropertyControlGetOne operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractPropertyControlGetOneRequest {
    readonly deviceInteractRespGetOneReq: DeviceInteractRespGetOneReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractPropertyControlSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractPropertyControlSendRequest {
    readonly deviceInteractSendPropertyReq: DeviceInteractSendPropertyReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractPropertyGetReportBatchSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractPropertyGetReportBatchSendRequest {
    readonly deviceInteractPropertyGetReportBatchSendReq: DeviceInteractPropertyGetReportBatchSendReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractPropertyGetReportSend operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractPropertyGetReportSendRequest {
    readonly deviceInteractPropertyGetReportSendReq: DeviceInteractPropertyGetReportSendReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInteractSchemaMockGen operation in ThingsDeviceInteractApi.
 */
export interface ThingsDeviceInteractApiPostApiV1ThingsDeviceInteractSchemaMockGenRequest {
    readonly deviceInteractSchemaMockGenReq: DeviceInteractSchemaMockGenReq
}
