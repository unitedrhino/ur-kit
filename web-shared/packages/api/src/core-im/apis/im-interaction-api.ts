import type { ImInteractionCommandsReq } from '../models';
import type { ImInteractionEventsAckReq } from '../models';
import type { ImInteractionEventsReq } from '../models';
import type { PostApiV1ImInteractionCommands200Response } from '../models';
import type { PostApiV1ImInteractionEndpointsRegister200Response } from '../models';
import type { PostApiV1ImInteractionEvents200Response } from '../models';
import type { PostApiV1ImInteractionEventsAck200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ImInteractionApi - axios parameter creator
 */

/**
* 按当前登录用户绑定端点提交原应用信令；当前接通IPC预览打开、媒体协商、状态报告、观看端按轨订阅控制及结束。打开可显式请求单向监听音频，省略时不开麦克风；观看端仅能订阅、取消订阅、暂停或恢复自身已授权轨，不能控制摄像头发布。受理不代表设备接听或媒体连通，原结果通过持久事件接口获取。
* @summary 提交应用信令命令
* @param {ImInteractionCommandsReq} imInteractionCommandsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImInteractionCommands (
imInteractionCommandsReq: ImInteractionCommandsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/interaction/commands`;
    return requestClient.post<ExtractDataType<PostApiV1ImInteractionCommands200Response>>(localVarPath, imInteractionCommandsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 为已登录用户创建独立一小时端点；端点不替代登录鉴权，不代表设备会话或媒体已建立。
* @summary 注册应用信令端点
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImInteractionEndpointsRegister (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/interaction/endpoints/register`;
    return requestClient.post<ExtractDataType<PostApiV1ImInteractionEndpointsRegister200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按当前用户已注册端点拉取持久interaction.result/state；未确认事件可重放，不把读取当媒体连通或业务执行完成。
* @summary 拉取应用信令事件
* @param {ImInteractionEventsReq} imInteractionEventsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImInteractionEvents (
imInteractionEventsReq: ImInteractionEventsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/interaction/events`;
    return requestClient.post<ExtractDataType<PostApiV1ImInteractionEvents200Response>>(localVarPath, imInteractionEventsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 同事务确认当前登录端点已处理的事件，任一ID无权限则整体拒绝；不确认设备投递或音视频播放。
* @summary 确认应用信令事件接收
* @param {ImInteractionEventsAckReq} imInteractionEventsAckReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImInteractionEventsAck (
imInteractionEventsAckReq: ImInteractionEventsAckReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/interaction/events/ack`;
    return requestClient.post<ExtractDataType<PostApiV1ImInteractionEventsAck200Response>>(localVarPath, imInteractionEventsAckReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ImInteractionCommands operation in ImInteractionApi.
 */
export interface ImInteractionApiPostApiV1ImInteractionCommandsRequest {
    readonly imInteractionCommandsReq: ImInteractionCommandsReq
}

/**
 * Request parameters for postApiV1ImInteractionEvents operation in ImInteractionApi.
 */
export interface ImInteractionApiPostApiV1ImInteractionEventsRequest {
    readonly imInteractionEventsReq: ImInteractionEventsReq
}

/**
 * Request parameters for postApiV1ImInteractionEventsAck operation in ImInteractionApi.
 */
export interface ImInteractionApiPostApiV1ImInteractionEventsAckRequest {
    readonly imInteractionEventsAckReq: ImInteractionEventsAckReq
}
