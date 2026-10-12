import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { ProtocolImagePullReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProtocolImageApi - axios parameter creator
 */

/**
* 拉取协议对应的 Docker 镜像到本地。若本地已有该镜像则直接返回成功。
* @summary 下载协议镜像
* @param {ProtocolImagePullReq} protocolImagePullReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolImagePull (
protocolImagePullReq: ProtocolImagePullReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/image/pull`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, protocolImagePullReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProtocolImagePull operation in ThingsProtocolImageApi.
 */
export interface ThingsProtocolImageApiPostApiV1ThingsProtocolImagePullRequest {
    readonly protocolImagePullReq: ProtocolImagePullReq
}
