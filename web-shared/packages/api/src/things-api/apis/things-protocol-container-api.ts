import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsProtocolContainerStatus200Response } from '../models';
import type { ProtocolContainerInstallReq } from '../models';
import type { ProtocolContainerOperateReq } from '../models';
import type { ProtocolContainerUninstallReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProtocolContainerApi - axios parameter creator
 */

/**
* 根据协议镜像配置创建并启动 Docker 容器。
* @summary 安装协议容器
* @param {ProtocolContainerInstallReq} protocolContainerInstallReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolContainerInstall (
protocolContainerInstallReq: ProtocolContainerInstallReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/container/install`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, protocolContainerInstallReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 实时查询协议 Docker 容器的运行状态，包括容器ID、镜像、状态等。
* @summary 查询协议容器状态
* @param {ProtocolContainerOperateReq} protocolContainerOperateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolContainerStatus (
protocolContainerOperateReq: ProtocolContainerOperateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/container/status`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProtocolContainerStatus200Response>>(localVarPath, protocolContainerOperateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 停止运行中的协议 Docker 容器。
* @summary 停止协议容器
* @param {ProtocolContainerOperateReq} protocolContainerOperateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolContainerStop (
protocolContainerOperateReq: ProtocolContainerOperateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/container/stop`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, protocolContainerOperateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 停止并删除协议 Docker 容器，可选同时删除本地镜像。
* @summary 卸载协议容器
* @param {ProtocolContainerUninstallReq} protocolContainerUninstallReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolContainerUninstall (
protocolContainerUninstallReq: ProtocolContainerUninstallReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/container/uninstall`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, protocolContainerUninstallReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 拉取新镜像并重启协议容器，失败时自动回退到旧版本。
* @summary 更新协议容器
* @param {ProtocolContainerInstallReq} protocolContainerInstallReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProtocolContainerUpdate (
protocolContainerInstallReq: ProtocolContainerInstallReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/protocol/container/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, protocolContainerInstallReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProtocolContainerInstall operation in ThingsProtocolContainerApi.
 */
export interface ThingsProtocolContainerApiPostApiV1ThingsProtocolContainerInstallRequest {
    readonly protocolContainerInstallReq: ProtocolContainerInstallReq
}

/**
 * Request parameters for postApiV1ThingsProtocolContainerStatus operation in ThingsProtocolContainerApi.
 */
export interface ThingsProtocolContainerApiPostApiV1ThingsProtocolContainerStatusRequest {
    readonly protocolContainerOperateReq: ProtocolContainerOperateReq
}

/**
 * Request parameters for postApiV1ThingsProtocolContainerStop operation in ThingsProtocolContainerApi.
 */
export interface ThingsProtocolContainerApiPostApiV1ThingsProtocolContainerStopRequest {
    readonly protocolContainerOperateReq: ProtocolContainerOperateReq
}

/**
 * Request parameters for postApiV1ThingsProtocolContainerUninstall operation in ThingsProtocolContainerApi.
 */
export interface ThingsProtocolContainerApiPostApiV1ThingsProtocolContainerUninstallRequest {
    readonly protocolContainerUninstallReq: ProtocolContainerUninstallReq
}

/**
 * Request parameters for postApiV1ThingsProtocolContainerUpdate operation in ThingsProtocolContainerApi.
 */
export interface ThingsProtocolContainerApiPostApiV1ThingsProtocolContainerUpdateRequest {
    readonly protocolContainerInstallReq: ProtocolContainerInstallReq
}
