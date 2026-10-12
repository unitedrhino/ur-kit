import type { AlarmToolDevSessionReq } from '../models';
import type { PostApiV1ThingsAlarmAiToolSession200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsAlarmAiApi - axios parameter creator
 */

/**
* 为项目幂等初始化告警 AI 判断工具开发 clone【含场景化提示词与项目记忆】，返回 cloneID 供 AI 工具开发会话使用
* @summary 告警工具开发会话初始化
* @param {AlarmToolDevSessionReq} alarmToolDevSessionReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsAlarmAiToolSession (
alarmToolDevSessionReq: AlarmToolDevSessionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/alarm/ai/tool-session`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAlarmAiToolSession200Response>>(localVarPath, alarmToolDevSessionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsAlarmAiToolSession operation in ThingsAlarmAiApi.
 */
export interface ThingsAlarmAiApiPostApiV1ThingsAlarmAiToolSessionRequest {
    readonly alarmToolDevSessionReq: AlarmToolDevSessionReq
}
