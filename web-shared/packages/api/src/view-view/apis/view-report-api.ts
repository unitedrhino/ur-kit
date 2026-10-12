import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewReportCreate200Response } from '../models';
import type { PostApiV1ViewReportExport200Response } from '../models';
import type { PostApiV1ViewReportGetList200Response } from '../models';
import type { PostApiV1ViewReportGetOne200Response } from '../models';
import type { PostApiV1ViewReportRender200Response } from '../models';
import type { ReportCreateReq } from '../models';
import type { ReportDeleteReq } from '../models';
import type { ReportExportByIdReq } from '../models';
import type { ReportExportReq } from '../models';
import type { ReportGetListReq } from '../models';
import type { ReportGetOneReq } from '../models';
import type { ReportRenderReq } from '../models';
import type { ReportUpdateReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewReportApi - axios parameter creator
 */

/**
* 业务说明：创建报表（按项目组织），初始详情内容为空。
* @summary 新增报表
* @param {ReportCreateReq} reportCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportCreate (
reportCreateReq: ReportCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/create`;
    return requestClient.post<ExtractDataType<PostApiV1ViewReportCreate200Response>>(localVarPath, reportCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除报表及其详情内容。
* @summary 删除报表
* @param {ReportDeleteReq} reportDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportDelete (
reportDeleteReq: ReportDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, reportDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按模板渲染后生成 xlsx 文件并上传 OSS，返回受控下载地址。
* @summary 导出报表
* @param {ReportExportReq} reportExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportExport (
reportExportReq: ReportExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/export`;
    return requestClient.post<ExtractDataType<PostApiV1ViewReportExport200Response>>(localVarPath, reportExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按报表 ID 加载设计内容、渲染并导出 xlsx，返回受控下载地址（列表页一键导出）。
* @summary 按ID导出报表
* @param {ReportExportByIdReq} reportExportByIdReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportExportById (
reportExportByIdReq: ReportExportByIdReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/export-by-id`;
    return requestClient.post<ExtractDataType<PostApiV1ViewReportExport200Response>>(localVarPath, reportExportByIdReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询报表列表，支持按项目、名称筛选。
* @summary 获取报表列表
* @param {ReportGetListReq} reportGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportGetList (
reportGetListReq: ReportGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ViewReportGetList200Response>>(localVarPath, reportGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个报表基础信息。
* @summary 获取报表详情
* @param {ReportGetOneReq} reportGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportGetOne (
reportGetOneReq: ReportGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ViewReportGetOne200Response>>(localVarPath, reportGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：执行绑定数据集并按模板替换/展开，返回计算后的 workbook JSON，供设计器预览与导出共用。
* @summary 渲染报表
* @param {ReportRenderReq} reportRenderReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportRender (
reportRenderReq: ReportRenderReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/render`;
    return requestClient.post<ExtractDataType<PostApiV1ViewReportRender200Response>>(localVarPath, reportRenderReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新报表基础信息。
* @summary 更新报表
* @param {ReportUpdateReq} reportUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewReportUpdate (
reportUpdateReq: ReportUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/report/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, reportUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewReportCreate operation in ViewReportApi.
 */
export interface ViewReportApiPostApiV1ViewReportCreateRequest {
    readonly reportCreateReq: ReportCreateReq
}

/**
 * Request parameters for postApiV1ViewReportDelete operation in ViewReportApi.
 */
export interface ViewReportApiPostApiV1ViewReportDeleteRequest {
    readonly reportDeleteReq: ReportDeleteReq
}

/**
 * Request parameters for postApiV1ViewReportExport operation in ViewReportApi.
 */
export interface ViewReportApiPostApiV1ViewReportExportRequest {
    readonly reportExportReq: ReportExportReq
}

/**
 * Request parameters for postApiV1ViewReportExportById operation in ViewReportApi.
 */
export interface ViewReportApiPostApiV1ViewReportExportByIdRequest {
    readonly reportExportByIdReq: ReportExportByIdReq
}

/**
 * Request parameters for postApiV1ViewReportGetList operation in ViewReportApi.
 */
export interface ViewReportApiPostApiV1ViewReportGetListRequest {
    readonly reportGetListReq: ReportGetListReq
}

/**
 * Request parameters for postApiV1ViewReportGetOne operation in ViewReportApi.
 */
export interface ViewReportApiPostApiV1ViewReportGetOneRequest {
    readonly reportGetOneReq: ReportGetOneReq
}

/**
 * Request parameters for postApiV1ViewReportRender operation in ViewReportApi.
 */
export interface ViewReportApiPostApiV1ViewReportRenderRequest {
    readonly reportRenderReq: ReportRenderReq
}

/**
 * Request parameters for postApiV1ViewReportUpdate operation in ViewReportApi.
 */
export interface ViewReportApiPostApiV1ViewReportUpdateRequest {
    readonly reportUpdateReq: ReportUpdateReq
}
