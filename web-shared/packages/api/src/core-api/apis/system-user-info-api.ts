import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemUserInfoCreate200Response } from '../models';
import type { PostApiV1SystemUserInfoGetList200Response } from '../models';
import type { PostApiV1SystemUserInfoGetOne200Response } from '../models';
import type { UserInfoCreateReq } from '../models';
import type { UserInfoDeleteReq } from '../models';
import type { UserInfoGetListReq } from '../models';
import type { UserInfoGetOneReq } from '../models';
import type { UserInfoResetPwdReq } from '../models';
import type { UserInfoUpdateReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemUserInfoApi - axios parameter creator
 */

/**
* 业务说明：管理员创建新用户账号，设置用户名、密码、邮箱、手机号等基本信息，并可为用户分配角色。创建成功后返回用户ID。用于平台管理员或租户管理员添加新用户。
* @summary 创建用户信息
* @param {UserInfoCreateReq} userInfoCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserInfoCreate (
userInfoCreateReq: UserInfoCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserInfoCreate200Response>>(localVarPath, userInfoCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定用户账号。删除后用户无法登录，相关数据（租户归属、角色绑定等）同步清理。用于用户账号注销、离职员工账号清理等场景。需确认用户无重要业务数据关联后再执行。
* @summary 刪除用户
* @param {UserInfoDeleteReq} userInfoDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserInfoDelete (
userInfoDeleteReq: UserInfoDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userInfoDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询用户列表，支持按用户名、手机号、邮箱、昵称等条件过滤。用于用户管理界面的列表展示、用户搜索等场景。返回用户基本信息及所属租户列表。
* @summary 查询用户信息列表
* @param {UserInfoGetListReq} userInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserInfoGetList (
userInfoGetListReq: UserInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserInfoGetList200Response>>(localVarPath, userInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取单个用户的详细信息，包括用户基本信息、所属租户列表、绑定的第三方账号等。可指定是否同时返回租户详情。用于用户详情页、用户编辑前的数据加载等场景。
* @summary 获取用户信息
* @param {UserInfoGetOneReq} userInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserInfoGetOne (
userInfoGetOneReq: UserInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserInfoGetOne200Response>>(localVarPath, userInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：平台管理员为任意用户重置登录密码，用于忘记密码的兜底处理与账号安全管理。入参password为原始密码明文（与管理员创建用户接口同口径，HTTPS内传输），后端按系统配置等级对明文做真实强度校验后以bcrypt(SHA256)存储，重置成功后清除该用户全部登录态强制重新登录。仅平台管理员可操作，租户管理员与普通用户无权限。
* @summary 重置用户密码
* @param {UserInfoResetPwdReq} userInfoResetPwdReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserInfoResetPwd (
userInfoResetPwdReq: UserInfoResetPwdReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/info/reset-pwd`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userInfoResetPwdReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：管理员更新用户的基本信息，包括用户名、昵称、邮箱、手机号、性别、头像等。平台管理员可修改敏感字段（用户名、邮箱、手机号），普通租户管理员权限受限。支持部分更新，未传字段保持原值。
* @summary 更新用户基本数据
* @param {UserInfoUpdateReq} userInfoUpdateReq   UserInfo {,  UserID         int64  &#x60;json:\&quot;userID,string,optional\&quot;&#x60;         用户id,  UserName    string &#x60;json:\&quot;userName,optional\&quot;&#x60;           用户名(唯一),  Password    string &#x60;json:\&quot;password,optional,omitempty\&quot;&#x60;          登录密码,        Email       *string &#x60;json:\&quot;email,optional\&quot;&#x60;              邮箱,        Phone       *string &#x60;json:\&quot;phone,optional\&quot;&#x60;              手机号,        LastIP      string &#x60;json:\&quot;lastIP,optional\&quot;&#x60;             最后登录ip,        RegIP       string &#x60;json:\&quot;regIP,optional\&quot;&#x60;              注册ip,  NickName    string &#x60;json:\&quot;nickName,optional\&quot;&#x60;           用户的昵称,  City        string &#x60;json:\&quot;city,optional\&quot;&#x60;               用户所在城市,  Country     string &#x60;json:\&quot;country,optional\&quot;&#x60;            用户所在国家,  Province    string &#x60;json:\&quot;province,optional\&quot;&#x60;           用户所在省份,  Language    string &#x60;json:\&quot;language,optional\&quot;&#x60;           用户的语言，简体中文为zh_CN,  Avatar  string &#x60;json:\&quot;avatar,optional\&quot;&#x60;         用户头像,  IsUpdateAvatar  bool &#x60;json:\&quot;isUpdateAvatar,omitempty,optional\&quot;&#x60;         用户头像,  CreatedTime int64  &#x60;json:\&quot;createdTime,string,optional\&quot;&#x60; 创建时间,        Role        int64  &#x60;json:\&quot;role,optional\&quot;&#x60;                        用户角色默认,        Sex         int64  &#x60;json:\&quot;sex,optional\&quot;&#x60;                用户的性别，值为1时是男性，值为2时是女性，值为0时是未知,  MessageNotGetOne map[string]int64  &#x60;json:\&quot;messageNotGetOne,optional,omitempty\&quot;&#x60;,   Roles []*RoleInfo &#x60;json:\&quot;roles,optional,omitempty\&quot;&#x60;,  Tenant *TenantInfo &#x60;json:\&quot;tenant,optional,omitempty\&quot;&#x60;,  Projects []*ProjectInfo &#x60;json:\&quot;projects,optional,omitempty\&quot;&#x60;    项目列表,   Depts []*DeptInfo &#x60;json:\&quot;depts,optional,omitempty\&quot;&#x60;,        BindThird map[string]string &#x60;json:\&quot;bindThird,optional,omitempty\&quot;&#x60; key为: wx:微信  ding: 钉钉 Value有值代表已绑定,  },     UserTenant{,        TenantCode string &#x60;json:\&quot;tenantCode,optional\&quot;&#x60;,        UserID         int64  &#x60;json:\&quot;userID,string,optional\&quot;&#x60;         用户id,        DeviceCount int64  &#x60;json:\&quot;deviceCount,optional,omitempty\&quot;&#x60; 用户所拥有的设备数量统计,        Status int64  &#x60;json:\&quot;status,optional\&quot;&#x60;,        DeptIDs   []string &#x60;json:\&quot;deptIDs,optional,omitempty\&quot;&#x60; 部门ID列表,        Tags    map[string]string       &#x60;json:\&quot;tags,optional,omitempty\&quot;&#x60; 私有标签,只有管理员可以修改,        PubTags  map[string]string      &#x60;json:\&quot;pubTags,optional,omitempty\&quot;&#x60;   公共的标签,用户自己可以修改,     }, UserInfoUpdateReq 用户信息更新请求（仅包含可更新字段）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserInfoUpdate (
userInfoUpdateReq: UserInfoUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, userInfoUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemUserInfoCreate operation in SystemUserInfoApi.
 */
export interface SystemUserInfoApiPostApiV1SystemUserInfoCreateRequest {
    readonly userInfoCreateReq: UserInfoCreateReq
}

/**
 * Request parameters for postApiV1SystemUserInfoDelete operation in SystemUserInfoApi.
 */
export interface SystemUserInfoApiPostApiV1SystemUserInfoDeleteRequest {
    readonly userInfoDeleteReq: UserInfoDeleteReq
}

/**
 * Request parameters for postApiV1SystemUserInfoGetList operation in SystemUserInfoApi.
 */
export interface SystemUserInfoApiPostApiV1SystemUserInfoGetListRequest {
    readonly userInfoGetListReq: UserInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemUserInfoGetOne operation in SystemUserInfoApi.
 */
export interface SystemUserInfoApiPostApiV1SystemUserInfoGetOneRequest {
    readonly userInfoGetOneReq: UserInfoGetOneReq
}

/**
 * Request parameters for postApiV1SystemUserInfoResetPwd operation in SystemUserInfoApi.
 */
export interface SystemUserInfoApiPostApiV1SystemUserInfoResetPwdRequest {
    readonly userInfoResetPwdReq: UserInfoResetPwdReq
}

/**
 * Request parameters for postApiV1SystemUserInfoUpdate operation in SystemUserInfoApi.
 */
export interface SystemUserInfoApiPostApiV1SystemUserInfoUpdateRequest {
    /**
     *   UserInfo {,  UserID         int64  &#x60;json:\&quot;userID,string,optional\&quot;&#x60;         用户id,  UserName    string &#x60;json:\&quot;userName,optional\&quot;&#x60;           用户名(唯一),  Password    string &#x60;json:\&quot;password,optional,omitempty\&quot;&#x60;          登录密码,        Email       *string &#x60;json:\&quot;email,optional\&quot;&#x60;              邮箱,        Phone       *string &#x60;json:\&quot;phone,optional\&quot;&#x60;              手机号,        LastIP      string &#x60;json:\&quot;lastIP,optional\&quot;&#x60;             最后登录ip,        RegIP       string &#x60;json:\&quot;regIP,optional\&quot;&#x60;              注册ip,  NickName    string &#x60;json:\&quot;nickName,optional\&quot;&#x60;           用户的昵称,  City        string &#x60;json:\&quot;city,optional\&quot;&#x60;               用户所在城市,  Country     string &#x60;json:\&quot;country,optional\&quot;&#x60;            用户所在国家,  Province    string &#x60;json:\&quot;province,optional\&quot;&#x60;           用户所在省份,  Language    string &#x60;json:\&quot;language,optional\&quot;&#x60;           用户的语言，简体中文为zh_CN,  Avatar  string &#x60;json:\&quot;avatar,optional\&quot;&#x60;         用户头像,  IsUpdateAvatar  bool &#x60;json:\&quot;isUpdateAvatar,omitempty,optional\&quot;&#x60;         用户头像,  CreatedTime int64  &#x60;json:\&quot;createdTime,string,optional\&quot;&#x60; 创建时间,        Role        int64  &#x60;json:\&quot;role,optional\&quot;&#x60;                        用户角色默认,        Sex         int64  &#x60;json:\&quot;sex,optional\&quot;&#x60;                用户的性别，值为1时是男性，值为2时是女性，值为0时是未知,  MessageNotGetOne map[string]int64  &#x60;json:\&quot;messageNotGetOne,optional,omitempty\&quot;&#x60;,   Roles []*RoleInfo &#x60;json:\&quot;roles,optional,omitempty\&quot;&#x60;,  Tenant *TenantInfo &#x60;json:\&quot;tenant,optional,omitempty\&quot;&#x60;,  Projects []*ProjectInfo &#x60;json:\&quot;projects,optional,omitempty\&quot;&#x60;    项目列表,   Depts []*DeptInfo &#x60;json:\&quot;depts,optional,omitempty\&quot;&#x60;,        BindThird map[string]string &#x60;json:\&quot;bindThird,optional,omitempty\&quot;&#x60; key为: wx:微信  ding: 钉钉 Value有值代表已绑定,  },     UserTenant{,        TenantCode string &#x60;json:\&quot;tenantCode,optional\&quot;&#x60;,        UserID         int64  &#x60;json:\&quot;userID,string,optional\&quot;&#x60;         用户id,        DeviceCount int64  &#x60;json:\&quot;deviceCount,optional,omitempty\&quot;&#x60; 用户所拥有的设备数量统计,        Status int64  &#x60;json:\&quot;status,optional\&quot;&#x60;,        DeptIDs   []string &#x60;json:\&quot;deptIDs,optional,omitempty\&quot;&#x60; 部门ID列表,        Tags    map[string]string       &#x60;json:\&quot;tags,optional,omitempty\&quot;&#x60; 私有标签,只有管理员可以修改,        PubTags  map[string]string      &#x60;json:\&quot;pubTags,optional,omitempty\&quot;&#x60;   公共的标签,用户自己可以修改,     }, UserInfoUpdateReq 用户信息更新请求（仅包含可更新字段）
     */
    readonly userInfoUpdateReq: UserInfoUpdateReq
}
