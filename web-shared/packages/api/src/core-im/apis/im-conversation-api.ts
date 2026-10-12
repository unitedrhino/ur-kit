import type { ImConversationAddMembersReq } from '../models';
import type { ImConversationCreateAIReq } from '../models';
import type { ImConversationCreateReq } from '../models';
import type { ImConversationDisbandReq } from '../models';
import type { ImConversationGetByParticipantsReq } from '../models';
import type { ImConversationGetListReq } from '../models';
import type { ImConversationGetMembersReq } from '../models';
import type { ImConversationGetReq } from '../models';
import type { ImConversationMuteMemberReq } from '../models';
import type { ImConversationRemoveMemberReq } from '../models';
import type { ImConversationSetAdminReq } from '../models';
import type { ImConversationTransferOwnerReq } from '../models';
import type { ImConversationUpdateSettingReq } from '../models';
import type { PostApiV1ImChatlogMarkRead200Response } from '../models';
import type { PostApiV1ImConversationAddMembers200Response } from '../models';
import type { PostApiV1ImConversationCreate200Response } from '../models';
import type { PostApiV1ImConversationGet200Response } from '../models';
import type { PostApiV1ImConversationGetByParticipants200Response } from '../models';
import type { PostApiV1ImConversationGetList200Response } from '../models';
import type { PostApiV1ImConversationGetMembers200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ImConversationApi - axios parameter creator
 */

/**
* 业务说明：向已有群聊会话中邀请新成员，支持一次邀请多个参与者。
* @summary 群聊邀请成员
* @param {ImConversationAddMembersReq} imConversationAddMembersReq  ImConversationAddMembersReq 群聊邀请成员请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationAddMembers (
imConversationAddMembersReq: ImConversationAddMembersReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/add-members`;
    return requestClient.post<ExtractDataType<PostApiV1ImConversationAddMembers200Response>>(localVarPath, imConversationAddMembersReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建单聊或群聊会话，指定参与者列表。单聊会话按参与者去重，群聊可设置会话名称。
* @summary 创建会话
* @param {ImConversationCreateReq} imConversationCreateReq  ImConversationCreateReq 创建会话请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationCreate (
imConversationCreateReq: ImConversationCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/create`;
    return requestClient.post<ExtractDataType<PostApiV1ImConversationCreate200Response>>(localVarPath, imConversationCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建当前用户与指定 AI 分身（Clone）的单聊会话，已存在时复用原会话。
* @summary 创建 AI 会话
* @param {ImConversationCreateAIReq} imConversationCreateAIReq  ImConversationCreateAIReq 创建 AI 会话请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationCreateAi (
imConversationCreateAIReq: ImConversationCreateAIReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/create-ai`;
    return requestClient.post<ExtractDataType<PostApiV1ImConversationCreate200Response>>(localVarPath, imConversationCreateAIReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：群主解散群聊会话，解散后所有成员不可再发送消息。
* @summary 群聊解散
* @param {ImConversationDisbandReq} imConversationDisbandReq  ImConversationDisbandReq 群聊解散请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationDisband (
imConversationDisbandReq: ImConversationDisbandReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/disband`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imConversationDisbandReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按会话 ID 查询会话详情，含未读数与个人设置状态。
* @summary 获取会话详情
* @param {ImConversationGetReq} imConversationGetReq  ImConversationGetReq 获取会话详情请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationGet (
imConversationGetReq: ImConversationGetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/get`;
    return requestClient.post<ExtractDataType<PostApiV1ImConversationGet200Response>>(localVarPath, imConversationGetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按两个用户 ID 查询其单聊会话，用于发起单聊前定位已有会话。
* @summary 按参与者查询单聊会话
* @param {ImConversationGetByParticipantsReq} imConversationGetByParticipantsReq  ImConversationGetByParticipantsReq 按参与者查询单聊会话
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationGetByParticipants (
imConversationGetByParticipantsReq: ImConversationGetByParticipantsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/get-by-participants`;
    return requestClient.post<ExtractDataType<PostApiV1ImConversationGetByParticipants200Response>>(localVarPath, imConversationGetByParticipantsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户的会话列表，含最后一条消息摘要、未读数、置顶/免打扰状态。
* @summary 获取会话列表
* @param {ImConversationGetListReq} imConversationGetListReq  ImConversationGetListReq 获取会话列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationGetList (
imConversationGetListReq: ImConversationGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ImConversationGetList200Response>>(localVarPath, imConversationGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询会话全部成员及其角色、禁言状态，用户基础信息（昵称、头像）由 apisvr 富化返回。
* @summary 获取会话成员列表
* @param {ImConversationGetMembersReq} imConversationGetMembersReq  ImConversationGetMembersReq 获取会话成员列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationGetMembers (
imConversationGetMembersReq: ImConversationGetMembersReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/get-members`;
    return requestClient.post<ExtractDataType<PostApiV1ImConversationGetMembers200Response>>(localVarPath, imConversationGetMembersReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：群主或管理员对群成员执行禁言或取消禁言。
* @summary 群聊禁言/取消禁言成员
* @param {ImConversationMuteMemberReq} imConversationMuteMemberReq  ImConversationMuteMemberReq 群聊禁言/取消禁言成员请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationMuteMember (
imConversationMuteMemberReq: ImConversationMuteMemberReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/mute-member`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imConversationMuteMemberReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将指定成员移出群聊，或成员主动退出群聊。
* @summary 群聊移除/退出成员
* @param {ImConversationRemoveMemberReq} imConversationRemoveMemberReq  ImConversationRemoveMemberReq 群聊移除/退出成员请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationRemoveMember (
imConversationRemoveMemberReq: ImConversationRemoveMemberReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/remove-member`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imConversationRemoveMemberReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：群主设置或取消群成员的管理员身份。
* @summary 群聊设置/取消管理员
* @param {ImConversationSetAdminReq} imConversationSetAdminReq  ImConversationSetAdminReq 群聊设置/取消管理员请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationSetAdmin (
imConversationSetAdminReq: ImConversationSetAdminReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/set-admin`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imConversationSetAdminReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：群主将会话所有权转让给其他成员。
* @summary 群聊转让群主
* @param {ImConversationTransferOwnerReq} imConversationTransferOwnerReq  ImConversationTransferOwnerReq 群聊转让群主请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationTransferOwner (
imConversationTransferOwnerReq: ImConversationTransferOwnerReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/transfer-owner`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imConversationTransferOwnerReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新当前用户在会话中的个人设置，包括置顶、免打扰、从会话列表删除。
* @summary 更新会话设置
* @param {ImConversationUpdateSettingReq} imConversationUpdateSettingReq  ImConversationUpdateSettingReq 更新会话设置请求（置顶/免打扰/删除）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImConversationUpdateSetting (
imConversationUpdateSettingReq: ImConversationUpdateSettingReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/conversation/update-setting`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imConversationUpdateSettingReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ImConversationAddMembers operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationAddMembersRequest {
    /**
     *  ImConversationAddMembersReq 群聊邀请成员请求
     */
    readonly imConversationAddMembersReq: ImConversationAddMembersReq
}

