import type { DeviceMsgAbnormalLogGetListReq } from '../models';
import type { DeviceMsgEventLogGetListReq } from '../models';
import type { DeviceMsgHubLogGetListReq } from '../models';
import type { DeviceMsgPropertyAggByDeviceGetListReq } from '../models';
import type { DeviceMsgPropertyLatestAggGetListReq } from '../models';
import type { DeviceMsgPropertyLatestGetListReq } from '../models';
import type { DeviceMsgPropertyLogAggGetListReq } from '../models';
import type { DeviceMsgPropertyLogBatchGetListReq } from '../models';
import type { DeviceMsgPropertyLogGetListReq } from '../models';
import type { DeviceMsgSdkLogGetListReq } from '../models';
import type { DeviceMsgSendLogGetListReq } from '../models';
import type { DeviceMsgStatusLogGetListReq } from '../models';
import type { GatewayCanBindGetListReq } from '../models';
import type { PostApiV1ThingsDeviceMsgAbnormalLogGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgEventLogGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgGatewayCanBindGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgHubLogGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgPropertyAggByDeviceGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgPropertyLatestAggGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgPropertyLatestGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgPropertyLogBatchGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgSdkLogGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgSendLogGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgShadowGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceMsgStatusLogGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceMsgApi - axios parameter creator
 */

/**
* 查询设备异常告警历史记录，包括设备触发的各类异常事件（如频繁上下线、通信超时、数据异常等）。记录异常触发时间、类型、原因、解除时间。用于设备异常监控、故障预警。
* @summary 获取设备异常日志
* @param {DeviceMsgAbnormalLogGetListReq} deviceMsgAbnormalLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgAbnormalLogGetList (
deviceMsgAbnormalLogGetListReq: DeviceMsgAbnormalLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/abnormal-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgAbnormalLogGetList200Response>>(localVarPath, deviceMsgAbnormalLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询设备上报的事件历史记录，包括信息事件（info）、告警事件（alert）、故障事件（fault）。用于事件追溯、告警分析、故障排查。
* @summary 获取事件历史记录
* @param {DeviceMsgEventLogGetListReq} deviceMsgEventLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgEventLogGetList (
deviceMsgEventLogGetListReq: DeviceMsgEventLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/event-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgEventLogGetList200Response>>(localVarPath, deviceMsgEventLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询指定网关可绑定的子设备候选列表。用于网关添加子设备的场景，返回该网关产品配置允许接入的子设备产品类型下的未绑定设备。
* @summary 获取网关可以绑定的子设备列表
* @param {GatewayCanBindGetListReq} gatewayCanBindGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgGatewayCanBindGetList (
gatewayCanBindGetListReq: GatewayCanBindGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/gateway-can-bind/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgGatewayCanBindGetList200Response>>(localVarPath, gatewayCanBindGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询设备与云端交互的通信日志，包括MQTT连接/断开、消息发布/订阅、物模型上报/下发等操作的详细记录。用于设备调试、问题排查、通信异常分析。支持按时间范围、操作类型、主题、内容等条件过滤。
* @summary 获取云端诊断日志
* @param {DeviceMsgHubLogGetListReq} deviceMsgHubLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgHubLogGetList (
deviceMsgHubLogGetListReq: DeviceMsgHubLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/hub-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgHubLogGetList200Response>>(localVarPath, deviceMsgHubLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 该接口已弃用，请使用 propertyLogAggByDeviceGetList 替代。
* @summary 弃用
* @param {DeviceMsgPropertyAggByDeviceGetListReq} deviceMsgPropertyAggByDeviceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyAggByDeviceGetList (
deviceMsgPropertyAggByDeviceGetListReq: DeviceMsgPropertyAggByDeviceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-agg/by-device/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyAggByDeviceGetList200Response>>(localVarPath, deviceMsgPropertyAggByDeviceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 该接口已弃用，请使用 propertyLogAggGetList 替代。
* @summary 弃用
* @param {DeviceMsgPropertyLogAggGetListReq} deviceMsgPropertyLogAggGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyAggGetList (
deviceMsgPropertyLogAggGetListReq: DeviceMsgPropertyLogAggGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-agg/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyAggByDeviceGetList200Response>>(localVarPath, deviceMsgPropertyLogAggGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取设备属性最新值的聚合统计结果。支持跨设备聚合（如多设备平均值），用于实时监控大屏、批量设备状态概览。
* @summary 聚合属性最新值
* @param {DeviceMsgPropertyLatestAggGetListReq} deviceMsgPropertyLatestAggGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyLatestAggGetList (
deviceMsgPropertyLatestAggGetListReq: DeviceMsgPropertyLatestAggGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-latest-agg/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyLatestAggGetList200Response>>(localVarPath, deviceMsgPropertyLatestAggGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取设备属性的最新上报值。可指定获取全部属性或指定属性标识符列表。用于实时状态展示、设备监控面板、属性快捷查询。
* @summary 获取最新属性记录
* @param {DeviceMsgPropertyLatestGetListReq} deviceMsgPropertyLatestGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyLatestGetList (
deviceMsgPropertyLatestGetListReq: DeviceMsgPropertyLatestGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-latest/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyLatestGetList200Response>>(localVarPath, deviceMsgPropertyLatestGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量查询多个设备的属性历史聚合统计结果。支持按设备维度分组聚合，适用于批量数据分析、多设备对比分析场景。
* @summary 聚合属性历史记录,设备维度
* @param {DeviceMsgPropertyAggByDeviceGetListReq} deviceMsgPropertyAggByDeviceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyLogAggByDeviceGetList (
deviceMsgPropertyAggByDeviceGetListReq: DeviceMsgPropertyAggByDeviceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-log-agg/by-device/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyAggByDeviceGetList200Response>>(localVarPath, deviceMsgPropertyAggByDeviceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询设备属性历史数据的聚合统计结果。支持按时间窗口（秒/分/时/天）聚合，可指定聚合函数（avg平均值、first首值、last末值、count计数、twa时间加权平均）。用于数据趋势分析、统计报表。
* @summary 聚合属性历史记录
* @param {DeviceMsgPropertyLogAggGetListReq} deviceMsgPropertyLogAggGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyLogAggGetList (
deviceMsgPropertyLogAggGetListReq: DeviceMsgPropertyLogAggGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-log-agg/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyAggByDeviceGetList200Response>>(localVarPath, deviceMsgPropertyLogAggGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量查询多个时间范围或多个属性标识符的历史数据。适用于需要一次性获取多组数据的场景，减少接口调用次数。
* @summary 批量获取单个id属性历史记录
* @param {DeviceMsgPropertyLogBatchGetListReq} deviceMsgPropertyLogBatchGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyLogBatchGetList (
deviceMsgPropertyLogBatchGetListReq: DeviceMsgPropertyLogBatchGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-log/batch-get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyLogBatchGetList200Response>>(localVarPath, deviceMsgPropertyLogBatchGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询设备指定属性标识符的历史上报数据。支持按时间范围、分页查询，可选择是否进行时间窗口聚合（如按小时/天聚合）。用于查看属性变化趋势、数据分析、报表生成。
* @summary 获取单个id属性历史记录
* @param {DeviceMsgPropertyLogGetListReq} deviceMsgPropertyLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyLogGetList (
deviceMsgPropertyLogGetListReq: DeviceMsgPropertyLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyLatestGetList200Response>>(localVarPath, deviceMsgPropertyLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 该接口已弃用，请使用 propertyLatestGetList 替代。
* @summary 弃用
* @param {DeviceMsgPropertyLatestGetListReq} deviceMsgPropertyLatestGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgPropertyLogLatestGetList (
deviceMsgPropertyLatestGetListReq: DeviceMsgPropertyLatestGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/property-log-latest/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgPropertyLatestGetList200Response>>(localVarPath, deviceMsgPropertyLatestGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询设备端SDK上报的日志信息，包括设备运行状态、调试信息、错误日志等。用于远程诊断设备端问题、分析设备运行状态。设备需配置日志上报级别（关闭/错误/告警/信息/调试）。
* @summary 获取设备sdk日志
* @param {DeviceMsgSdkLogGetListReq} deviceMsgSdkLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgSdkLogGetList (
deviceMsgSdkLogGetListReq: DeviceMsgSdkLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/sdk-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgSdkLogGetList200Response>>(localVarPath, deviceMsgSdkLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询向设备下发的控制命令历史记录，包括属性控制、行为调用、获取属性请求等操作。记录命令发送者、发送时间、命令内容、执行结果等。用于追溯设备操作历史、排查命令执行失败原因。
* @summary 获取设备命令日志
* @param {DeviceMsgSendLogGetListReq} deviceMsgSendLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgSendLogGetList (
deviceMsgSendLogGetListReq: DeviceMsgSendLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/send-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgSendLogGetList200Response>>(localVarPath, deviceMsgSendLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取设备影子（Device Shadow）数据。设备影子是云端存储的设备状态副本，用于设备离线时记录期望状态，设备上线后同步。支持查询属性的期望值和实际值、同步状态。
* @summary 获取设备影子列表
* @param {DeviceMsgPropertyLatestGetListReq} deviceMsgPropertyLatestGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgShadowGetList (
deviceMsgPropertyLatestGetListReq: DeviceMsgPropertyLatestGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/shadow/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgShadowGetList200Response>>(localVarPath, deviceMsgPropertyLatestGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询设备的在线/离线状态变更历史记录。记录设备每次上线、下线的时间戳和状态。用于分析设备连接稳定性、掉线原因排查。
* @summary 获取设备状态日志
* @param {DeviceMsgStatusLogGetListReq} deviceMsgStatusLogGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceMsgStatusLogGetList (
deviceMsgStatusLogGetListReq: DeviceMsgStatusLogGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/msg/status-log/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceMsgStatusLogGetList200Response>>(localVarPath, deviceMsgStatusLogGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceMsgAbnormalLogGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgAbnormalLogGetListRequest {
    readonly deviceMsgAbnormalLogGetListReq: DeviceMsgAbnormalLogGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgEventLogGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgEventLogGetListRequest {
    readonly deviceMsgEventLogGetListReq: DeviceMsgEventLogGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgGatewayCanBindGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgGatewayCanBindGetListRequest {
    readonly gatewayCanBindGetListReq: GatewayCanBindGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgHubLogGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgHubLogGetListRequest {
    readonly deviceMsgHubLogGetListReq: DeviceMsgHubLogGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyAggByDeviceGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyAggByDeviceGetListRequest {
    readonly deviceMsgPropertyAggByDeviceGetListReq: DeviceMsgPropertyAggByDeviceGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyAggGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyAggGetListRequest {
    readonly deviceMsgPropertyLogAggGetListReq: DeviceMsgPropertyLogAggGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyLatestAggGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyLatestAggGetListRequest {
    readonly deviceMsgPropertyLatestAggGetListReq: DeviceMsgPropertyLatestAggGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyLatestGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyLatestGetListRequest {
    readonly deviceMsgPropertyLatestGetListReq: DeviceMsgPropertyLatestGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyLogAggByDeviceGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyLogAggByDeviceGetListRequest {
    readonly deviceMsgPropertyAggByDeviceGetListReq: DeviceMsgPropertyAggByDeviceGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyLogAggGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyLogAggGetListRequest {
    readonly deviceMsgPropertyLogAggGetListReq: DeviceMsgPropertyLogAggGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyLogBatchGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyLogBatchGetListRequest {
    readonly deviceMsgPropertyLogBatchGetListReq: DeviceMsgPropertyLogBatchGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyLogGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyLogGetListRequest {
    readonly deviceMsgPropertyLogGetListReq: DeviceMsgPropertyLogGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgPropertyLogLatestGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgPropertyLogLatestGetListRequest {
    readonly deviceMsgPropertyLatestGetListReq: DeviceMsgPropertyLatestGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgSdkLogGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgSdkLogGetListRequest {
    readonly deviceMsgSdkLogGetListReq: DeviceMsgSdkLogGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgSendLogGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgSendLogGetListRequest {
    readonly deviceMsgSendLogGetListReq: DeviceMsgSendLogGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgShadowGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgShadowGetListRequest {
    readonly deviceMsgPropertyLatestGetListReq: DeviceMsgPropertyLatestGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceMsgStatusLogGetList operation in ThingsDeviceMsgApi.
 */
export interface ThingsDeviceMsgApiPostApiV1ThingsDeviceMsgStatusLogGetListRequest {
    readonly deviceMsgStatusLogGetListReq: DeviceMsgStatusLogGetListReq
}
