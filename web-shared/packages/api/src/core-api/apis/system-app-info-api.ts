import type { AppInfo } from '../models';
import type { AppInfoGetListReq } from '../models';
import type { AppInfoGetOneReq } from '../models';
import type { AppWxMiniGetUrlLinkReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemAppCoreGetOne200Response } from '../models';
import type { PostApiV1SystemAppInfoGetList200Response } from '../models';
import type { PostApiV1SystemAppInfoWxMiniGetUrlLink200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemAppInfoApi - axios parameter creator
 */

/**
* 业务说明：创建新的应用配置，包括应用名称、类型（web/小程序/原生）、使用对象、试用时长等。应用是平台的功能模块单元，租户可通过绑定应用获取相应功能权限。
* @summary 添加应用
* @param {AppInfo} appInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppInfoCreate (
appInfo: AppInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, appInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定应用，删除后租户无法再绑定该应用。删除前需确认无租户已绑定该应用，避免影响已开通的功能。通常用于清理废弃的应用配置。
* @summary 删除应用
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询平台应用列表，支持按名称、类型、状态、租户绑定状态等条件筛选。用于应用管理页面的列表展示，平台管理员可查看所有应用及租户绑定情况。
* @summary 获取应用列表
* @param {AppInfoGetListReq} appInfoGetListReq     AppPolicyGetOneReq{,        AppID int64 &#x60;json:\&quot;appID,string\&quot;&#x60;,        Code string &#x60;json:\&quot;code\&quot;&#x60;,    },    AppPolicy{,     ID int64 &#x60;json:\&quot;id,string,optional\&quot;&#x60;,     AppID int64 &#x60;json:\&quot;appID,string,optional\&quot;&#x60;,     Code string           &#x60;json:\&quot;code,optional\&quot;&#x60;,     Name string           &#x60;json:\&quot;name,optional\&quot;&#x60;,     Subject string &#x60;json:\&quot;subject,optional\&quot;&#x60;,     Body string &#x60;json:\&quot;body,optional\&quot;&#x60;,    }
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppInfoGetList (
appInfoGetListReq: AppInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppInfoGetList200Response>>(localVarPath, appInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个应用的完整配置信息，包括基本信息、试用策略、状态等。用于应用编辑页面加载初始数据，或查看应用详细配置。
* @summary 获取应用详情
* @param {AppInfoGetOneReq} appInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppInfoGetOne (
appInfoGetOneReq: AppInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppCoreGetOne200Response>>(localVarPath, appInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改应用配置，包括名称、类型、试用时长、状态等，支持部分更新。应用上架/下架通过状态字段控制，上架后租户可申请绑定。
* @summary 更新应用
* @param {AppInfo} appInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppInfoUpdate (
appInfo: AppInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, appInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据平台应用 ID 动态调用微信服务端接口生成小程序 URL Link，用于微信外扫码或 H5 页面拉起小程序。
* @summary 获取微信小程序 URL Link
* @param {AppWxMiniGetUrlLinkReq} appWxMiniGetUrlLinkReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemAppInfoWxMiniGetUrlLink (
appWxMiniGetUrlLinkReq: AppWxMiniGetUrlLinkReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/app/info/wx-mini/get-url-link`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAppInfoWxMiniGetUrlLink200Response>>(localVarPath, appWxMiniGetUrlLinkReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemAppInfoCreate operation in SystemAppInfoApi.
 */
export interface SystemAppInfoApiPostApiV1SystemAppInfoCreateRequest {
    readonly appInfo: AppInfo
}

/**
 * Request parameters for postApiV1SystemAppInfoDelete operation in SystemAppInfoApi.
 */
export interface SystemAppInfoApiPostApiV1SystemAppInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemAppInfoGetList operation in SystemAppInfoApi.
 */
export interface SystemAppInfoApiPostApiV1SystemAppInfoGetListRequest {
    /**
     *     AppPolicyGetOneReq{,        AppID int64 &#x60;json:\&quot;appID,string\&quot;&#x60;,        Code string &#x60;json:\&quot;code\&quot;&#x60;,    },    AppPolicy{,     ID int64 &#x60;json:\&quot;id,string,optional\&quot;&#x60;,     AppID int64 &#x60;json:\&quot;appID,string,optional\&quot;&#x60;,     Code string           &#x60;json:\&quot;code,optional\&quot;&#x60;,     Name string           &#x60;json:\&quot;name,optional\&quot;&#x60;,     Subject string &#x60;json:\&quot;subject,optional\&quot;&#x60;,     Body string &#x60;json:\&quot;body,optional\&quot;&#x60;,    }
     */
    readonly appInfoGetListReq: AppInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemAppInfoGetOne operation in SystemAppInfoApi.
 */
export interface SystemAppInfoApiPostApiV1SystemAppInfoGetOneRequest {
    readonly appInfoGetOneReq: AppInfoGetOneReq
}

/**
 * Request parameters for postApiV1SystemAppInfoUpdate operation in SystemAppInfoApi.
 */
export interface SystemAppInfoApiPostApiV1SystemAppInfoUpdateRequest {
    readonly appInfo: AppInfo
}

/**
 * Request parameters for postApiV1SystemAppInfoWxMiniGetUrlLink operation in SystemAppInfoApi.
 */
export interface SystemAppInfoApiPostApiV1SystemAppInfoWxMiniGetUrlLinkRequest {
    readonly appWxMiniGetUrlLinkReq: AppWxMiniGetUrlLinkReq
}
