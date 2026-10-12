import type { Notification } from '../models';
import type { NotificationIndexReq } from '../models';
import type { NotificationSendReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemNotifyNotificationEstimateUsers200Response } from '../models';
import type { PostApiV1SystemNotifyNotificationIndex200Response } from '../models';
import type { PostApiV1SystemNotifyNotificationRead200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemNotifyNotificationApi - axios parameter creator
 */

/**
* 业务说明：复制现有的手动通知任务创建新副本，新通知继承原通知的所有属性但状态初始化为草稿。用于基于历史通知快速创建新通知，减少重复配置工作。
* @summary 复制手动通知
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationCopy (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/copy`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建新的手动通知任务，定义标题、内容、发送渠道列表、优先级、目标受众类型（指定用户/全局）、目标用户ID列表、计划发送时间等属性。支持草稿状态保存，后续再发送。用于管理员手动推送通知的场景。
* @summary 创建手动通知
* @param {Notification} notification
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationCreate (
notification: Notification,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, notification, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的手动通知任务，删除后用户端将无法收到该通知。用于清理不再需要的通知任务，仅草稿状态可删除。管理员权限。
* @summary 删除手动通知
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据手动通知的受众配置（指定用户/全局）预估送达用户数量。用于发送前评估通知覆盖范围，帮助管理员决策是否调整受众配置。
* @summary 预估送达用户数
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationEstimateUsers (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/estimate-users`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyNotificationEstimateUsers200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询手动通知任务列表，支持按状态、分组、优先级、租户、标题筛选。用于通知任务管理页面的列表展示，管理员可查看所有状态的通知任务（草稿/已计划/发送中/已发送/已撤回）。
* @summary 获取手动通知列表
* @param {NotificationIndexReq} notificationIndexReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationIndex (
notificationIndexReq: NotificationIndexReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/index`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyNotificationIndex200Response>>(localVarPath, notificationIndexReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据ID获取手动通知任务的完整信息，包括标题、内容、渠道、优先级、状态、受众配置、发送统计（预计送达数/实际送达数）、创建者、时间等所有字段。用于通知编辑页面的数据加载或通知详情查看。
* @summary 获取手动通知详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationRead (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/read`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyNotificationRead200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：撤回已发送的手动通知，撤回后用户端将无法继续查看该通知。用于紧急修正错误通知或停止通知展示，仅已发送状态可撤回。管理员权限。
* @summary 撤回手动通知
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationRevoke (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/revoke`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：执行手动通知任务的发送操作，可指定计划发送时间（不填则立即发送）。发送后通知状态流转为发送中，完成发送后变为已发送。用于触发通知推送，支持定时发送。
* @summary 发送手动通知
* @param {NotificationSendReq} notificationSendReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationSend (
notificationSendReq: NotificationSendReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/send`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, notificationSendReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改手动通知任务的属性，包括标题、内容、渠道、优先级、受众配置等。支持部分更新，用于修正通知内容或调整发送配置。仅草稿状态可修改。
* @summary 更新手动通知
* @param {Notification} notification
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNotificationUpdate (
notification: Notification,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/notification/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, notification, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemNotifyNotificationCopy operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationCopyRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyNotificationCreate operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationCreateRequest {
    readonly notification: Notification
}

/**
 * Request parameters for postApiV1SystemNotifyNotificationDelete operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyNotificationEstimateUsers operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationEstimateUsersRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyNotificationIndex operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationIndexRequest {
    readonly notificationIndexReq: NotificationIndexReq
}

/**
 * Request parameters for postApiV1SystemNotifyNotificationRead operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationReadRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyNotificationRevoke operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationRevokeRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyNotificationSend operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationSendRequest {
    readonly notificationSendReq: NotificationSendReq
}

/**
 * Request parameters for postApiV1SystemNotifyNotificationUpdate operation in SystemNotifyNotificationApi.
 */
export interface SystemNotifyNotificationApiPostApiV1SystemNotifyNotificationUpdateRequest {
    readonly notification: Notification
}
