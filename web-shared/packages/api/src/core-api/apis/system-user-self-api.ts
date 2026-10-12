import type { IDList } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemTenantAppGetList200Response } from '../models';
import type { PostApiV1SystemTenantAppMenuGetList200Response } from '../models';
import type { PostApiV1SystemUserInfoGetOne200Response } from '../models';
import type { PostApiV1SystemUserSelfAppGetOne200Response } from '../models';
import type { PostApiV1SystemUserSelfCaptcha200Response } from '../models';
import type { PostApiV1SystemUserSelfLogin200Response } from '../models';
import type { PostApiV1SystemUserSelfMessageGetList200Response } from '../models';
import type { PostApiV1SystemUserSelfMessageStatistics200Response } from '../models';
import type { PostApiV1SystemUserSelfNotifyPreferenceRead200Response } from '../models';
import type { PostApiV1SystemUserSelfProfileGetList200Response } from '../models';
import type { PostApiV1SystemUserSelfProfileGetOne200Response } from '../models';
import type { PostApiV1SystemUserSelfResourceActionGetList200Response } from '../models';
import type { PostApiV1SystemUserSelfThirdAuthStart200Response } from '../models';
import type { PostApiV1SystemUserSelfThirdLogin200Response } from '../models';
import type { PostApiV1SystemUserSelfUserSearch200Response } from '../models';
import type { UserBindAccountReq } from '../models';
import type { UserCaptchaReq } from '../models';
import type { UserChangePwdReq } from '../models';
import type { UserForgetPwdReq } from '../models';
import type { UserLoginReq } from '../models';
import type { UserMenuGetListReq } from '../models';
import type { UserMessageGetListReq } from '../models';
import type { UserMessageGetPendingReq } from '../models';
import type { UserNotifyPreference } from '../models';
import type { UserProfile } from '../models';
import type { UserProfileDeleteReq } from '../models';
import type { UserProfileGetListReq } from '../models';
import type { UserProfileGetOneReq } from '../models';
import type { UserPushClientReportReq } from '../models';
import type { UserRegisterReq } from '../models';
import type { UserSearchReq } from '../models';
import type { UserSelfAppGetListReq } from '../models';
import type { UserSelfAppGetOneReq } from '../models';
import type { UserSelfGetOneReq } from '../models';
import type { UserSelfUpdateReq } from '../models';
import type { UserThirdAuthStartReq } from '../models';
import type { UserThirdLoginReq } from '../models';
import type { UserThirdRegisterReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemUserSelfApi - axios parameter creator
 */

/**
* 业务说明：获取当前登录用户可访问的应用列表，根据用户所在租户的应用开通情况过滤。返回应用基本信息包括应用ID、名称等。用于应用选择器、用户可用应用展示等场景。
* @summary 获取用户应用列表
* @param {UserSelfAppGetListReq} userSelfAppGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfAppGetList (
userSelfAppGetListReq: UserSelfAppGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/app/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantAppGetList200Response>>(localVarPath, userSelfAppGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取指定应用的详细信息，包括应用ID、名称、拥有该应用的租户列表等。用于查看应用详情、了解应用覆盖的租户范围等场景。需指定应用ID和类型（应用/小程序）。
* @summary 获取用户应用详情
* @param {UserSelfAppGetOneReq} userSelfAppGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfAppGetOne (
userSelfAppGetOneReq: UserSelfAppGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/app/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfAppGetOne200Response>>(localVarPath, userSelfAppGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：当前用户绑定第三方账号（微信、钉钉等）或绑定手机号、邮箱。支持多种绑定方式：手机号验证码、邮箱验证码、微信开放平台、微信小程序、钉钉等。用于账号绑定、多渠道登录设置等场景。
* @summary 绑定账号
* @param {UserBindAccountReq} userBindAccountReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfBindAccount (
userBindAccountReq: UserBindAccountReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/bind-account`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userBindAccountReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：当前用户注销自己的账号。注销后账号永久删除，无法恢复，相关数据同步清理。需用户确认后执行，用于用户主动注销账号等场景。
* @summary 注销用户
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfCancel (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/cancel`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 生成图形验证码，用于登录、注册等需要人机验证的场景，验证码5分钟内有效，返回base64编码的图片和验证码ID
* @summary 获取验证码
* @param {UserCaptchaReq} userCaptchaReq  认证相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfCaptcha (
userCaptchaReq: UserCaptchaReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/captcha`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfCaptcha200Response>>(localVarPath, userCaptchaReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：当前用户修改登录密码，支持多种验证方式：原密码验证、手机验证码验证、邮箱验证码验证。需提供验证凭证和新密码。用于用户修改密码、安全设置等场景。
* @summary 更新用户密码
* @param {UserChangePwdReq} userChangePwdReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfChangePwd (
userChangePwdReq: UserChangePwdReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/change-pwd`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userChangePwdReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 用户通过手机验证码或邮箱验证码重置密码，验证身份后设置新密码
* @summary 忘记密码
* @param {UserForgetPwdReq} userForgetPwdReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfForgetPwd (
userForgetPwdReq: UserForgetPwdReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/forget-pwd`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userForgetPwdReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取当前登录用户的详细信息，包括用户基本信息、所属租户列表、绑定的第三方账号等。可指定是否同时返回租户详情。用于个人中心、用户资料展示等场景。
* @summary 获取用户信息
* @param {UserSelfGetOneReq} userSelfGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfGetOne (
userSelfGetOneReq: UserSelfGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserInfoGetOne200Response>>(localVarPath, userSelfGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 用户通过账号密码或手机验证码登录系统，返回会话Token用于后续API调用认证，支持多种登录类型：密码登录、验证码登录、第三方登录
* @summary 用户登录
* @param {UserLoginReq} userLoginReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfLogin (
userLoginReq: UserLoginReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/login`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfLogin200Response>>(localVarPath, userLoginReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：当前用户退出登录状态。登出后token失效，需重新登录才能访问需要认证的接口。用于用户主动退出登录、切换账号等场景。
* @summary 用户登出
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfLogout (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/logout`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取当前登录用户在当前租户下可访问的菜单列表，根据用户角色权限过滤。返回菜单树结构，包含菜单名称、路径、图标等信息。用于前端动态渲染侧边栏导航、权限菜单展示等场景。可按应用ID和常用标记过滤。
* @summary 获取用户菜单列表
* @param {UserMenuGetListReq} userMenuGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfMenuGetList (
userMenuGetListReq: UserMenuGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/menu/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantAppMenuGetList200Response>>(localVarPath, userMenuGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户的消息列表，支持按分组、类型、通知编码、已读状态、已处理状态等条件过滤。返回消息详情包括消息内容、发送时间等。用于消息中心列表展示、消息历史查询等场景。
* @summary 用户消息列表
* @param {UserMessageGetListReq} userMessageGetListReq  用户消息相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfMessageGetList (
userMessageGetListReq: UserMessageGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/message/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfMessageGetList200Response>>(localVarPath, userMessageGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询当前用户需要处理的消息列表，返回未处理状态的消息。用于待办事项展示、待处理消息提醒等场景，帮助用户快速了解需要响应的消息。
* @summary 用户待处理消息
* @param {UserMessageGetPendingReq} userMessageGetPendingReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfMessageGetPending (
userMessageGetPendingReq: UserMessageGetPendingReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/message/get-pending`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfMessageGetList200Response>>(localVarPath, userMessageGetPendingReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将指定消息标记为已处理状态。用于处理需要用户响应的消息（如审批通知、任务提醒等），标记后消息状态变更为已处理。
* @summary 用户消息标记已处理
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfMessageHandle (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/message/handle`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将当前用户的所有未读消息一次性标记为已读。用于用户一键清理所有未读提醒、快速消除消息提醒红点等场景。执行后未读计数归零。
* @summary 用户消息全部已读
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfMessageMarkAllRead (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/message/mark-all-read`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量删除指定的消息记录，传入消息ID列表。删除后消息不再显示在消息列表中。用于用户清理不需要的消息、整理消息箱等场景。
* @summary 用户消息批量删除
* @param {IDList} iDList
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfMessageMultiDelete (
iDList: IDList,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/message/multi-delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, iDList, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将指定的多条消息标记为已读状态，传入消息ID列表。用于用户批量处理未读消息、清理消息提醒等场景。标记后消息在列表中显示为已读，未读计数相应减少。
* @summary 用户消息批量已读
* @param {IDList} iDList
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfMessageMultiIsRead (
iDList: IDList,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/message/multi-is-read`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, iDList, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取当前用户的消息统计信息，包括各分组的未读数量、总未读数、待处理消息数等。用于消息中心顶部统计展示、消息提醒红点计算等场景。返回分组维度的统计数据。
* @summary 用户消息统计
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfMessageStatistics (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/message/statistics`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfMessageStatistics200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取当前用户的通知偏好设置，包括免打扰时间段、免打扰渠道、各通知分组的订阅控制等。用于用户查看和修改通知偏好设置等场景。
* @summary 用户通知偏好读取
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfNotifyPreferenceRead (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/notify-preference/read`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfNotifyPreferenceRead200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新当前用户的通知偏好设置，包括设置免打扰时间段、启用/禁用特定通知渠道、控制各通知分组的订阅状态等。用于用户个性化配置消息接收方式。
* @summary 用户通知偏好更新
* @param {UserNotifyPreference} userNotifyPreference  用户通知偏好
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfNotifyPreferenceUpdate (
userNotifyPreference: UserNotifyPreference,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/notify-preference/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userNotifyPreference, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除当前用户指定编码的个性化配置项。仅允许删除当前登录用户自己的配置，供旧版 App 清理已失效的本地偏好。
* @summary 删除用户配置
* @param {UserProfileDeleteReq} userProfileDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfProfileDelete (
userProfileDeleteReq: UserProfileDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/profile/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userProfileDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量获取当前用户的多个配置项，传入配置编码列表，返回对应的配置参数。用于一次性加载多个用户偏好设置、配置项批量查询等场景。
* @summary 获取用户配置列表
* @param {UserProfileGetListReq} userProfileGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfProfileGetList (
userProfileGetListReq: UserProfileGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/profile/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfProfileGetList200Response>>(localVarPath, userProfileGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取当前用户指定的个性化配置项，如界面偏好、通知设置等。返回配置编码和参数值（JSON格式）。用于前端加载用户偏好设置、恢复用户自定义配置等场景。可同时返回用户可访问的项目列表。
* @summary 获取用户配置详情
* @param {UserProfileGetOneReq} userProfileGetOneReq  用户配置相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfProfileGetOne (
userProfileGetOneReq: UserProfileGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/profile/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfProfileGetOne200Response>>(localVarPath, userProfileGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新当前用户的个性化配置项，保存用户的界面偏好、操作习惯等自定义设置。配置参数以JSON格式存储。用于用户保存个人设置、修改偏好配置等场景。
* @summary 更新用户配置
* @param {UserProfile} userProfile
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfProfileUpdate (
userProfile: UserProfile,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/profile/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userProfile, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：保存当前用户的 uni-push 客户端 ID；platform=unbind 时解绑当前用户与该客户端 ID。
* @summary 上报推送客户端
* @param {UserPushClientReportReq} userPushClientReportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfPushClientReport (
userPushClientReportReq: UserPushClientReportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/push-client/report`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userPushClientReportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 新用户注册账号，支持手机号注册和邮箱注册，注册成功后自动登录并返回会话Token
* @summary 普通用户注册
* @param {UserRegisterReq} userRegisterReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfRegister (
userRegisterReq: UserRegisterReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/register`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfLogin200Response>>(localVarPath, userRegisterReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取当前登录用户通过角色绑定的所有 resource+action 权限对，用于前端路由守卫和按钮权限控制。返回格式为 {resource, action} 列表，前端转换为 resource:action 字符串做权限匹配。
* @summary 获取用户资源动作权限列表
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfResourceActionGetList (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/resource/action/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfResourceActionGetList200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据当前应用配置生成 Huawei、Google、GitHub、Apple 的授权跳转地址，前端只传 provider 与平台类型，不允许覆盖 redirectURI。
* @summary 第三方登录授权起跳
* @param {UserThirdAuthStartReq} userThirdAuthStartReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfThirdAuthStart (
userThirdAuthStartReq: UserThirdAuthStartReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/third-auth/start`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfThirdAuthStart200Response>>(localVarPath, userThirdAuthStartReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：前端携带第三方回调 code 与 state 调用此接口，后端完成第三方身份解析、自动绑定、自动建号或返回需补全信息状态。
* @summary 第三方登录回调换平台登录态
* @param {UserThirdLoginReq} userThirdLoginReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfThirdLogin (
userThirdLoginReq: UserThirdLoginReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/third-login`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfThirdLogin200Response>>(localVarPath, userThirdLoginReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：第三方登录缺少可用邮箱或手机号时，前端提交 pendingToken 与补全信息，后端完成建号、绑定并直接登录。
* @summary 第三方补全注册
* @param {UserThirdRegisterReq} userThirdRegisterReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfThirdRegister (
userThirdRegisterReq: UserThirdRegisterReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/third-register`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfLogin200Response>>(localVarPath, userThirdRegisterReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：当前用户更新自己的个人信息，包括昵称、性别、头像等非敏感字段。用户名、邮箱、手机号等敏感字段需管理员修改。支持部分更新，未传字段保持原值。
* @summary 更新用户基本数据
* @param {UserSelfUpdateReq} userSelfUpdateReq  用户信息相关
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfUpdate (
userSelfUpdateReq: UserSelfUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userSelfUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据账号（用户名/手机号/邮箱）精准搜索用户，返回用户基本信息包括用户ID、用户名、昵称、头像、状态等。用于添加好友、查找用户、用户选择器等场景。
* @summary 精准搜索用户
* @param {UserSearchReq} userSearchReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfUserSearch (
userSearchReq: UserSearchReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/user/search`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfUserSearch200Response>>(localVarPath, userSearchReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemUserSelfAppGetList operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfAppGetListRequest {
    readonly userSelfAppGetListReq: UserSelfAppGetListReq
}

/**
 * Request parameters for postApiV1SystemUserSelfAppGetOne operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfAppGetOneRequest {
    readonly userSelfAppGetOneReq: UserSelfAppGetOneReq
}

/**
 * Request parameters for postApiV1SystemUserSelfBindAccount operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfBindAccountRequest {
    readonly userBindAccountReq: UserBindAccountReq
}

/**
 * Request parameters for postApiV1SystemUserSelfCaptcha operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfCaptchaRequest {
    /**
     *  认证相关
     */
    readonly userCaptchaReq: UserCaptchaReq
}

