import type { AiTaskToolSessionReq } from '../models';
import type { PostApiV1ThingsRuleEngineAiTaskToolSession200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsRuleEngineAiTaskApi - axios parameter creator
 */

/**
* 业务说明：校验用户对项目的访问权限及分身组归属，幂等返回项目级工具开发分身，用于多轮对话开发和保存任务工具。
* @summary 初始化 AI 任务开发会话
* @param {AiTaskToolSessionReq} aiTaskToolSessionReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsRuleEngineAiTaskToolSession (
aiTaskToolSessionReq: AiTaskToolSessionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/rule-engine/ai-task/tool-session`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsRuleEngineAiTaskToolSession200Response>>(localVarPath, aiTaskToolSessionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsRuleEngineAiTaskToolSession operation in ThingsRuleEngineAiTaskApi.
 */
export interface ThingsRuleEngineAiTaskApiPostApiV1ThingsRuleEngineAiTaskToolSessionRequest {
    readonly aiTaskToolSessionReq: AiTaskToolSessionReq
}
