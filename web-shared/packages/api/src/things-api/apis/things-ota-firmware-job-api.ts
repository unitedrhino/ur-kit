import type { OtaFirmwareJobGetListReq } from '../models';
import type { OtaFirmwareJobInfo } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsOtaFirmwareJobGetList200Response } from '../models';
import type { PostApiV1ThingsOtaFirmwareJobGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsOtaFirmwareJobApi - axios parameter creator
 */

/**
* 业务说明：基于OTA升级包创建批量升级任务批次。支持静态升级（指定设备列表）和动态升级（持续检查设备是否满足升级条件）。可配置升级策略（重试次数、超时时间、覆盖模式等）、升级范围（全量/定向/灰度）以及推送方式。创建成功后返回批次ID，用于后续管理和追踪升级进度。
* @summary 创建升级任务
* @param {OtaFirmwareJobInfo} otaFirmwareJobInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareJobCreate (
otaFirmwareJobInfo: OtaFirmwareJobInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/job/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, otaFirmwareJobInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定OTA升级包关联的所有升级任务批次列表。返回批次基本信息（状态、类型、升级策略、升级范围等），支持分页查询。用于管理界面展示升级任务执行情况和进度追踪。
* @summary 获取升级包下的升级任务批次列表
* @param {OtaFirmwareJobGetListReq} otaFirmwareJobGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareJobGetList (
otaFirmwareJobGetListReq: OtaFirmwareJobGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/job/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsOtaFirmwareJobGetList200Response>>(localVarPath, otaFirmwareJobGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取单个OTA升级任务批次的完整配置信息。包括升级策略（重试间隔、重试次数、超时时间）、升级范围（全量/定向/灰度/分组）、动态/静态模式参数、推送配置、目标设备版本要求等。用于批次详情查看和配置确认。
* @summary 查询指定升级批次的详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareJobGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/job/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsOtaFirmwareJobGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改OTA升级任务批次的配置参数。可调整升级策略（重试次数、超时时间）、推送配置、目标版本范围等。注意：批次状态为【执行中】或【已完成】时部分参数不可修改。用于任务执行前的配置调整和执行中的策略优化。
* @summary 更新升级批次
* @param {OtaFirmwareJobInfo} otaFirmwareJobInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareJobUpdate (
otaFirmwareJobInfo: OtaFirmwareJobInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/job/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, otaFirmwareJobInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsOtaFirmwareJobCreate operation in ThingsOtaFirmwareJobApi.
 */
export interface ThingsOtaFirmwareJobApiPostApiV1ThingsOtaFirmwareJobCreateRequest {
    readonly otaFirmwareJobInfo: OtaFirmwareJobInfo
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareJobGetList operation in ThingsOtaFirmwareJobApi.
 */
export interface ThingsOtaFirmwareJobApiPostApiV1ThingsOtaFirmwareJobGetListRequest {
    readonly otaFirmwareJobGetListReq: OtaFirmwareJobGetListReq
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareJobGetOne operation in ThingsOtaFirmwareJobApi.
 */
export interface ThingsOtaFirmwareJobApiPostApiV1ThingsOtaFirmwareJobGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareJobUpdate operation in ThingsOtaFirmwareJobApi.
 */
export interface ThingsOtaFirmwareJobApiPostApiV1ThingsOtaFirmwareJobUpdateRequest {
    readonly otaFirmwareJobInfo: OtaFirmwareJobInfo
}
