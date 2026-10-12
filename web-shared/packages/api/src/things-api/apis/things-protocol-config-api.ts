import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsProtocolConfigGetList200Response } from '../models';
import type { PostApiV1ThingsProtocolConfigGetOne200Response } from '../models';
import type { ProtocolConfig } from '../models';
import type { ProtocolConfigGetListReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProtocolConfigApi - axios parameter creator
 */

/**
* 为协议创建具体的配置实例，关联协议ID并填写配置参数键值对。同一协议可以有多个配置实例，用于不同产品或场景。
* @summary 创建协议配置
* @param {ProtocolConfig} protocolConfig
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolConfigCreate (
protocolConfig: ProtocolConfig,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/config/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, protocolConfig, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除协议配置实例。已被产品使用的配置无法删除，需先解除产品关联。
* @summary 删除协议配置
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolConfigDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/config/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询协议配置实例列表，支持按协议ID或协议Code过滤。返回配置的ID、描述、参数内容等。
* @summary 获取协议配置列表
* @param {ProtocolConfigGetListReq} protocolConfigGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolConfigGetList (
protocolConfigGetListReq: ProtocolConfigGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/config/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolConfigGetList200Response>>(localVarPath, protocolConfigGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询单个协议配置实例的完整信息，包括关联的协议ID和所有配置参数。
* @summary 获取协议配置详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolConfigGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/config/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolConfigGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改协议配置实例的参数内容，支持更新描述和配置键值对。配置修改后已关联产品需重新适配。
* @summary 更新协议配置
* @param {ProtocolConfig} protocolConfig
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolConfigUpdate (
protocolConfig: ProtocolConfig,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/config/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, protocolConfig, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProtocolConfigCreate operation in ThingsProtocolConfigApi.
 */
export interface ThingsProtocolConfigApiPostApiV1ThingsProtocolConfigCreateRequest {
    readonly protocolConfig: ProtocolConfig
}

/**
 * Request parameters for postApiV1ThingsProtocolConfigDelete operation in ThingsProtocolConfigApi.
 */
export interface ThingsProtocolConfigApiPostApiV1ThingsProtocolConfigDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsProtocolConfigGetList operation in ThingsProtocolConfigApi.
 */
export interface ThingsProtocolConfigApiPostApiV1ThingsProtocolConfigGetListRequest {
    readonly protocolConfigGetListReq: ProtocolConfigGetListReq
}

/**
 * Request parameters for postApiV1ThingsProtocolConfigGetOne operation in ThingsProtocolConfigApi.
 */
export interface ThingsProtocolConfigApiPostApiV1ThingsProtocolConfigGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsProtocolConfigUpdate operation in ThingsProtocolConfigApi.
 */
export interface ThingsProtocolConfigApiPostApiV1ThingsProtocolConfigUpdateRequest {
    readonly protocolConfig: ProtocolConfig
}
