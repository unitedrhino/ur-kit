import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProductCategoryBatchImport200Response } from '../models';
import type { PostApiV1ThingsProjectCrudCreate200Response } from '../models';
import type { PostApiV1ThingsProtocolScriptBatchExport200Response } from '../models';
import type { PostApiV1ThingsProtocolScriptDebug200Response } from '../models';
import type { PostApiV1ThingsProtocolScriptGetList200Response } from '../models';
import type { PostApiV1ThingsProtocolScriptGetOne200Response } from '../models';
import type { ProtocolScript } from '../models';
import type { ProtocolScriptDebugReq } from '../models';
import type { ProtocolScriptExportReq } from '../models';
import type { ProtocolScriptGetListReq } from '../models';
import type { ProtocolScriptImportReq } from '../models';
import type { WithIDStr } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProtocolScriptApi - axios parameter creator
 */

/**
* 将选定的协议脚本导出为ZIP压缩包，包含脚本JSON定义文件。用于备份或跨环境迁移脚本配置。
* @summary 批量导出协议脚本
* @param {ProtocolScriptExportReq} protocolScriptExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptBatchExport (
protocolScriptExportReq: ProtocolScriptExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/batch-export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolScriptBatchExport200Response>>(localVarPath, protocolScriptExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 从ZIP压缩包批量导入协议脚本，压缩包需包含脚本JSON定义文件。用于批量部署或迁移脚本配置。
* @summary 批量导入协议脚本
* @param {ProtocolScriptImportReq} protocolScriptImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptBatchImport (
protocolScriptImportReq: ProtocolScriptImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/batch-import`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCategoryBatchImport200Response>>(localVarPath, protocolScriptImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 创建协议脚本用于自定义设备消息处理逻辑。支持上行（设备到平台）和下行（平台到设备）方向，可设置触发时机（before/after）、触发类型（property/event/action）。脚本内容为JavaScript代码。
* @summary 新增协议脚本
* @param {ProtocolScript} protocolScript
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptCreate (
protocolScript: ProtocolScript,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProjectCrudCreate200Response>>(localVarPath, protocolScript, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 在隔离环境中运行脚本进行调试，传入模拟的请求消息和可选的响应消息，返回脚本处理后的输出和执行日志。用于脚本开发阶段验证逻辑正确性。
* @summary 协议脚本调试
* @param {ProtocolScriptDebugReq} protocolScriptDebugReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptDebug (
protocolScriptDebugReq: ProtocolScriptDebugReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/debug`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolScriptDebug200Response>>(localVarPath, protocolScriptDebugReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除协议脚本定义。删除后关联此脚本的设备将不再执行该脚本逻辑，设备消息处理恢复默认行为。
* @summary 删除协议脚本
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptDelete (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询协议脚本列表，支持按触发方向、触发时机、触发类型、状态等过滤。返回脚本基本信息，不含代码内容。
* @summary 获取协议脚本列表
* @param {ProtocolScriptGetListReq} protocolScriptGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptGetList (
protocolScriptGetListReq: ProtocolScriptGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolScriptGetList200Response>>(localVarPath, protocolScriptGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询单个协议脚本的完整信息，包括脚本代码内容。用于脚本编辑或调试时查看完整定义。
* @summary 获取协议脚本详情
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptGetOne (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolScriptGetOne200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改协议脚本的配置或代码内容。可更新脚本名称、触发条件、脚本代码、启用状态等。修改后立即生效，影响关联设备的消息处理。
* @summary 更新协议脚本
* @param {ProtocolScript} protocolScript
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolScriptUpdate (
protocolScript: ProtocolScript,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/script/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, protocolScript, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProtocolScriptBatchExport operation in ThingsProtocolScriptApi.
 */
export interface ThingsProtocolScriptApiPostApiV1ThingsProtocolScriptBatchExportRequest {
    readonly protocolScriptExportReq: ProtocolScriptExportReq
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptBatchImport operation in ThingsProtocolScriptApi.
 */
export interface ThingsProtocolScriptApiPostApiV1ThingsProtocolScriptBatchImportRequest {
    readonly protocolScriptImportReq: ProtocolScriptImportReq
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptCreate operation in ThingsProtocolScriptApi.
 */
export interface ThingsProtocolScriptApiPostApiV1ThingsProtocolScriptCreateRequest {
    readonly protocolScript: ProtocolScript
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptDebug operation in ThingsProtocolScriptApi.
 */
export interface ThingsProtocolScriptApiPostApiV1ThingsProtocolScriptDebugRequest {
    readonly protocolScriptDebugReq: ProtocolScriptDebugReq
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptDelete operation in ThingsProtocolScriptApi.
 */
export interface ThingsProtocolScriptApiPostApiV1ThingsProtocolScriptDeleteRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptGetList operation in ThingsProtocolScriptApi.
 */
export interface ThingsProtocolScriptApiPostApiV1ThingsProtocolScriptGetListRequest {
    readonly protocolScriptGetListReq: ProtocolScriptGetListReq
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptGetOne operation in ThingsProtocolScriptApi.
 */
export interface ThingsProtocolScriptApiPostApiV1ThingsProtocolScriptGetOneRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1ThingsProtocolScriptUpdate operation in ThingsProtocolScriptApi.
 */
export interface ThingsProtocolScriptApiPostApiV1ThingsProtocolScriptUpdateRequest {
    readonly protocolScript: ProtocolScript
}
