import type { ImMarkReadReq } from '../models';
import type { ImMessageGetListReq } from '../models';
import type { ImMessageSearchReq } from '../models';
import type { ImMessageSyncReq } from '../models';
import type { ImRecalcUnreadReq } from '../models';
import type { ImRecallReq } from '../models';
import type { ImSendMessageReq } from '../models';
import type { PostApiV1ImChatlogGetList200Response } from '../models';
import type { PostApiV1ImChatlogMarkRead200Response } from '../models';
import type { PostApiV1ImChatlogRecalcUnread200Response } from '../models';
import type { PostApiV1ImChatlogSync200Response } from '../models';
import type { PostApiV1ImMessageSend200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ImChatlogApi - axios parameter creator
 */

/**
* 业务说明：分页查询会话内的历史消息，按序号倒序返回。
* @summary 获取消息列表
* @param {ImMessageGetListReq} imMessageGetListReq  ImMessageGetListReq 消息列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChatlogGetList (
imMessageGetListReq: ImMessageGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/chatlog/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogGetList200Response>>(localVarPath, imMessageGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：标记会话消息已读，同步更新会话未读数并向相关用户推送已读状态。
* @summary 标记已读
* @param {ImMarkReadReq} imMarkReadReq  ImMarkReadReq 标记已读请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChatlogMarkRead (
imMarkReadReq: ImMarkReadReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/chatlog/mark-read`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imMarkReadReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按已读游标重算当前用户在会话内的未读数并持久化，用于修复撤回不回扣等造成的未读漂移。已撤回与系统消息不计入未读。
* @summary 未读数对账
* @param {ImRecalcUnreadReq} imRecalcUnreadReq  ImRecalcUnreadReq 未读数对账请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChatlogRecalcUnread (
imRecalcUnreadReq: ImRecalcUnreadReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/chatlog/recalc-unread`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogRecalcUnread200Response>>(localVarPath, imRecalcUnreadReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按关键词搜索当前用户可见的聊天记录，可限定单个会话。
* @summary 搜索聊天记录
* @param {ImMessageSearchReq} imMessageSearchReq  ImMessageSearchReq 搜索聊天记录请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChatlogSearch (
imMessageSearchReq: ImMessageSearchReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/chatlog/search`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogGetList200Response>>(localVarPath, imMessageSearchReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：客户端以本地最大消息序号为游标，增量拉取会话内其后的消息，用于断线重连补齐与后台对账。只读语义，不触发已读、不清未读。
* @summary 增量同步消息
* @param {ImMessageSyncReq} imMessageSyncReq  ImMessageSyncReq 增量同步消息请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChatlogSync (
imMessageSyncReq: ImMessageSyncReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/chatlog/sync`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogSync200Response>>(localVarPath, imMessageSyncReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：撤回本人在会话中已发送的消息。
* @summary 撤回消息
* @param {ImRecallReq} imRecallReq  ImRecallReq 撤回消息请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMessageRecall (
imRecallReq: ImRecallReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/message/recall`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imRecallReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：向会话发送消息，支持文本、图片等消息类型，clientMsgId 用于客户端幂等去重。单聊会话先按好友关系放行，非好友回退共享项目校验。
* @summary 发送消息
* @param {ImSendMessageReq} imSendMessageReq  ImSendMessageReq 发送消息请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMessageSend (
imSendMessageReq: ImSendMessageReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/message/send`;
    return requestClient.post<ExtractDataType<PostApiV1ImMessageSend200Response>>(localVarPath, imSendMessageReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ImChatlogGetList operation in ImChatlogApi.
 */
export interface ImChatlogApiPostApiV1ImChatlogGetListRequest {
    /**
     *  ImMessageGetListReq 消息列表请求
     */
    readonly imMessageGetListReq: ImMessageGetListReq
}

/**
 * Request parameters for postApiV1ImChatlogMarkRead operation in ImChatlogApi.
 */
export interface ImChatlogApiPostApiV1ImChatlogMarkReadRequest {
    /**
     *  ImMarkReadReq 标记已读请求
     */
    readonly imMarkReadReq: ImMarkReadReq
}

/**
 * Request parameters for postApiV1ImChatlogRecalcUnread operation in ImChatlogApi.
 */
export interface ImChatlogApiPostApiV1ImChatlogRecalcUnreadRequest {
    /**
     *  ImRecalcUnreadReq 未读数对账请求
     */
    readonly imRecalcUnreadReq: ImRecalcUnreadReq
}

/**
 * Request parameters for postApiV1ImChatlogSearch operation in ImChatlogApi.
 */
export interface ImChatlogApiPostApiV1ImChatlogSearchRequest {
    /**
     *  ImMessageSearchReq 搜索聊天记录请求
     */
    readonly imMessageSearchReq: ImMessageSearchReq
}

/**
 * Request parameters for postApiV1ImChatlogSync operation in ImChatlogApi.
 */
export interface ImChatlogApiPostApiV1ImChatlogSyncRequest {
    /**
     *  ImMessageSyncReq 增量同步消息请求
     */
    readonly imMessageSyncReq: ImMessageSyncReq
}

/**
 * Request parameters for postApiV1ImMessageRecall operation in ImChatlogApi.
 */
export interface ImChatlogApiPostApiV1ImMessageRecallRequest {
    /**
     *  ImRecallReq 撤回消息请求
     */
    readonly imRecallReq: ImRecallReq
}

/**
 * Request parameters for postApiV1ImMessageSend operation in ImChatlogApi.
 */
export interface ImChatlogApiPostApiV1ImMessageSendRequest {
    /**
     *  ImSendMessageReq 发送消息请求
     */
    readonly imSendMessageReq: ImSendMessageReq
}
