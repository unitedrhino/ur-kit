import type { ControlCommonReq } from '../models';
import type { ControlListenReq } from '../models';
import type { PostApiV1AiControlAbort200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiControlApi - axios parameter creator
 */

/**
* 业务说明：中断正在进行中的AI对话或语音播放，立即停止LLM推理和TTS播放。用户打断场景使用，如用户发现AI回答错误或不想继续听取。中断后可重新发起对话，保持会话上下文。
* @summary 中断当前对话
* @param {ControlCommonReq} controlCommonReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiControlAbort (
controlCommonReq: ControlCommonReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/control/abort`;
    return requestClient.post<ExtractDataType<PostApiV1AiControlAbort200Response>>(localVarPath, controlCommonReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：结束当前的语音会话，释放会话资源，保存对话记录。结束后会话标记为已结束状态，不再接受新消息。用于用户主动结束语音对话、挂断等场景。正常结束后服务端发送会话关闭通知。
* @summary 结束语音会话
* @param {ControlCommonReq} controlCommonReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiControlGoodbye (
controlCommonReq: ControlCommonReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/control/goodbye`;
    return requestClient.post<ExtractDataType<PostApiV1AiControlAbort200Response>>(localVarPath, controlCommonReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：启动语音会话的监听模式，等待用户语音输入。客户端可指定采样率、声道数、帧时长等音频参数。监听启动后服务端开始VAD检测，检测到语音后触发ASR转文字，再进行对话处理。用于语音对话开场。
* @summary 开始语音监听
* @param {ControlListenReq} controlListenReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiControlListen (
controlListenReq: ControlListenReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/control/listen`;
    return requestClient.post<ExtractDataType<PostApiV1AiControlAbort200Response>>(localVarPath, controlListenReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiControlAbort operation in AiControlApi.
 */
export interface AiControlApiPostApiV1AiControlAbortRequest {
    readonly controlCommonReq: ControlCommonReq
}

/**
 * Request parameters for postApiV1AiControlGoodbye operation in AiControlApi.
 */
export interface AiControlApiPostApiV1AiControlGoodbyeRequest {
    readonly controlCommonReq: ControlCommonReq
}

/**
 * Request parameters for postApiV1AiControlListen operation in AiControlApi.
 */
export interface AiControlApiPostApiV1AiControlListenRequest {
    readonly controlListenReq: ControlListenReq
}
