import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemRouteGetList200Response } from '../models';
import type { RouteInfoGetListReq } from '../models';
import type { RouteInfoUpdateReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemRouteApi - axios parameter creator
 */

/**
* 业务说明：删除数据库动态路由（软删）。仅允许删除来源为服务自注册/手工的数据库路由；配置文件与应用代理路由不允许删除。删除后经 NATS 事件触发热重载。注意：若对应服务仍在运行，其下次重启会重新注册该路由，需长期下线请使用停用。
* @summary 删除网关路由
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRouteDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/route/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询网关反向代理的全量路由清单，合并三个来源：数据库动态路由（各后端服务启动时自注册）、应用代理（应用管理中开启代理的应用）、配置文件路由（apisvr etc/_*.yaml 的 Proxy 段）。支持按来源、服务标识、状态、location 关键字过滤并分页。数据库路由可启停/删除；配置文件与应用代理路由仅展示。
* @summary 获取网关路由列表
* @param {RouteInfoGetListReq} routeInfoGetListReq  RouteInfoGetListReq 路由列表查询请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRouteGetList (
routeInfoGetListReq: RouteInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/route/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemRouteGetList200Response>>(localVarPath, routeInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新数据库动态路由的状态（启用/停用）、描述与排序。出于安全考虑（防 SSRF/越权转发），location/proxy 等转发配置字段不接受修改，仅状态类字段生效。配置来源与应用代理路由不允许修改。状态变更经 NATS 事件触发热重载，无需重启网关。
* @summary 更新网关路由
* @param {RouteInfoUpdateReq} routeInfoUpdateReq  RouteInfoUpdateReq 路由更新请求(仅状态类字段白名单)
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemRouteUpdate (
routeInfoUpdateReq: RouteInfoUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/route/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, routeInfoUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemRouteDelete operation in SystemRouteApi.
 */
export interface SystemRouteApiPostApiV1SystemRouteDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1SystemRouteGetList operation in SystemRouteApi.
 */
export interface SystemRouteApiPostApiV1SystemRouteGetListRequest {
    /**
     *  RouteInfoGetListReq 路由列表查询请求
     */
    readonly routeInfoGetListReq: RouteInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemRouteUpdate operation in SystemRouteApi.
 */
export interface SystemRouteApiPostApiV1SystemRouteUpdateRequest {
    /**
     *  RouteInfoUpdateReq 路由更新请求(仅状态类字段白名单)
     */
    readonly routeInfoUpdateReq: RouteInfoUpdateReq
}
