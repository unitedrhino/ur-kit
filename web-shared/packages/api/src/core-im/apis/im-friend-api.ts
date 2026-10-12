import type { ImFriendApplyReq } from '../models';
import type { ImFriendDeleteReq } from '../models';
import type { ImFriendGetListReq } from '../models';
import type { ImFriendHandleReq } from '../models';
import type { ImFriendRequestGetListReq } from '../models';
import type { PostApiV1ImChannelBind200Response } from '../models';
import type { PostApiV1ImFriendApply200Response } from '../models';
import type { PostApiV1ImFriendGetList200Response } from '../models';
import type { PostApiV1ImFriendRequestGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ImFriendApi - axios parameter creator
 */

/**
* 业务说明：向指定用户发起好友申请，可附申请留言，申请通过后双方建立双向好友关系。
* @summary 发起好友申请
* @param {ImFriendApplyReq} imFriendApplyReq  ImFriendApplyReq 发起好友申请请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImFriendApply (
imFriendApplyReq: ImFriendApplyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/friend/apply`;
    return requestClient.post<ExtractDataType<PostApiV1ImFriendApply200Response>>(localVarPath, imFriendApplyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定好友，双向好友关系同时解除。
* @summary 删除好友
* @param {ImFriendDeleteReq} imFriendDeleteReq  ImFriendDeleteReq 删除好友请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImFriendDelete (
imFriendDeleteReq: ImFriendDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/friend/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ImChannelBind200Response>>(localVarPath, imFriendDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前用户的好友列表，含好友昵称、头像等用户资料。
* @summary 获取好友列表
* @param {ImFriendGetListReq} imFriendGetListReq  ImFriendGetListReq 获取好友列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImFriendGetList (
imFriendGetListReq: ImFriendGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/friend/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ImFriendGetList200Response>>(localVarPath, imFriendGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：被申请人处理好友申请，同意则双方成为好友，拒绝则申请关闭。
* @summary 处理好友申请
* @param {ImFriendHandleReq} imFriendHandleReq  ImFriendHandleReq 处理好友申请请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImFriendHandle (
imFriendHandleReq: ImFriendHandleReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/friend/handle`;
    return requestClient.post<ExtractDataType<PostApiV1ImChannelBind200Response>>(localVarPath, imFriendHandleReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询好友申请列表，支持按方向（我收到的/我发起的）与处理结果过滤，含双方用户资料。
* @summary 获取好友申请列表
* @param {ImFriendRequestGetListReq} imFriendRequestGetListReq  ImFriendRequestGetListReq 获取好友申请列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImFriendRequestGetList (
imFriendRequestGetListReq: ImFriendRequestGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/friend/request/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ImFriendRequestGetList200Response>>(localVarPath, imFriendRequestGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ImFriendApply operation in ImFriendApi.
 */
export interface ImFriendApiPostApiV1ImFriendApplyRequest {
    /**
     *  ImFriendApplyReq 发起好友申请请求
     */
    readonly imFriendApplyReq: ImFriendApplyReq
}

/**
 * Request parameters for postApiV1ImFriendDelete operation in ImFriendApi.
 */
export interface ImFriendApiPostApiV1ImFriendDeleteRequest {
    /**
     *  ImFriendDeleteReq 删除好友请求
     */
    readonly imFriendDeleteReq: ImFriendDeleteReq
}

/**
 * Request parameters for postApiV1ImFriendGetList operation in ImFriendApi.
 */
export interface ImFriendApiPostApiV1ImFriendGetListRequest {
    /**
     *  ImFriendGetListReq 获取好友列表请求
     */
    readonly imFriendGetListReq: ImFriendGetListReq
}

/**
 * Request parameters for postApiV1ImFriendHandle operation in ImFriendApi.
 */
export interface ImFriendApiPostApiV1ImFriendHandleRequest {
    /**
     *  ImFriendHandleReq 处理好友申请请求
     */
    readonly imFriendHandleReq: ImFriendHandleReq
}

/**
 * Request parameters for postApiV1ImFriendRequestGetList operation in ImFriendApi.
 */
export interface ImFriendApiPostApiV1ImFriendRequestGetListRequest {
    /**
     *  ImFriendRequestGetListReq 获取好友申请列表请求
     */
    readonly imFriendRequestGetListReq: ImFriendRequestGetListReq
}