/**
 * Request parameters for postApiV1SystemUserSelfChangePwd operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfChangePwdRequest {
    readonly userChangePwdReq: UserChangePwdReq
}

/**
 * Request parameters for postApiV1SystemUserSelfForgetPwd operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfForgetPwdRequest {
    readonly userForgetPwdReq: UserForgetPwdReq
}

/**
 * Request parameters for postApiV1SystemUserSelfGetOne operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfGetOneRequest {
    readonly userSelfGetOneReq: UserSelfGetOneReq
}

/**
 * Request parameters for postApiV1SystemUserSelfLogin operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfLoginRequest {
    readonly userLoginReq: UserLoginReq
}

/**
 * Request parameters for postApiV1SystemUserSelfMenuGetList operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfMenuGetListRequest {
    readonly userMenuGetListReq: UserMenuGetListReq
}

/**
 * Request parameters for postApiV1SystemUserSelfMessageGetList operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfMessageGetListRequest {
    /**
     *  用户消息相关
     */
    readonly userMessageGetListReq: UserMessageGetListReq
}

/**
 * Request parameters for postApiV1SystemUserSelfMessageGetPending operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfMessageGetPendingRequest {
    readonly userMessageGetPendingReq: UserMessageGetPendingReq
}

/**
 * Request parameters for postApiV1SystemUserSelfMessageHandle operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfMessageHandleRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemUserSelfMessageMultiDelete operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfMessageMultiDeleteRequest {
    readonly iDList: IDList
}

/**
 * Request parameters for postApiV1SystemUserSelfMessageMultiIsRead operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfMessageMultiIsReadRequest {
    readonly iDList: IDList
}

/**
 * Request parameters for postApiV1SystemUserSelfNotifyPreferenceUpdate operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfNotifyPreferenceUpdateRequest {
    /**
     *  用户通知偏好
     */
    readonly userNotifyPreference: UserNotifyPreference
}

