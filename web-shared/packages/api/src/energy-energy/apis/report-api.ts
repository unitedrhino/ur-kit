import type { PostApiV1EnergyConfigUpdate200Response } from '../models';
import type { PostApiV1EnergyDutyCreate200Response } from '../models';
import type { PostApiV1EnergyReportGetList200Response } from '../models';
import type { PostApiV1EnergyReportGetOne200Response } from '../models';
import type { Report } from '../models';
import type { ReportGetListReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ReportApi - axios parameter creator
 */

/**
* 业务说明：创建例报配置，登记例报类型、周期、内容、推送方式与接收人。用于周期性能耗报告推送。
* @summary 创建例报配置
* @param {Report} report
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyReportCreate (
report: Report,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/report/create`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyDutyCreate200Response>>(localVarPath, report, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：软删除指定例报配置。
* @summary 删除例报配置
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyReportDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/report/delete`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询例报配置，支持按例报类型、周期、接收人筛选。
* @summary 获取例报配置列表
* @param {ReportGetListReq} reportGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyReportGetList (
reportGetListReq: ReportGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/report/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyReportGetList200Response>>(localVarPath, reportGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据配置 ID 查询单个例报配置。
* @summary 获取例报配置详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyReportGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/report/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyReportGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新例报配置，支持部分更新。
* @summary 更新例报配置
* @param {Report} report
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyReportUpdate (
report: Report,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/report/update`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConfigUpdate200Response>>(localVarPath, report, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyReportCreate operation in ReportApi.
 */
export interface ReportApiPostApiV1EnergyReportCreateRequest {
    readonly report: Report
}

/**
 * Request parameters for postApiV1EnergyReportDelete operation in ReportApi.
 */
export interface ReportApiPostApiV1EnergyReportDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyReportGetList operation in ReportApi.
 */
export interface ReportApiPostApiV1EnergyReportGetListRequest {
    readonly reportGetListReq: ReportGetListReq
}

/**
 * Request parameters for postApiV1EnergyReportGetOne operation in ReportApi.
 */
export interface ReportApiPostApiV1EnergyReportGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1EnergyReportUpdate operation in ReportApi.
 */
export interface ReportApiPostApiV1EnergyReportUpdateRequest {
    readonly report: Report
}
