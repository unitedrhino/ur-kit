import type { PostApiV1DataQueryInfoGetList200Response } from '../models';
import type { PostApiV1DataQueryInfoGetOne200Response } from '../models';
import type { QueryInfoGetListReq } from '../models';
import type { QueryInfoGetOneReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * DataQueryInfoApi - axios parameter creator
 */

/**
* 业务说明：批量执行多个查询配置，一次请求返回多个查询结果。用于数据看板场景，减少HTTP请求数量。每个查询独立执行，支持各自的过滤条件和分页参数。权限配置自动注入确保数据隔离。所有登录用户可调用。
* @summary 批量执行查询
* @param {QueryInfoGetListReq} queryInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataQueryInfoGetList (
queryInfoGetListReq: QueryInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/query/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1DataQueryInfoGetList200Response>>(localVarPath, queryInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据查询配置code执行SQL查询，支持动态过滤条件、分页、聚合、分组等。权限配置（PermConfig）自动注入租户过滤、项目过滤等条件，确保用户只能查询其权限范围内的数据。用于报表数据加载、数据看板、通用查询等场景。所有登录用户可调用。
* @summary 执行单个查询
* @param {QueryInfoGetOneReq} queryInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1DataQueryInfoGetOne (
queryInfoGetOneReq: QueryInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/data/query/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1DataQueryInfoGetOne200Response>>(localVarPath, queryInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1DataQueryInfoGetList operation in DataQueryInfoApi.
 */
export interface DataQueryInfoApiPostApiV1DataQueryInfoGetListRequest {
    readonly queryInfoGetListReq: QueryInfoGetListReq
}

/**
 * Request parameters for postApiV1DataQueryInfoGetOne operation in DataQueryInfoApi.
 */
export interface DataQueryInfoApiPostApiV1DataQueryInfoGetOneRequest {
    readonly queryInfoGetOneReq: QueryInfoGetOneReq
}
