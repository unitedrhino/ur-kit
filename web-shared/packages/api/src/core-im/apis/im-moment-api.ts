import type { ImMomentCommentCreateHttpReq } from '../models';
import type { ImMomentCommentDeleteReq } from '../models';
import type { ImMomentCreateReq } from '../models';
import type { ImMomentDeleteReq } from '../models';
import type { ImMomentGetListReq } from '../models';
import type { ImMomentGetReq } from '../models';
import type { ImMomentLikeReq } from '../models';
import type { PostApiV1ImChatlogMarkRead200Response } from '../models';
import type { PostApiV1ImMomentCommentCreate200Response } from '../models';
import type { PostApiV1ImMomentGet200Response } from '../models';
import type { PostApiV1ImMomentLike200Response } from '../models';
import type { PostApiV1ImMomentList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ImMomentApi - axios parameter creator
 */

/**
* 业务说明：对指定动态发表评论，可 @ 其他用户，并向动态发布人推送评论通知。
* @summary 发表评论
* @param {ImMomentCommentCreateHttpReq} imMomentCommentCreateHttpReq  ImMomentCommentCreateHttpReq 发表评论请求（id 为动态 ID，content 为评论内容）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMomentCommentCreate (
imMomentCommentCreateHttpReq: ImMomentCommentCreateHttpReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/moment/comment/create`;
    return requestClient.post<ExtractDataType<PostApiV1ImMomentCommentCreate200Response>>(localVarPath, imMomentCommentCreateHttpReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除本人在指定动态下的评论。
* @summary 删除评论
* @param {ImMomentCommentDeleteReq} imMomentCommentDeleteReq  ImMomentCommentDeleteReq 删除评论请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMomentCommentDelete (
imMomentCommentDeleteReq: ImMomentCommentDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/moment/comment/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imMomentCommentDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：发布朋友圈动态，支持文本与多媒体内容，可设置可见范围（公开/项目/指定人）并 @ 指定用户。
* @summary 发布动态
* @param {ImMomentCreateReq} imMomentCreateReq  ImMomentCreateReq 发布动态请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMomentCreate (
imMomentCreateReq: ImMomentCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/moment/create`;
    return requestClient.post<ExtractDataType<PostApiV1ImMomentCommentCreate200Response>>(localVarPath, imMomentCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除本人发布的朋友圈动态。
* @summary 删除动态
* @param {ImMomentDeleteReq} imMomentDeleteReq  ImMomentDeleteReq 删除动态请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMomentDelete (
imMomentDeleteReq: ImMomentDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/moment/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ImChatlogMarkRead200Response>>(localVarPath, imMomentDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按动态 ID 查询详情及评论列表。
* @summary 获取动态详情
* @param {ImMomentGetReq} imMomentGetReq  ImMomentGetReq 获取动态详情请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMomentGet (
imMomentGetReq: ImMomentGetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/moment/get`;
    return requestClient.post<ExtractDataType<PostApiV1ImMomentGet200Response>>(localVarPath, imMomentGetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：对指定动态点赞，返回最新点赞数，并向动态发布人推送点赞通知。
* @summary 点赞动态
* @param {ImMomentLikeReq} imMomentLikeReq  ImMomentLikeReq 点赞/取消点赞请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMomentLike (
imMomentLikeReq: ImMomentLikeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/moment/like`;
    return requestClient.post<ExtractDataType<PostApiV1ImMomentLike200Response>>(localVarPath, imMomentLikeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户可见的朋友圈动态列表，支持按发布人、项目过滤。
* @summary 查询动态列表
* @param {ImMomentGetListReq} imMomentGetListReq  ImMomentGetListReq 查询动态列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMomentList (
imMomentGetListReq: ImMomentGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/moment/list`;
    return requestClient.post<ExtractDataType<PostApiV1ImMomentList200Response>>(localVarPath, imMomentGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：取消对指定动态的点赞，返回最新点赞数。
* @summary 取消点赞动态
* @param {ImMomentLikeReq} imMomentLikeReq  ImMomentLikeReq 点赞/取消点赞请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImMomentUnlike (
imMomentLikeReq: ImMomentLikeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/moment/unlike`;
    return requestClient.post<ExtractDataType<PostApiV1ImMomentLike200Response>>(localVarPath, imMomentLikeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ImMomentCommentCreate operation in ImMomentApi.
 */
export interface ImMomentApiPostApiV1ImMomentCommentCreateRequest {
    /**
     *  ImMomentCommentCreateHttpReq 发表评论请求（id 为动态 ID，content 为评论内容）
     */
    readonly imMomentCommentCreateHttpReq: ImMomentCommentCreateHttpReq
}

/**
 * Request parameters for postApiV1ImMomentCommentDelete operation in ImMomentApi.
 */
export interface ImMomentApiPostApiV1ImMomentCommentDeleteRequest {
    /**
     *  ImMomentCommentDeleteReq 删除评论请求
     */
    readonly imMomentCommentDeleteReq: ImMomentCommentDeleteReq
}

/**
 * Request parameters for postApiV1ImMomentCreate operation in ImMomentApi.
 */
export interface ImMomentApiPostApiV1ImMomentCreateRequest {
    /**
     *  ImMomentCreateReq 发布动态请求
     */
    readonly imMomentCreateReq: ImMomentCreateReq
}

/**
 * Request parameters for postApiV1ImMomentDelete operation in ImMomentApi.
 */
export interface ImMomentApiPostApiV1ImMomentDeleteRequest {
    /**
     *  ImMomentDeleteReq 删除动态请求
     */
    readonly imMomentDeleteReq: ImMomentDeleteReq
}

/**
 * Request parameters for postApiV1ImMomentGet operation in ImMomentApi.
 */
export interface ImMomentApiPostApiV1ImMomentGetRequest {
    /**
     *  ImMomentGetReq 获取动态详情请求
     */
    readonly imMomentGetReq: ImMomentGetReq
}

/**
 * Request parameters for postApiV1ImMomentLike operation in ImMomentApi.
 */
export interface ImMomentApiPostApiV1ImMomentLikeRequest {
    /**
     *  ImMomentLikeReq 点赞/取消点赞请求
     */
    readonly imMomentLikeReq: ImMomentLikeReq
}

/**
 * Request parameters for postApiV1ImMomentList operation in ImMomentApi.
 */
export interface ImMomentApiPostApiV1ImMomentListRequest {
    /**
     *  ImMomentGetListReq 查询动态列表请求
     */
    readonly imMomentGetListReq: ImMomentGetListReq
}

/**
 * Request parameters for postApiV1ImMomentUnlike operation in ImMomentApi.
 */
export interface ImMomentApiPostApiV1ImMomentUnlikeRequest {
    /**
     *  ImMomentLikeReq 点赞/取消点赞请求
     */
    readonly imMomentLikeReq: ImMomentLikeReq
}
