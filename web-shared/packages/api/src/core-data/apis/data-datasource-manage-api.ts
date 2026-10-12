import type { DataSourceGetListReq } from '../models';
import type { DataSourceManage } from '../models';
import type { DataSourcePingReq } from '../models';
import type { PostApiV1DataDatasourceManageCreate200Response } from '../models';
import type { PostApiV1DataDatasourceManageDelete200Response } from '../models';
import type { PostApiV1DataDatasourceManageGetList200Response } from '../models';
import type { PostApiV1DataDatasourceManageGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * DataDatasourceManageApi - axios parameter creator
 */

/**
* 业务说明：创建新的数据库连接配置，支持MySQL、PostgreSQL、SQLite、TDengine等多种数据库类型。配置连接字符串、连接池参数后可用于查询配置的数据来源。数据源是平台级基础设施，跨租户共享，仅平台管理员可操作。
* @summary 添加数据源
* @param {DataSourceManage} dataSourceManage
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataDatasourceManageCreate (
dataSourceManage: DataSourceManage,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/datasource/manage/create`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageCreate200Response>>(localVarPath, dataSourceManage, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除数据源配置记录。删除前需确保无查询配置引用该数据源，否则删除失败。删除后相关查询配置将无法执行。仅平台管理员可操作。
* @summary 删除数据源
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataDatasourceManageDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/datasource/manage/delete`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询数据源配置列表，支持按标识、名称、数据库类型、状态过滤。用于数据源管理页面展示，返回基本信息不含敏感字段。仅平台管理员可访问。
* @summary 获取数据源列表
* @param {DataSourceGetListReq} dataSourceGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataDatasourceManageGetList (
dataSourceGetListReq: DataSourceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/datasource/manage/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageGetList200Response>>(localVarPath, dataSourceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据ID查询单个数据源的完整配置信息，包括连接字符串、连接池参数、自定义函数模板等。用于编辑回显、配置查看等场景。仅平台管理员可访问。
* @summary 获取数据源详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataDatasourceManageGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/datasource/manage/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：验证数据源连接配置是否有效，尝试建立数据库连接并立即关闭。用于新增/编辑数据源时的配置验证，确保连接字符串正确。仅平台管理员可操作。
* @summary 测试数据源连接
* @param {DataSourcePingReq} dataSourcePingReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataDatasourceManagePing (
dataSourcePingReq: DataSourcePingReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/datasource/manage/ping`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageDelete200Response>>(localVarPath, dataSourcePingReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改数据源配置参数，支持更新名称、连接字符串、连接池参数、状态等。部分更新，空值字段不修改。修改后需重新测试连接有效性。仅平台管理员可操作。
* @summary 更新数据源
* @param {DataSourceManage} dataSourceManage
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataDatasourceManageUpdate (
dataSourceManage: DataSourceManage,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/datasource/manage/update`;
    return requestClient.post<ExtractDataType<PostApiV1DataDatasourceManageDelete200Response>>(localVarPath, dataSourceManage, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1DataDatasourceManageCreate operation in DataDatasourceManageApi.
 */
export interface DataDatasourceManageApiPostApiV1DataDatasourceManageCreateRequest {
    readonly dataSourceManage: DataSourceManage
}

/**
 * Request parameters for postApiV1DataDatasourceManageDelete operation in DataDatasourceManageApi.
 */
export interface DataDatasourceManageApiPostApiV1DataDatasourceManageDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1DataDatasourceManageGetList operation in DataDatasourceManageApi.
 */
export interface DataDatasourceManageApiPostApiV1DataDatasourceManageGetListRequest {
    readonly dataSourceGetListReq: DataSourceGetListReq
}

/**
 * Request parameters for postApiV1DataDatasourceManageGetOne operation in DataDatasourceManageApi.
 */
export interface DataDatasourceManageApiPostApiV1DataDatasourceManageGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1DataDatasourceManagePing operation in DataDatasourceManageApi.
 */
export interface DataDatasourceManageApiPostApiV1DataDatasourceManagePingRequest {
    readonly dataSourcePingReq: DataSourcePingReq
}

/**
 * Request parameters for postApiV1DataDatasourceManageUpdate operation in DataDatasourceManageApi.
 */
export interface DataDatasourceManageApiPostApiV1DataDatasourceManageUpdateRequest {
    readonly dataSourceManage: DataSourceManage
}
