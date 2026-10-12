import type { BatchTaskCancelReq } from '../models';
import type { BatchTaskCreateReq } from '../models';
import type { BatchTaskDetailExportReq } from '../models';
import type { BatchTaskDetailGetListReq } from '../models';
import type { BatchTaskExportFailedReq } from '../models';
import type { BatchTaskGetListReq } from '../models';
import type { BatchTaskGetOneReq } from '../models';
import type { BatchTaskRetryReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCancel200Response } from '../models';
import type { PostApiV1ThingsCardBatchTaskCreate200Response } from '../models';
import type { PostApiV1ThingsCardBatchTaskDetailExport200Response } from '../models';
import type { PostApiV1ThingsCardBatchTaskDetailGetList200Response } from '../models';
import type { PostApiV1ThingsCardBatchTaskExportFailed200Response } from '../models';
import type { PostApiV1ThingsCardBatchTaskGetList200Response } from '../models';
import type { PostApiV1ThingsCardBatchTaskGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardBatchTaskApi - axios parameter creator
 */

/**
* 业务说明：取消批量任务
* @summary 取消批量任务
* @param {BatchTaskCancelReq} batchTaskCancelReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardBatchTaskCancel (
batchTaskCancelReq: BatchTaskCancelReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/batch-task/cancel`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, batchTaskCancelReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：手动创建批量任务，由执行器异步执行
* @summary 手动创建批量任务
* @param {BatchTaskCreateReq} batchTaskCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardBatchTaskCreate (
batchTaskCreateReq: BatchTaskCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/batch-task/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, batchTaskCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按状态导出批量任务 ICCID 执行明细为 Excel
* @summary 导出批量任务执行明细
* @param {BatchTaskDetailExportReq} batchTaskDetailExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardBatchTaskDetailExport (
batchTaskDetailExportReq: BatchTaskDetailExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/batch-task/detail/export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskDetailExport200Response>>(localVarPath, batchTaskDetailExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按状态分页查询批量任务 ICCID 执行明细
* @summary 获取批量任务执行明细列表
* @param {BatchTaskDetailGetListReq} batchTaskDetailGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardBatchTaskDetailGetList (
batchTaskDetailGetListReq: BatchTaskDetailGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/batch-task/detail/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskDetailGetList200Response>>(localVarPath, batchTaskDetailGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：导出批量任务失败明细为 Excel 并返回下载地址
* @summary 导出批量任务失败明细
* @param {BatchTaskExportFailedReq} batchTaskExportFailedReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardBatchTaskExportFailed (
batchTaskExportFailedReq: BatchTaskExportFailedReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/batch-task/export-failed`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskExportFailed200Response>>(localVarPath, batchTaskExportFailedReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取批量任务列表
* @summary 获取批量任务列表
* @param {BatchTaskGetListReq} batchTaskGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardBatchTaskGetList (
batchTaskGetListReq: BatchTaskGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/batch-task/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskGetList200Response>>(localVarPath, batchTaskGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取批量任务详情
* @summary 获取批量任务详情
* @param {BatchTaskGetOneReq} batchTaskGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardBatchTaskGetOne (
batchTaskGetOneReq: BatchTaskGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/batch-task/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskGetOne200Response>>(localVarPath, batchTaskGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：重试批量任务
* @summary 重试批量任务
* @param {BatchTaskRetryReq} batchTaskRetryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardBatchTaskRetry (
batchTaskRetryReq: BatchTaskRetryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/batch-task/retry`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, batchTaskRetryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardBatchTaskCancel operation in CardBatchTaskApi.
 */
export interface CardBatchTaskApiPostApiV1ThingsCardBatchTaskCancelRequest {
    readonly batchTaskCancelReq: BatchTaskCancelReq
}

/**
 * Request parameters for postApiV1ThingsCardBatchTaskCreate operation in CardBatchTaskApi.
 */
export interface CardBatchTaskApiPostApiV1ThingsCardBatchTaskCreateRequest {
    readonly batchTaskCreateReq: BatchTaskCreateReq
}

/**
 * Request parameters for postApiV1ThingsCardBatchTaskDetailExport operation in CardBatchTaskApi.
 */
export interface CardBatchTaskApiPostApiV1ThingsCardBatchTaskDetailExportRequest {
    readonly batchTaskDetailExportReq: BatchTaskDetailExportReq
}

/**
 * Request parameters for postApiV1ThingsCardBatchTaskDetailGetList operation in CardBatchTaskApi.
 */
export interface CardBatchTaskApiPostApiV1ThingsCardBatchTaskDetailGetListRequest {
    readonly batchTaskDetailGetListReq: BatchTaskDetailGetListReq

    /**
     *  页码
     */
    readonly page?: number

    /**
     *  每页大小
     */
    readonly size?: number
}

/**
 * Request parameters for postApiV1ThingsCardBatchTaskExportFailed operation in CardBatchTaskApi.
 */
export interface CardBatchTaskApiPostApiV1ThingsCardBatchTaskExportFailedRequest {
    readonly batchTaskExportFailedReq: BatchTaskExportFailedReq
}

/**
 * Request parameters for postApiV1ThingsCardBatchTaskGetList operation in CardBatchTaskApi.
 */
export interface CardBatchTaskApiPostApiV1ThingsCardBatchTaskGetListRequest {
    readonly batchTaskGetListReq: BatchTaskGetListReq

    /**
     *  页码
     */
    readonly page?: number

    /**
     *  每页大小
     */
    readonly size?: number
}

/**
 * Request parameters for postApiV1ThingsCardBatchTaskGetOne operation in CardBatchTaskApi.
 */
export interface CardBatchTaskApiPostApiV1ThingsCardBatchTaskGetOneRequest {
    readonly batchTaskGetOneReq: BatchTaskGetOneReq
}

/**
 * Request parameters for postApiV1ThingsCardBatchTaskRetry operation in CardBatchTaskApi.
 */
export interface CardBatchTaskApiPostApiV1ThingsCardBatchTaskRetryRequest {
    readonly batchTaskRetryReq: BatchTaskRetryReq
}
