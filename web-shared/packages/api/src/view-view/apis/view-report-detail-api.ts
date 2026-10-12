import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewReportDetailGetOne200Response } from '../models';
import type { ReportDetail } from '../models';
import type { ReportGetOneReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewReportDetailApi - axios parameter creator
 */

/**
* 业务说明：加载报表设计内容供设计器回显。
* @summary 获取报表详情内容
* @param {ReportGetOneReq} reportGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportDetailGetOne (
reportGetOneReq: ReportGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/detail/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ViewReportDetailGetOne200Response>>(localVarPath, reportGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：保存报表设计内容（Univer workbook JSON）。
* @summary 更新报表详情内容
* @param {ReportDetail} reportDetail
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportDetailUpdate (
reportDetail: ReportDetail,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/detail/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, reportDetail, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewReportDetailGetOne operation in ViewReportDetailApi.
 */
export interface ViewReportDetailApiPostApiV1ViewReportDetailGetOneRequest {
    readonly reportGetOneReq: ReportGetOneReq
}

/**
 * Request parameters for postApiV1ViewReportDetailUpdate operation in ViewReportDetailApi.
 */
export interface ViewReportDetailApiPostApiV1ViewReportDetailUpdateRequest {
    readonly reportDetail: ReportDetail
}
