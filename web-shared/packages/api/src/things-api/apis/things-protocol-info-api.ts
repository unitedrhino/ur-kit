import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsProtocolInfoGetList200Response } from '../models';
import type { PostApiV1ThingsProtocolInfoGetOne200Response } from '../models';
import type { ProtocolInfo } from '../models';
import type { ProtocolInfoGetListReq } from '../models';
import type { WithID } from '../models';
import type { WithIDOrCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProtocolInfoApi - axios parameter creator
 */

/**
* 创建新的设备接入协议定义，包括协议类型（MQTT/TCP/UDP）、传输配置、字段定义等。协议定义后可关联产品实现设备接入，支持配置字段、产品字段、设备字段三级定义。
* @summary 新增自定义协议
* @param {ProtocolInfo} protocolInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolInfoCreate (
protocolInfo: ProtocolInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, protocolInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除协议定义，会检查是否有产品正在使用该协议。已关联产品的协议无法直接删除，需先解除产品关联。
* @summary 删除自定义协议
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询系统中所有协议定义，支持按协议类型、传输协议、名称等过滤。返回协议完整信息包括配置字段定义。
* @summary 获取自定义协议信息列表
* @param {ProtocolInfoGetListReq} protocolInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolInfoGetList (
protocolInfoGetListReq: ProtocolInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolInfoGetList200Response>>(localVarPath, protocolInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询单个协议的完整定义，包括所有配置字段、产品字段、设备字段的详细规格。支持按ID或Code查询。
* @summary 获取自定义协议详情
* @param {WithIDOrCode} withIDOrCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolInfoGetOne (
withIDOrCode: WithIDOrCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolInfoGetOne200Response>>(localVarPath, withIDOrCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改协议的基本信息和字段定义，已关联产品的协议修改需谨慎。支持修改协议名称、描述、端点配置、字段列表等。
* @summary 更新自定义协议
* @param {ProtocolInfo} protocolInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolInfoUpdate (
protocolInfo: ProtocolInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, protocolInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProtocolInfoCreate operation in ThingsProtocolInfoApi.
 */
export interface ThingsProtocolInfoApiPostApiV1ThingsProtocolInfoCreateRequest {
    readonly protocolInfo: ProtocolInfo
}

/**
 * Request parameters for postApiV1ThingsProtocolInfoDelete operation in ThingsProtocolInfoApi.
 */
export interface ThingsProtocolInfoApiPostApiV1ThingsProtocolInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsProtocolInfoGetList operation in ThingsProtocolInfoApi.
 */
export interface ThingsProtocolInfoApiPostApiV1ThingsProtocolInfoGetListRequest {
    readonly protocolInfoGetListReq: ProtocolInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsProtocolInfoGetOne operation in ThingsProtocolInfoApi.
 */
export interface ThingsProtocolInfoApiPostApiV1ThingsProtocolInfoGetOneRequest {
    readonly withIDOrCode: WithIDOrCode
}

/**
 * Request parameters for postApiV1ThingsProtocolInfoUpdate operation in ThingsProtocolInfoApi.
 */
export interface ThingsProtocolInfoApiPostApiV1ThingsProtocolInfoUpdateRequest {
    readonly protocolInfo: ProtocolInfo
}
