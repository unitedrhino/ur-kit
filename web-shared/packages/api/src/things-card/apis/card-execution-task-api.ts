import type { ExecutionTaskDownloadReq } from '../models';
import type { ExecutionTaskGetListReq } from '../models';
import type { ExecutionTaskGetOneReq } from '../models';
import type { PostApiV1ThingsCardExecutionTaskDownload200Response } from '../models';
import type { PostApiV1ThingsCardExecutionTaskGetList200Response } from '../models';
import type { PostApiV1ThingsCardExecutionTaskGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardExecutionTaskApi - axios parameter creator
 */

/**
* 业务说明：按任务编号获取最新结果文件 OSS 下载地址
* @summary 下载执行结果文件
* @param {ExecutionTaskDownloadReq} executionTaskDownloadReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardExecutionTaskDownload (
executionTaskDownloadReq: ExecutionTaskDownloadReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/execution-task/download`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardExecutionTaskDownload200Response>>(localVarPath, executionTaskDownloadReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取批量任务执行结果文件列表
* @summary 获取执行结果文件列表
* @param {ExecutionTaskGetListReq} executionTaskGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardExecutionTaskGetList (
executionTaskGetListReq: ExecutionTaskGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/execution-task/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardExecutionTaskGetList200Response>>(localVarPath, executionTaskGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条执行结果记录
* @summary 获取执行结果详情
* @param {ExecutionTaskGetOneReq} executionTaskGetOneReq  ExecutionTaskGetOneReq 按租户内主键查询执行结果详情。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardExecutionTaskGetOne (
executionTaskGetOneReq: ExecutionTaskGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/execution-task/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardExecutionTaskGetOne200Response>>(localVarPath, executionTaskGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardExecutionTaskDownload operation in CardExecutionTaskApi.
 */
export interface CardExecutionTaskApiPostApiV1ThingsCardExecutionTaskDownloadRequest {
    readonly executionTaskDownloadReq: ExecutionTaskDownloadReq
}

/**
 * Request parameters for postApiV1ThingsCardExecutionTaskGetList operation in CardExecutionTaskApi.
 */
export interface CardExecutionTaskApiPostApiV1ThingsCardExecutionTaskGetListRequest {
    readonly executionTaskGetListReq: ExecutionTaskGetListReq

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
 * Request parameters for postApiV1ThingsCardExecutionTaskGetOne operation in CardExecutionTaskApi.
 */
export interface CardExecutionTaskApiPostApiV1ThingsCardExecutionTaskGetOneRequest {
    /**
     *  ExecutionTaskGetOneReq 按租户内主键查询执行结果详情。
     */
    readonly executionTaskGetOneReq: ExecutionTaskGetOneReq
}
