import type { ImChannelBindReq } from '../models';
import type { ImChannelBindSetMuteReq } from '../models';
import type { ImChannelUnbindReq } from '../models';
import type { PostApiV1ImChannelBind200Response } from '../models';
import type { PostApiV1ImChannelGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ImChannelApi - axios parameter creator
 */

/**
* 业务说明：把渠道端点（如设备 {productID}:{deviceName}）绑定到当前用户，绑定后该用户消息将下行到端点，端点上行消息进入用户最近单聊。重复绑定幂等更新名称。
* @summary 绑定渠道端点
* @param {ImChannelBindReq} imChannelBindReq  &#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D; 渠道绑定（阶段 3：设备接入与渠道统一） &#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;, ImChannelBindReq 绑定渠道端点请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChannelBind (
imChannelBindReq: ImChannelBindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/channel/bind`;
    return requestClient.post<ExtractDataType<PostApiV1ImChannelBind200Response>>(localVarPath, imChannelBindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询当前用户绑定的全部渠道端点及免打扰状态。
* @summary 查询渠道绑定列表
* @param {object} body  Empty 空响应（无返回体的接口统一使用）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChannelGetList (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/channel/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ImChannelGetList200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设置渠道端点级免打扰（isMuted=1 后站内消息不再下行到该端点，不影响端点上行）。
* @summary 设置端点免打扰
* @param {ImChannelBindSetMuteReq} imChannelBindSetMuteReq  ImChannelBindSetMuteReq 设置端点级免打扰请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChannelSetMute (
imChannelBindSetMuteReq: ImChannelBindSetMuteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/channel/set-mute`;
    return requestClient.post<ExtractDataType<PostApiV1ImChannelBind200Response>>(localVarPath, imChannelBindSetMuteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：解除当前用户与渠道端点的绑定（仅本人可操作）。
* @summary 解绑渠道端点
* @param {ImChannelUnbindReq} imChannelUnbindReq  ImChannelUnbindReq 解绑渠道端点请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImChannelUnbind (
imChannelUnbindReq: ImChannelUnbindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/channel/unbind`;
    return requestClient.post<ExtractDataType<PostApiV1ImChannelBind200Response>>(localVarPath, imChannelUnbindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ImChannelBind operation in ImChannelApi.
 */
export interface ImChannelApiPostApiV1ImChannelBindRequest {
    /**
     *  &#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D; 渠道绑定（阶段 3：设备接入与渠道统一） &#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;&#x3D;, ImChannelBindReq 绑定渠道端点请求
     */
    readonly imChannelBindReq: ImChannelBindReq
}

/**
 * Request parameters for postApiV1ImChannelGetList operation in ImChannelApi.
 */
export interface ImChannelApiPostApiV1ImChannelGetListRequest {
    /**
     *  Empty 空响应（无返回体的接口统一使用）
     */
    readonly body: object
}

/**
 * Request parameters for postApiV1ImChannelSetMute operation in ImChannelApi.
 */
export interface ImChannelApiPostApiV1ImChannelSetMuteRequest {
    /**
     *  ImChannelBindSetMuteReq 设置端点级免打扰请求
     */
    readonly imChannelBindSetMuteReq: ImChannelBindSetMuteReq
}

/**
 * Request parameters for postApiV1ImChannelUnbind operation in ImChannelApi.
 */
export interface ImChannelApiPostApiV1ImChannelUnbindRequest {
    /**
     *  ImChannelUnbindReq 解绑渠道端点请求
     */
    readonly imChannelUnbindReq: ImChannelUnbindReq
}
