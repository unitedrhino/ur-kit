import type { MessageInfo } from '../models';
import type { MessageInfoGetListReq } from '../models';
import type { MessageInfoSendReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemNotifyMessageInfoGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemNotifyMessageInfoApi - axios parameter creator
 */

/**
* 业务说明：删除指定的消息记录，清理消息中心的历史消息。删除后用户端将无法查看该消息。管理员权限。
* @summary 删除消息
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyMessageInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/message/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询消息记录列表，支持按通知编码、分组、是否全局消息、关联手动通知ID筛选。用于消息中心展示历史通知消息，管理员可查看所有消息记录。
* @summary 获取消息列表
* @param {MessageInfoGetListReq} messageInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyMessageInfoGetList (
messageInfoGetListReq: MessageInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/message/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyMessageInfoGetList200Response>>(localVarPath, messageInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：手动发送通知消息，可指定目标用户ID列表或发送全局消息。支持选择通知编码、主题、内容、通知时间等参数，不填通知时间则立即发送。用于管理员手动推送通知。
* @summary 发送消息
* @param {MessageInfoSendReq} messageInfoSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyMessageInfoSend (
messageInfoSendReq: MessageInfoSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/message/info/send`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, messageInfoSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改消息的属性，如分组、主题、内容、通知时间等。用于修正消息内容或调整消息状态，支持部分更新。管理员权限。
* @summary 更新消息
* @param {MessageInfo} messageInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyMessageInfoUpdate (
messageInfo: MessageInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/message/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, messageInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemNotifyMessageInfoDelete operation in SystemNotifyMessageInfoApi.
 */
export interface SystemNotifyMessageInfoApiPostApiV1SystemNotifyMessageInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyMessageInfoGetList operation in SystemNotifyMessageInfoApi.
 */
export interface SystemNotifyMessageInfoApiPostApiV1SystemNotifyMessageInfoGetListRequest {
    readonly messageInfoGetListReq: MessageInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemNotifyMessageInfoSend operation in SystemNotifyMessageInfoApi.
 */
export interface SystemNotifyMessageInfoApiPostApiV1SystemNotifyMessageInfoSendRequest {
    readonly messageInfoSendReq: MessageInfoSendReq
}

/**
 * Request parameters for postApiV1SystemNotifyMessageInfoUpdate operation in SystemNotifyMessageInfoApi.
 */
export interface SystemNotifyMessageInfoApiPostApiV1SystemNotifyMessageInfoUpdateRequest {
    readonly messageInfo: MessageInfo
}
