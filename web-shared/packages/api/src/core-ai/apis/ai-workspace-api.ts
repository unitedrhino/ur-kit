import type { PostApiV1AiSessionWorkspaceFork200Response } from '../models';
import type { PostApiV1AiSessionWorkspaceGetList200Response } from '../models';
import type { PostApiV1AiSessionWorkspaceGetOne200Response } from '../models';
import type { WorkspaceSessionForkReq } from '../models';
import type { WorkspaceSessionListReq } from '../models';
import type { WorkspaceSessionReadReq } from '../models';
import type { WorkspaceSessionUpdateReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiWorkspaceApi - axios parameter creator
 */

/**
* 业务说明：基于来源新建会话，强制绑定当前用户、企业、应用、项目及权限范围，用户完成状态独立于设备生命周期。
* @summary 基于来源新建会话
* @param {WorkspaceSessionForkReq} workspaceSessionForkReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionWorkspaceFork (
workspaceSessionForkReq: WorkspaceSessionForkReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/workspace/fork`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionWorkspaceFork200Response>>(localVarPath, workspaceSessionForkReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询工作区会话，强制绑定当前用户、企业、应用、项目及权限范围，用户完成状态独立于设备生命周期。
* @summary 查询工作区会话
* @param {WorkspaceSessionListReq} workspaceSessionListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionWorkspaceGetList (
workspaceSessionListReq: WorkspaceSessionListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/workspace/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionWorkspaceGetList200Response>>(localVarPath, workspaceSessionListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：读取工作区会话，强制绑定当前用户、企业、应用、项目及权限范围，用户完成状态独立于设备生命周期。
* @summary 读取工作区会话
* @param {WorkspaceSessionReadReq} workspaceSessionReadReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionWorkspaceGetOne (
workspaceSessionReadReq: WorkspaceSessionReadReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/workspace/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionWorkspaceGetOne200Response>>(localVarPath, workspaceSessionReadReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：整理工作区会话，强制绑定当前用户、企业、应用、项目及权限范围，用户完成状态独立于设备生命周期。
* @summary 整理工作区会话
* @param {WorkspaceSessionUpdateReq} workspaceSessionUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSessionWorkspaceUpdate (
workspaceSessionUpdateReq: WorkspaceSessionUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/session/workspace/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiSessionWorkspaceFork200Response>>(localVarPath, workspaceSessionUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiSessionWorkspaceFork operation in AiWorkspaceApi.
 */
export interface AiWorkspaceApiPostApiV1AiSessionWorkspaceForkRequest {
    readonly workspaceSessionForkReq: WorkspaceSessionForkReq
}

/**
 * Request parameters for postApiV1AiSessionWorkspaceGetList operation in AiWorkspaceApi.
 */
export interface AiWorkspaceApiPostApiV1AiSessionWorkspaceGetListRequest {
    readonly workspaceSessionListReq: WorkspaceSessionListReq
}

/**
 * Request parameters for postApiV1AiSessionWorkspaceGetOne operation in AiWorkspaceApi.
 */
export interface AiWorkspaceApiPostApiV1AiSessionWorkspaceGetOneRequest {
    readonly workspaceSessionReadReq: WorkspaceSessionReadReq
}

/**
 * Request parameters for postApiV1AiSessionWorkspaceUpdate operation in AiWorkspaceApi.
 */
export interface AiWorkspaceApiPostApiV1AiSessionWorkspaceUpdateRequest {
    readonly workspaceSessionUpdateReq: WorkspaceSessionUpdateReq
}
