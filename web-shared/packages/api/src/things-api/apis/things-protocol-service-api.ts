import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProtocolServiceGetList200Response } from '../models';
import type { ProtocolServiceGetListReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProtocolServiceApi - axios parameter creator
 */

/**
* 从协议服务注册列表中移除指定的协议服务实例。协议服务实例由dgsvr自动注册，手动删除后如服务仍运行会再次注册。
* @summary 删除自定义协议服务器
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolServiceDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/service/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询指定协议下已注册的服务实例列表，包括服务IP、端口、状态、注册时间等。用于监控协议服务的运行状态。
* @summary 获取自定义协议服务器信息列表
* @param {ProtocolServiceGetListReq} protocolServiceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolServiceGetList (
protocolServiceGetListReq: ProtocolServiceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/service/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolServiceGetList200Response>>(localVarPath, protocolServiceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProtocolServiceDelete operation in ThingsProtocolServiceApi.
 */
export interface ThingsProtocolServiceApiPostApiV1ThingsProtocolServiceDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsProtocolServiceGetList operation in ThingsProtocolServiceApi.
 */
export interface ThingsProtocolServiceApiPostApiV1ThingsProtocolServiceGetListRequest {
    readonly protocolServiceGetListReq: ProtocolServiceGetListReq
}
