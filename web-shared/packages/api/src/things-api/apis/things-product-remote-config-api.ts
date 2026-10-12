import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProductRemoteConfigGetList200Response } from '../models';
import type { PostApiV1ThingsProductRemoteConfigLastestRead200Response } from '../models';
import type { ProductRemoteConfigCreateReq } from '../models';
import type { ProductRemoteConfigGetListReq } from '../models';
import type { ProductRemoteConfigLastestGetOneReq } from '../models';
import type { ProductRemoteConfigPushAllReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProductRemoteConfigApi - axios parameter creator
 */

/**
* 业务说明：创建产品远程配置版本。远程配置用于批量下发配置参数到设备，如阈值设置、运行参数、功能开关等。每次创建生成新版本号
* @summary 创建配置
* @param {ProductRemoteConfigCreateReq} productRemoteConfigCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductRemoteConfigCreate (
productRemoteConfigCreateReq: ProductRemoteConfigCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/remote-config/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productRemoteConfigCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询产品远程配置版本历史列表。返回配置ID、内容、创建时间。用于配置版本管理、历史回溯
* @summary 获取配置列表
* @param {ProductRemoteConfigGetListReq} productRemoteConfigGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductRemoteConfigGetList (
productRemoteConfigGetListReq: ProductRemoteConfigGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/remote-config/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductRemoteConfigGetList200Response>>(localVarPath, productRemoteConfigGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取产品当前最新的远程配置版本。返回配置ID、内容、创建时间。用于查看待推送配置、设备配置同步
* @summary 获取最新配置
* @param {ProductRemoteConfigLastestGetOneReq} productRemoteConfigLastestGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductRemoteConfigLastestRead (
productRemoteConfigLastestGetOneReq: ProductRemoteConfigLastestGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/remote-config/lastest-read`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductRemoteConfigLastestRead200Response>>(localVarPath, productRemoteConfigLastestGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将最新远程配置推送到产品下所有在线设备。设备收到配置后自动应用并上报确认。用于批量设备参数更新
* @summary 推送配置
* @param {ProductRemoteConfigPushAllReq} productRemoteConfigPushAllReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductRemoteConfigPushAll (
productRemoteConfigPushAllReq: ProductRemoteConfigPushAllReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/remote-config/push-all`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productRemoteConfigPushAllReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProductRemoteConfigCreate operation in ThingsProductRemoteConfigApi.
 */
export interface ThingsProductRemoteConfigApiPostApiV1ThingsProductRemoteConfigCreateRequest {
    readonly productRemoteConfigCreateReq: ProductRemoteConfigCreateReq
}

/**
 * Request parameters for postApiV1ThingsProductRemoteConfigGetList operation in ThingsProductRemoteConfigApi.
 */
export interface ThingsProductRemoteConfigApiPostApiV1ThingsProductRemoteConfigGetListRequest {
    readonly productRemoteConfigGetListReq: ProductRemoteConfigGetListReq
}

/**
 * Request parameters for postApiV1ThingsProductRemoteConfigLastestRead operation in ThingsProductRemoteConfigApi.
 */
export interface ThingsProductRemoteConfigApiPostApiV1ThingsProductRemoteConfigLastestReadRequest {
    readonly productRemoteConfigLastestGetOneReq: ProductRemoteConfigLastestGetOneReq
}

/**
 * Request parameters for postApiV1ThingsProductRemoteConfigPushAll operation in ThingsProductRemoteConfigApi.
 */
export interface ThingsProductRemoteConfigApiPostApiV1ThingsProductRemoteConfigPushAllRequest {
    readonly productRemoteConfigPushAllReq: ProductRemoteConfigPushAllReq
}
