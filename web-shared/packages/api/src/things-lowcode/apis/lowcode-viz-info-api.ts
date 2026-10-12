import type { PostApiV1LowcodeRuleChainDetailUpdate200Response } from '../models';
import type { PostApiV1LowcodeRuleChainGroupCreate200Response } from '../models';
import type { PostApiV1LowcodeVizInfoExport200Response } from '../models';
import type { PostApiV1LowcodeVizInfoGetList200Response } from '../models';
import type { PostApiV1LowcodeVizInfoGetOne200Response } from '../models';
import type { VizInfo } from '../models';
import type { VizInfoCreateReq } from '../models';
import type { VizInfoExportReq } from '../models';
import type { VizInfoGetListReq } from '../models';
import type { VizInfoGetOneReq } from '../models';
import type { WithIDStr } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeVizInfoApi - axios parameter creator
 */

/**
* 业务说明：新增可视化
* @summary 新增可视化
* @param {VizInfoCreateReq} vizInfoCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizInfoCreate (
vizInfoCreateReq: VizInfoCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainGroupCreate200Response>>(localVarPath, vizInfoCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除可视化
* @summary 删除可视化
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizInfoDelete (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：导出可视化
* @summary 导出可视化
* @param {VizInfoExportReq} vizInfoExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizInfoExport (
vizInfoExportReq: VizInfoExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/info/export`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeVizInfoExport200Response>>(localVarPath, vizInfoExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取可视化信息列表
* @summary 获取可视化信息列表
* @param {VizInfoGetListReq} vizInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizInfoGetList (
vizInfoGetListReq: VizInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeVizInfoGetList200Response>>(localVarPath, vizInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取可视化详情
* @summary 获取可视化详情
* @param {VizInfoGetOneReq} vizInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizInfoGetOne (
vizInfoGetOneReq: VizInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeVizInfoGetOne200Response>>(localVarPath, vizInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：导入可视化
* @summary 导入可视化
* @param {File} [bodyParam.file]
* @param {number} [bodyParam.id]
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizInfoImport (bodyParam: { file: File; id?: number; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/info/import`;
        if ((bodyParam as Record<string, unknown>)['id'] !== undefined) {
            localVarQueryParameter['id'] = (bodyParam as Record<string, unknown>)['id'];
        }
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新可视化
* @summary 更新可视化
* @param {VizInfo} vizInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizInfoUpdate (
vizInfo: VizInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, vizInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1LowcodeVizInfoCreate operation in LowcodeVizInfoApi.
 */
export interface LowcodeVizInfoApiPostApiV1LowcodeVizInfoCreateRequest {
    readonly vizInfoCreateReq: VizInfoCreateReq
}

/**
 * Request parameters for postApiV1LowcodeVizInfoDelete operation in LowcodeVizInfoApi.
 */
export interface LowcodeVizInfoApiPostApiV1LowcodeVizInfoDeleteRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1LowcodeVizInfoExport operation in LowcodeVizInfoApi.
 */
export interface LowcodeVizInfoApiPostApiV1LowcodeVizInfoExportRequest {
    readonly vizInfoExportReq: VizInfoExportReq
}

/**
 * Request parameters for postApiV1LowcodeVizInfoGetList operation in LowcodeVizInfoApi.
 */
export interface LowcodeVizInfoApiPostApiV1LowcodeVizInfoGetListRequest {
    readonly vizInfoGetListReq: VizInfoGetListReq
}

/**
 * Request parameters for postApiV1LowcodeVizInfoGetOne operation in LowcodeVizInfoApi.
 */
export interface LowcodeVizInfoApiPostApiV1LowcodeVizInfoGetOneRequest {
    readonly vizInfoGetOneReq: VizInfoGetOneReq
}

/**
 * Request parameters for postApiV1LowcodeVizInfoImport operation in LowcodeVizInfoApi.
 */
export interface LowcodeVizInfoApiPostApiV1LowcodeVizInfoImportRequest {
    readonly file: File

    readonly id?: number

    readonly id2?: string
}

/**
 * Request parameters for postApiV1LowcodeVizInfoUpdate operation in LowcodeVizInfoApi.
 */
export interface LowcodeVizInfoApiPostApiV1LowcodeVizInfoUpdateRequest {
    readonly vizInfo: VizInfo
}
