import type { GetApiV1ImCallActive200Response } from '../models';
import type { ImCallSignalReq } from '../models';
import type { PostApiV1ImCallSignal200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ImCallApi - axios parameter creator
 */

/**
* 业务说明：查询指定群聊当前是否有进行中的群通话，用于前端进入群聊时补拉通话横幅（离线期间错过的 group.state 事件）。
* @summary 查询群通话进行状态
* @param {number} [bodyParam.conversationId]  群聊会话 ID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1ImCallActive (bodyParam: { conversationId: number; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/call/active`;
        if ((bodyParam as Record<string, unknown>)['conversationId'] !== undefined) {
            localVarQueryParameter['conversationId'] = (bodyParam as Record<string, unknown>)['conversationId'];
        }
    return requestClient.get<ExtractDataType<GetApiV1ImCallActive200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：音视频通话上行信令统一入口，按 type 分发：call_invite 发起 1:1 通话、call_accept 接听、call_reject 拒接、call_cancel 取消、call_end 挂断、call_heartbeat 通话中心跳（15s 一次）、group_invite 发起群通话（上限 9 人）、group_join 加入、group_leave 离开、media_state 静音/关摄像头同步。媒体由前端直连 ZLMediaKit 推拉流，本接口只负责状态机与通知扇出。
* @summary 通话信令统一入口
* @param {ImCallSignalReq} imCallSignalReq  ImCallSignalReq 通话信令请求（音视频通话，type 决定语义）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ImCallSignal (
imCallSignalReq: ImCallSignalReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/im/call/signal`;
    return requestClient.post<ExtractDataType<PostApiV1ImCallSignal200Response>>(localVarPath, imCallSignalReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for getApiV1ImCallActive operation in ImCallApi.
 */
export interface ImCallApiGetApiV1ImCallActiveRequest {
    /**
     *  群聊会话 ID
     */
    readonly conversationId: number
}

/**
 * Request parameters for postApiV1ImCallSignal operation in ImCallApi.
 */
export interface ImCallApiPostApiV1ImCallSignalRequest {
    /**
     *  ImCallSignalReq 通话信令请求（音视频通话，type 决定语义）
     */
    readonly imCallSignalReq: ImCallSignalReq
}
