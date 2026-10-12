import type { PostApiV1DataDatasourceManageCreate200Response } from '../models';
import type { PostApiV1DataDatasourceManageDelete200Response } from '../models';
import type { PostApiV1DataQueryManageGetList200Response } from '../models';
import type { PostApiV1DataQueryManageGetOne200Response } from '../models';
import type { QueryConfigGetListReq } from '../models';
import type { QueryConfigManage } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * DataQueryManageApi - axios parameter creator
 */

/**
* 业务说明：创建查询配置模板，定义SQL模板或表名、查询列、过滤条件、权限配置等。支持两种类型：sql（SQL模板查询）和table（直接查表）。用于动态报表、数据看板、通用查询等场景。租户管理员可操作。
* @summary 添加查询配置
* @param {QueryConfigManage} queryConfigManage
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataQueryManageCreate (
queryConfigManage: QueryConfigManage,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/query/manage/create`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageCreate200Response>>(localVarPath, queryConfigManage, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除查询配置记录。删除后相关查询将无法执行，需确保无业务依赖后再删除。租户管理员可操作。
* @summary 删除查询配置
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataQueryManageDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/query/manage/delete`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询查询配置列表，支持按标识、名称、数据源、类型过滤。用于查询配置管理页面展示。租户管理员可访问。
* @summary 获取查询配置列表
* @param {QueryConfigGetListReq} queryConfigGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataQueryManageGetList (
queryConfigGetListReq: QueryConfigGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/query/manage/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1DataQueryManageGetList200Response>>(localVarPath, queryConfigGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据ID查询单个查询配置的完整信息，包括SQL模板、列定义、过滤器、权限配置等。用于编辑回显、配置查看等场景。租户管理员可访问。
* @summary 获取查询配置详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataQueryManageGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/query/manage/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1DataQueryManageGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改查询配置参数，支持更新SQL模板、列定义、过滤器、权限配置等。部分更新，空值字段不修改。修改后立即生效。租户管理员可操作。
* @summary 更新查询配置
* @param {QueryConfigManage} queryConfigManage
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataQueryManageUpdate (
queryConfigManage: QueryConfigManage,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/query/manage/update`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageDelete200Response>>(localVarPath, queryConfigManage, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1DataQueryManageCreate operation in DataQueryManageApi.
 */
export interface DataQueryManageApiPostApiV1DataQueryManageCreateRequest {
    readonly queryConfigManage: QueryConfigManage
}

/**
 * Request parameters for postApiV1DataQueryManageDelete operation in DataQueryManageApi.
 */
export interface DataQueryManageApiPostApiV1DataQueryManageDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1DataQueryManageGetList operation in DataQueryManageApi.
 */
export interface DataQueryManageApiPostApiV1DataQueryManageGetListRequest {
    readonly queryConfigGetListReq: QueryConfigGetListReq
}

/**
 * Request parameters for postApiV1DataQueryManageGetOne operation in DataQueryManageApi.
 */
export interface DataQueryManageApiPostApiV1DataQueryManageGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1DataQueryManageUpdate operation in DataQueryManageApi.
 */
export interface DataQueryManageApiPostApiV1DataQueryManageUpdateRequest {
    readonly queryConfigManage: QueryConfigManage
}
