import type { DatasetCreateReq } from '../models';
import type { DatasetDeleteReq } from '../models';
import type { DatasetGetListReq } from '../models';
import type { DatasetGetOneReq } from '../models';
import type { DatasetPreviewReq } from '../models';
import type { DatasetUpdateReq } from '../models';
import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewDatasetGetList200Response } from '../models';
import type { PostApiV1ViewDatasetGetOne200Response } from '../models';
import type { PostApiV1ViewDatasetPreview200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewDatasetApi - axios parameter creator
 */

/**
* 业务说明：创建新的可视化数据集，配置数据类型、数据源、脚本和输出字段。用于图表和项目的数据准备。
* @summary 新增数据集
* @param {DatasetCreateReq} datasetCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasetCreate (
datasetCreateReq: DatasetCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/dataset/create`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, datasetCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除可视化数据集记录。用于清理不再使用的数据集。
* @summary 删除数据集
* @param {DatasetDeleteReq} datasetDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasetDelete (
datasetDeleteReq: DatasetDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/dataset/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, datasetDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询数据集列表，支持按名称、数据源、类型、分组和标签筛选。用于数据集管理页展示。
* @summary 获取数据集列表
* @param {DatasetGetListReq} datasetGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasetGetList (
datasetGetListReq: DatasetGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/dataset/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ViewDatasetGetList200Response>>(localVarPath, datasetGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个数据集的完整配置，用于编辑回显和详情查看。
* @summary 获取数据集详情
* @param {DatasetGetOneReq} datasetGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasetGetOne (
datasetGetOneReq: DatasetGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/dataset/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ViewDatasetGetOne200Response>>(localVarPath, datasetGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：执行数据集预览，返回行数据、字段定义和 ECharts dataset 结构。用于设计器调试数据效果。
* @summary 预览数据集
* @param {DatasetPreviewReq} datasetPreviewReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasetPreview (
datasetPreviewReq: DatasetPreviewReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/dataset/preview`;
    return requestClient.post<ExtractDataType<PostApiV1ViewDatasetPreview200Response>>(localVarPath, datasetPreviewReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新数据集的配置、动态参数、缓存和字段定义，用于维护数据处理逻辑。
* @summary 更新数据集
* @param {DatasetUpdateReq} datasetUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewDatasetUpdate (
datasetUpdateReq: DatasetUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/dataset/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, datasetUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewDatasetCreate operation in ViewDatasetApi.
 */
export interface ViewDatasetApiPostApiV1ViewDatasetCreateRequest {
    readonly datasetCreateReq: DatasetCreateReq
}

/**
 * Request parameters for postApiV1ViewDatasetDelete operation in ViewDatasetApi.
 */
export interface ViewDatasetApiPostApiV1ViewDatasetDeleteRequest {
    readonly datasetDeleteReq: DatasetDeleteReq
}

/**
 * Request parameters for postApiV1ViewDatasetGetList operation in ViewDatasetApi.
 */
export interface ViewDatasetApiPostApiV1ViewDatasetGetListRequest {
    readonly datasetGetListReq: DatasetGetListReq
}

/**
 * Request parameters for postApiV1ViewDatasetGetOne operation in ViewDatasetApi.
 */
export interface ViewDatasetApiPostApiV1ViewDatasetGetOneRequest {
    readonly datasetGetOneReq: DatasetGetOneReq
}

/**
 * Request parameters for postApiV1ViewDatasetPreview operation in ViewDatasetApi.
 */
export interface ViewDatasetApiPostApiV1ViewDatasetPreviewRequest {
    readonly datasetPreviewReq: DatasetPreviewReq
}

/**
 * Request parameters for postApiV1ViewDatasetUpdate operation in ViewDatasetApi.
 */
export interface ViewDatasetApiPostApiV1ViewDatasetUpdateRequest {
    readonly datasetUpdateReq: DatasetUpdateReq
}
