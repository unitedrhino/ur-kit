import type { NotifyNews } from '../models';
import type { NotifyNewsListReq } from '../models';
import type { PostApiV1SystemAgreementCreate200Response } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemNotifyNewsInfo200Response } from '../models';
import type { PostApiV1SystemNotifyNewsList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemNotifyNewsApi - axios parameter creator
 */

/**
* 业务说明：创建新的资讯文章，包括标题、封面图、正文内容（HTML格式）、摘要、跳转链接、发布时间、过期时间、状态等属性。用于发布系统公告、新闻动态、帮助文档等内容，支持草稿和发布状态管理。
* @summary 创建资讯
* @param {NotifyNews} notifyNews  资讯信息
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNewsCreate (
notifyNews: NotifyNews,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/news/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementCreate200Response>>(localVarPath, notifyNews, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的资讯文章，删除后用户端将无法查看该资讯。用于清理过期或不再需要的资讯内容，管理员权限。
* @summary 删除资讯
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNewsDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/news/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据ID获取资讯文章的完整信息，包括标题、封面图、正文内容、摘要、跳转链接、发布状态、时间等所有字段。用于资讯编辑页面的数据加载或资讯详情页展示。
* @summary 获取资讯详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNewsInfo (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/news/info`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyNewsInfo200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询资讯文章列表，支持按标题模糊搜索、状态筛选、发布时间范围筛选。用于资讯管理页面的列表展示，管理员可查看所有状态的资讯（草稿、已发布、已下架）。
* @summary 获取资讯列表
* @param {NotifyNewsListReq} notifyNewsListReq  资讯列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNewsList (
notifyNewsListReq: NotifyNewsListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/news/list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemNotifyNewsList200Response>>(localVarPath, notifyNewsListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改资讯文章的内容或状态，包括标题、封面图、正文、摘要、跳转链接、发布时间、过期时间、状态等。支持从草稿状态发布、从已发布状态下架等状态流转操作。
* @summary 更新资讯
* @param {NotifyNews} notifyNews  资讯信息
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemNotifyNewsUpdate (
notifyNews: NotifyNews,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/notify/news/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, notifyNews, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemNotifyNewsCreate operation in SystemNotifyNewsApi.
 */
export interface SystemNotifyNewsApiPostApiV1SystemNotifyNewsCreateRequest {
    /**
     *  资讯信息
     */
    readonly notifyNews: NotifyNews
}

/**
 * Request parameters for postApiV1SystemNotifyNewsDelete operation in SystemNotifyNewsApi.
 */
export interface SystemNotifyNewsApiPostApiV1SystemNotifyNewsDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyNewsInfo operation in SystemNotifyNewsApi.
 */
export interface SystemNotifyNewsApiPostApiV1SystemNotifyNewsInfoRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemNotifyNewsList operation in SystemNotifyNewsApi.
 */
export interface SystemNotifyNewsApiPostApiV1SystemNotifyNewsListRequest {
    /**
     *  资讯列表请求
     */
    readonly notifyNewsListReq: NotifyNewsListReq
}

/**
 * Request parameters for postApiV1SystemNotifyNewsUpdate operation in SystemNotifyNewsApi.
 */
export interface SystemNotifyNewsApiPostApiV1SystemNotifyNewsUpdateRequest {
    /**
     *  资讯信息
     */
    readonly notifyNews: NotifyNews
}