/**
 * Request parameters for postApiV1ImConversationCreate operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationCreateRequest {
    /**
     *  ImConversationCreateReq 创建会话请求
     */
    readonly imConversationCreateReq: ImConversationCreateReq
}

/**
 * Request parameters for postApiV1ImConversationCreateAi operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationCreateAiRequest {
    /**
     *  ImConversationCreateAIReq 创建 AI 会话请求
     */
    readonly imConversationCreateAIReq: ImConversationCreateAIReq
}

/**
 * Request parameters for postApiV1ImConversationDisband operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationDisbandRequest {
    /**
     *  ImConversationDisbandReq 群聊解散请求
     */
    readonly imConversationDisbandReq: ImConversationDisbandReq
}

/**
 * Request parameters for postApiV1ImConversationGet operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationGetRequest {
    /**
     *  ImConversationGetReq 获取会话详情请求
     */
    readonly imConversationGetReq: ImConversationGetReq
}

/**
 * Request parameters for postApiV1ImConversationGetByParticipants operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationGetByParticipantsRequest {
    /**
     *  ImConversationGetByParticipantsReq 按参与者查询单聊会话
     */
    readonly imConversationGetByParticipantsReq: ImConversationGetByParticipantsReq
}

/**
 * Request parameters for postApiV1ImConversationGetList operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationGetListRequest {
    /**
     *  ImConversationGetListReq 获取会话列表请求
     */
    readonly imConversationGetListReq: ImConversationGetListReq
}

/**
 * Request parameters for postApiV1ImConversationGetMembers operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationGetMembersRequest {
    /**
     *  ImConversationGetMembersReq 获取会话成员列表请求
     */
    readonly imConversationGetMembersReq: ImConversationGetMembersReq
}

/**
 * Request parameters for postApiV1ImConversationMuteMember operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationMuteMemberRequest {
    /**
     *  ImConversationMuteMemberReq 群聊禁言/取消禁言成员请求
     */
    readonly imConversationMuteMemberReq: ImConversationMuteMemberReq
}

/**
 * Request parameters for postApiV1ImConversationRemoveMember operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationRemoveMemberRequest {
    /**
     *  ImConversationRemoveMemberReq 群聊移除/退出成员请求
     */
    readonly imConversationRemoveMemberReq: ImConversationRemoveMemberReq
}

/**
 * Request parameters for postApiV1ImConversationSetAdmin operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationSetAdminRequest {
    /**
     *  ImConversationSetAdminReq 群聊设置/取消管理员请求
     */
    readonly imConversationSetAdminReq: ImConversationSetAdminReq
}

/**
 * Request parameters for postApiV1ImConversationTransferOwner operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationTransferOwnerRequest {
    /**
     *  ImConversationTransferOwnerReq 群聊转让群主请求
     */
    readonly imConversationTransferOwnerReq: ImConversationTransferOwnerReq
}

/**
 * Request parameters for postApiV1ImConversationUpdateSetting operation in ImConversationApi.
 */
export interface ImConversationApiPostApiV1ImConversationUpdateSettingRequest {
    /**
     *  ImConversationUpdateSettingReq 更新会话设置请求（置顶/免打扰/删除）
     */
    readonly imConversationUpdateSettingReq: ImConversationUpdateSettingReq
}
