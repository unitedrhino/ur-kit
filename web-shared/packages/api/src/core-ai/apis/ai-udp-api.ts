import type { PostApiV1AiUdpTokenCreate200Response } from '../models';
import type { UdpTokenCreateReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiUdpApi - axios parameter creator
 */

/**
* 业务说明：为语音对话创建UDP会话令牌，返回加密令牌、AES密钥、随机数、UDP服务器地址端口、会话ID等。客户端使用令牌建立UDP连接，进行实时语音交互。令牌有过期时间，需在有效期内使用。用于语音对话场景的连接建立。
* @summary 创建UDP会话令牌
* @param {UdpTokenCreateReq} udpTokenCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiUdpTokenCreate (
udpTokenCreateReq: UdpTokenCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/udp/token/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiUdpTokenCreate200Response>>(localVarPath, udpTokenCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiUdpTokenCreate operation in AiUdpApi.
 */
export interface AiUdpApiPostApiV1AiUdpTokenCreateRequest {
    readonly udpTokenCreateReq: UdpTokenCreateReq
}
