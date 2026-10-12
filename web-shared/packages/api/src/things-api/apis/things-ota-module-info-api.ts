import type { OtaModuleInfo } from '../models';
import type { OtaModuleInfoGetListReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsOtaModuleInfoGetList200Response } from '../models';
import type { PostApiV1ThingsOtaModuleInfoGetOne200Response } from '../models';
import type { WithID } from '../models';
import type { WithIDOrCode } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsOtaModuleInfoApi - axios parameter creator
 */

/**
* 业务说明：创建OTA升级模块定义。模块是产品的子组件，用于区分同一产品中不同可升级的部分（如主控模块、通信模块、传感器模块等）。创建模块后可关联多个升级包，设备升级时指定模块编码确定升级哪个组件。适用于：多模块设备（如网关+子设备）、支持独立升级各组件的复杂设备。
* @summary 创建模块
* @param {OtaModuleInfo} otaModuleInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaModuleInfoCreate (
otaModuleInfo: OtaModuleInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/module/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, otaModuleInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除OTA升级模块定义。删除前需确认该模块下无关联的升级包和进行中的升级任务。删除后模块编码失效，设备端无法识别该模块。适用于：模块废弃、产品架构调整、清理不再使用的模块定义。注意：删除操作不可恢复，需谨慎操作。
* @summary 删除模块
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaModuleInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/module/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询产品的所有OTA升级模块列表。返回模块基本信息（编码、名称、描述、关联产品等），支持按模块名称和产品ID过滤。用于管理界面展示模块清单、创建升级包时选择目标模块、设备升级时选择要升级的模块。
* @summary 获取模块列表
* @param {OtaModuleInfoGetListReq} otaModuleInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaModuleInfoGetList (
otaModuleInfoGetListReq: OtaModuleInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/module/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsOtaModuleInfoGetList200Response>>(localVarPath, otaModuleInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取单个OTA升级模块的完整信息。包括模块编码（用于设备端识别）、名称、描述、关联的产品ID等。用于模块配置查看、升级包创建时确认目标模块、设备升级日志分析。
* @summary 查询模块详情
* @param {WithIDOrCode} withIDOrCode
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaModuleInfoGetOne (
withIDOrCode: WithIDOrCode,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/module/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsOtaModuleInfoGetOne200Response>>(localVarPath, withIDOrCode, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改OTA升级模块的配置信息。可调整模块名称、描述等属性。注意：模块编码创建后不可修改（设备端依赖编码识别模块），关联的产品ID也不建议修改。用于模块信息维护、描述说明更新。
* @summary 更新模块
* @param {OtaModuleInfo} otaModuleInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaModuleInfoUpdate (
otaModuleInfo: OtaModuleInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/module/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, otaModuleInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsOtaModuleInfoCreate operation in ThingsOtaModuleInfoApi.
 */
export interface ThingsOtaModuleInfoApiPostApiV1ThingsOtaModuleInfoCreateRequest {
    readonly otaModuleInfo: OtaModuleInfo
}

/**
 * Request parameters for postApiV1ThingsOtaModuleInfoDelete operation in ThingsOtaModuleInfoApi.
 */
export interface ThingsOtaModuleInfoApiPostApiV1ThingsOtaModuleInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsOtaModuleInfoGetList operation in ThingsOtaModuleInfoApi.
 */
export interface ThingsOtaModuleInfoApiPostApiV1ThingsOtaModuleInfoGetListRequest {
    readonly otaModuleInfoGetListReq: OtaModuleInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsOtaModuleInfoGetOne operation in ThingsOtaModuleInfoApi.
 */
export interface ThingsOtaModuleInfoApiPostApiV1ThingsOtaModuleInfoGetOneRequest {
    readonly withIDOrCode: WithIDOrCode
}

/**
 * Request parameters for postApiV1ThingsOtaModuleInfoUpdate operation in ThingsOtaModuleInfoApi.
 */
export interface ThingsOtaModuleInfoApiPostApiV1ThingsOtaModuleInfoUpdateRequest {
    readonly otaModuleInfo: OtaModuleInfo
}
