import type { DatasourceCreateReq } from '../models';
import type { DatasourceDeleteReq } from '../models';
import type { DatasourceGetListReq } from '../models';
import type { DatasourceGetOneReq } from '../models';
import type { DatasourceUpdateReq } from '../models';
import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewDatasourceGetList200Response } from '../models';
import type { PostApiV1ViewDatasourceGetOne200Response } from '../models';
import type { PostApiV1ViewDatasourceTest200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewDatasourceApi - axios parameter creator
 */

/**
* 业务说明：在可视化应用中创建新的数据源配置，定义连接类型、配置参数和用途说明。用于数据集和项目的数据接入。
* @summary 新增数据源
* @param {DatasourceCreateReq} datasourceCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasourceCreate (
datasourceCreateReq: DatasourceCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/datasource/create`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, datasourceCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除可视化应用中的数据源配置。删除前应确认没有数据集继续引用该数据源。
* @summary 删除数据源
* @param {DatasourceDeleteReq} datasourceDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasourceDelete (
datasourceDeleteReq: DatasourceDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/datasource/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, datasourceDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询可视化数据源列表，支持按名称、类型和状态筛选。用于数据源管理页展示。
* @summary 获取数据源列表
* @param {DatasourceGetListReq} datasourceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasourceGetList (
datasourceGetListReq: DatasourceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/datasource/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ViewDatasourceGetList200Response>>(localVarPath, datasourceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个可视化数据源的完整配置，用于编辑回显和连接参数查看。
* @summary 获取数据源详情
* @param {DatasourceGetOneReq} datasourceGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasourceGetOne (
datasourceGetOneReq: DatasourceGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/datasource/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ViewDatasourceGetOne200Response>>(localVarPath, datasourceGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：测试可视化数据源的连接是否可用，返回连接结果和耗时。用于配置校验。
* @summary 测试数据源连接
* @param {DatasourceGetOneReq} datasourceGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasourceTest (
datasourceGetOneReq: DatasourceGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/datasource/test`;
    return requestClient.post<ExtractDataType<PostApiV1ViewDatasourceTest200Response>>(localVarPath, datasourceGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新可视化数据源的名称、类型或连接配置，用于维护数据接入参数。
* @summary 更新数据源
* @param {DatasourceUpdateReq} datasourceUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasourceUpdate (
datasourceUpdateReq: DatasourceUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/datasource/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, datasourceUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewDatasourceCreate operation in ViewDatasourceApi.
 */
export interface ViewDatasourceApiPostApiV1ViewDatasourceCreateRequest {
    readonly datasourceCreateReq: DatasourceCreateReq
}

/**
 * Request parameters for postApiV1ViewDatasourceDelete operation in ViewDatasourceApi.
 */
export interface ViewDatasourceApiPostApiV1ViewDatasourceDeleteRequest {
    readonly datasourceDeleteReq: DatasourceDeleteReq
}

/**
 * Request parameters for postApiV1ViewDatasourceGetList operation in ViewDatasourceApi.
 */
export interface ViewDatasourceApiPostApiV1ViewDatasourceGetListRequest {
    readonly datasourceGetListReq: DatasourceGetListReq
}

/**
 * Request parameters for postApiV1ViewDatasourceGetOne operation in ViewDatasourceApi.
 */
export interface ViewDatasourceApiPostApiV1ViewDatasourceGetOneRequest {
    readonly datasourceGetOneReq: DatasourceGetOneReq
}

/**
 * Request parameters for postApiV1ViewDatasourceTest operation in ViewDatasourceApi.
 */
export interface ViewDatasourceApiPostApiV1ViewDatasourceTestRequest {
    readonly datasourceGetOneReq: DatasourceGetOneReq
}

/**
 * Request parameters for postApiV1ViewDatasourceUpdate operation in ViewDatasourceApi.
 */
export interface ViewDatasourceApiPostApiV1ViewDatasourceUpdateRequest {
    readonly datasourceUpdateReq: DatasourceUpdateReq
}
