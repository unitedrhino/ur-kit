import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemTenantAppGetList200Response } from '../models';
import type { PostApiV1SystemTenantAppGetOne200Response } from '../models';
import type { TenantAppCreateReq } from '../models';
import type { TenantAppGetListReq } from '../models';
import type { TenantAppInfo } from '../models';
import type { WithTenantAppID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemTenantAppApi - axios parameter creator
 */

/**
* 业务说明：为租户开通指定应用，付费应用需提供授权码。平台管理员可跨租户操作；租户用户只能为自己的租户开通，需提供授权码。开通后租户用户可使用该应用。
* @summary 绑定租户应用
* @param {TenantAppCreateReq} tenantAppCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAppCreate (
tenantAppCreateReq: TenantAppCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/app/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantAppCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：解除租户与应用的绑定关系，租户用户将无法继续使用该应用。仅平台管理员可操作，用于平台后台的应用授权注销功能。
* @summary 解绑租户应用
* @param {WithTenantAppID} withTenantAppID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAppDelete (
withTenantAppID: WithTenantAppID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/app/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withTenantAppID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询租户已开通的应用列表，支持按应用类型、状态过滤。租户管理员可查看自己租户的应用，平台管理员可查看任意租户的应用绑定情况。用于应用管理列表页。
* @summary 获取租户应用列表
* @param {TenantAppGetListReq} tenantAppGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAppGetList (
tenantAppGetListReq: TenantAppGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/app/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantAppGetList200Response>>(localVarPath, tenantAppGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个租户应用的详细配置信息，包括状态、过期时间、应用详情等。用于应用详情页或编辑表单初始化。
* @summary 获取应用信息
* @param {WithTenantAppID} withTenantAppID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAppGetOne (
withTenantAppID: WithTenantAppID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/app/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemTenantAppGetOne200Response>>(localVarPath, withTenantAppID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改租户应用的配置，如状态、排序、过期时间等。仅平台管理员可操作，用于平台后台的应用配置管理。
* @summary 更新租户应用
* @param {TenantAppInfo} tenantAppInfo     TenantAppModuleBatchCreate{,        Code string &#x60;json:\&quot;code,optional\&quot;&#x60;                      租户编号,        AppID int64 &#x60;json:\&quot;appID,string\&quot;&#x60;,        Modules []*TenantAppModule &#x60;json:\&quot;modules\&quot;&#x60;,    },    ResCore{,        ID int64 &#x60;json:\&quot;id,string\&quot;&#x60;,        Code string &#x60;json:\&quot;code\&quot;&#x60;,        Name string &#x60;json:\&quot;name\&quot;&#x60;,        Type string &#x60;json:\&quot;type\&quot;&#x60;  menu:菜单 api:接口,    },    AppCore{,        ID int64 &#x60;json:\&quot;id,string,optional\&quot;&#x60;                                       编号,        Code string &#x60;json:\&quot;code\&quot;&#x60;                                应用编码,        Type string &#x60;json:\&quot;type\&quot;&#x60; 应用类型 web:web页面  app:应用  mini:小程序,        SubType string &#x60;json:\&quot;subType,optional\&quot;&#x60;子类型  wx:微信小程序  ding:钉钉小程序,        Name string &#x60;json:\&quot;name,optional\&quot;&#x60;                                  应用名称,        LoginTypes []string &#x60;json:\&quot;loginTypes,optional\&quot;&#x60;支持的登录类型(不填支持全部登录方式):    \&quot;email\&quot;:邮箱 \&quot;phone\&quot;:手机号  \&quot;wxMiniP\&quot;:微信小程序  \&quot;wxOpen\&quot;: 微信开放平台登录   \&quot;dingApp\&quot;:钉钉应用(包含小程序,h5等方式)  \&quot;pwd\&quot;:账号密码注册,        WxOpen *ThirdMiniCore &#x60;json:\&quot;wxOpen,optional,omitempty\&quot;&#x60;微信开放 web app有,        IsAutoRegister int64 &#x60;json:\&quot;isAutoRegister,optional\&quot;&#x60; 登录未注册是否自动注册,        Config string &#x60;json:\&quot;config,optional\&quot;&#x60; 自定义配置json,        Android *ThirdApp &#x60;json:\&quot;android,optional,omitempty\&quot;&#x60;,        Tenant *TenantCore &#x60;json:\&quot;tenant\&quot;&#x60; 租户信息,    }
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemTenantAppUpdate (
tenantAppInfo: TenantAppInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/tenant/app/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, tenantAppInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemTenantAppCreate operation in SystemTenantAppApi.
 */
export interface SystemTenantAppApiPostApiV1SystemTenantAppCreateRequest {
    readonly tenantAppCreateReq: TenantAppCreateReq
}

/**
 * Request parameters for postApiV1SystemTenantAppDelete operation in SystemTenantAppApi.
 */
export interface SystemTenantAppApiPostApiV1SystemTenantAppDeleteRequest {
    readonly withTenantAppID: WithTenantAppID
}

/**
 * Request parameters for postApiV1SystemTenantAppGetList operation in SystemTenantAppApi.
 */
export interface SystemTenantAppApiPostApiV1SystemTenantAppGetListRequest {
    readonly tenantAppGetListReq: TenantAppGetListReq
}

/**
 * Request parameters for postApiV1SystemTenantAppGetOne operation in SystemTenantAppApi.
 */
export interface SystemTenantAppApiPostApiV1SystemTenantAppGetOneRequest {
    readonly withTenantAppID: WithTenantAppID
}

/**
 * Request parameters for postApiV1SystemTenantAppUpdate operation in SystemTenantAppApi.
 */
export interface SystemTenantAppApiPostApiV1SystemTenantAppUpdateRequest {
    /**
     *     TenantAppModuleBatchCreate{,        Code string &#x60;json:\&quot;code,optional\&quot;&#x60;                      租户编号,        AppID int64 &#x60;json:\&quot;appID,string\&quot;&#x60;,        Modules []*TenantAppModule &#x60;json:\&quot;modules\&quot;&#x60;,    },    ResCore{,        ID int64 &#x60;json:\&quot;id,string\&quot;&#x60;,        Code string &#x60;json:\&quot;code\&quot;&#x60;,        Name string &#x60;json:\&quot;name\&quot;&#x60;,        Type string &#x60;json:\&quot;type\&quot;&#x60;  menu:菜单 api:接口,    },    AppCore{,        ID int64 &#x60;json:\&quot;id,string,optional\&quot;&#x60;                                       编号,        Code string &#x60;json:\&quot;code\&quot;&#x60;                                应用编码,        Type string &#x60;json:\&quot;type\&quot;&#x60; 应用类型 web:web页面  app:应用  mini:小程序,        SubType string &#x60;json:\&quot;subType,optional\&quot;&#x60;子类型  wx:微信小程序  ding:钉钉小程序,        Name string &#x60;json:\&quot;name,optional\&quot;&#x60;                                  应用名称,        LoginTypes []string &#x60;json:\&quot;loginTypes,optional\&quot;&#x60;支持的登录类型(不填支持全部登录方式):    \&quot;email\&quot;:邮箱 \&quot;phone\&quot;:手机号  \&quot;wxMiniP\&quot;:微信小程序  \&quot;wxOpen\&quot;: 微信开放平台登录   \&quot;dingApp\&quot;:钉钉应用(包含小程序,h5等方式)  \&quot;pwd\&quot;:账号密码注册,        WxOpen *ThirdMiniCore &#x60;json:\&quot;wxOpen,optional,omitempty\&quot;&#x60;微信开放 web app有,        IsAutoRegister int64 &#x60;json:\&quot;isAutoRegister,optional\&quot;&#x60; 登录未注册是否自动注册,        Config string &#x60;json:\&quot;config,optional\&quot;&#x60; 自定义配置json,        Android *ThirdApp &#x60;json:\&quot;android,optional,omitempty\&quot;&#x60;,        Tenant *TenantCore &#x60;json:\&quot;tenant\&quot;&#x60; 租户信息,    }
     */
    readonly tenantAppInfo: TenantAppInfo
}