/**
 * Request parameters for postApiV1SystemUserSelfProfileDelete operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfProfileDeleteRequest {
    readonly userProfileDeleteReq: UserProfileDeleteReq
}

/**
 * Request parameters for postApiV1SystemUserSelfProfileGetList operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfProfileGetListRequest {
    readonly userProfileGetListReq: UserProfileGetListReq
}

/**
 * Request parameters for postApiV1SystemUserSelfProfileGetOne operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfProfileGetOneRequest {
    /**
     *  用户配置相关
     */
    readonly userProfileGetOneReq: UserProfileGetOneReq
}

/**
 * Request parameters for postApiV1SystemUserSelfProfileUpdate operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfProfileUpdateRequest {
    readonly userProfile: UserProfile
}

/**
 * Request parameters for postApiV1SystemUserSelfPushClientReport operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfPushClientReportRequest {
    readonly userPushClientReportReq: UserPushClientReportReq
}

/**
 * Request parameters for postApiV1SystemUserSelfRegister operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfRegisterRequest {
    readonly userRegisterReq: UserRegisterReq
}

/**
 * Request parameters for postApiV1SystemUserSelfThirdAuthStart operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfThirdAuthStartRequest {
    readonly userThirdAuthStartReq: UserThirdAuthStartReq
}

/**
 * Request parameters for postApiV1SystemUserSelfThirdLogin operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfThirdLoginRequest {
    readonly userThirdLoginReq: UserThirdLoginReq
}

/**
 * Request parameters for postApiV1SystemUserSelfThirdRegister operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfThirdRegisterRequest {
    readonly userThirdRegisterReq: UserThirdRegisterReq
}

/**
 * Request parameters for postApiV1SystemUserSelfUpdate operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfUpdateRequest {
    /**
     *  用户信息相关
     */
    readonly userSelfUpdateReq: UserSelfUpdateReq
}

/**
 * Request parameters for postApiV1SystemUserSelfUserSearch operation in SystemUserSelfApi.
 */
export interface SystemUserSelfApiPostApiV1SystemUserSelfUserSearchRequest {
    readonly userSearchReq: UserSearchReq
}
