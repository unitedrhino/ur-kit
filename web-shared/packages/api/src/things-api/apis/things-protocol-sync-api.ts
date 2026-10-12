import type { CodeReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProtocolSyncDevice200Response } from '../models';
import type { ProtocolSyncDeviceReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProtocolSyncApi - axios parameter creator
 */

/**
* 触发协议级的设备数据同步，从第三方平台拉取指定产品下的设备信息。返回新增的设备ID列表。仅对支持同步功能的协议有效。
* @summary 设备同步(如果该协议不支持会返回不支持)
* @param {ProtocolSyncDeviceReq} protocolSyncDeviceReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolSyncDevice (
protocolSyncDeviceReq: ProtocolSyncDeviceReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/sync/device`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolSyncDevice200Response>>(localVarPath, protocolSyncDeviceReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 触发协议级的产品数据同步，从第三方平台拉取产品信息到本地。仅对支持同步功能的协议有效（isEnableSyncProduct=1），不支持同步的协议返回错误。
* @summary 产品同步(如果该协议不支持会返回不支持)
* @param {CodeReq} codeReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolSyncProduct (
codeReq: CodeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/sync/product`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, codeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProtocolSyncDevice operation in ThingsProtocolSyncApi.
 */
export interface ThingsProtocolSyncApiPostApiV1ThingsProtocolSyncDeviceRequest {
    readonly protocolSyncDeviceReq: ProtocolSyncDeviceReq
}

/**
 * Request parameters for postApiV1ThingsProtocolSyncProduct operation in ThingsProtocolSyncApi.
 */
export interface ThingsProtocolSyncApiPostApiV1ThingsProtocolSyncProductRequest {
    readonly codeReq: CodeReq
}
