import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProductCustomGetOne200Response } from '../models';
import type { ProductCustom } from '../models';
import type { ProductCustomGetOneReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProductCustomApi - axios parameter creator
 */

/**
* 业务说明：根据产品ID查询产品自定义扩展配置。返回协议转换脚本、登录认证脚本、脚本语言类型、自定义Topic列表。用于产品高级配置查看
* @summary 获取产品自定义信息详情
* @param {ProductCustomGetOneReq} productCustomGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCustomGetOne (
productCustomGetOneReq: ProductCustomGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/custom/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCustomGetOne200Response>>(localVarPath, productCustomGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新产品自定义扩展配置，包括协议转换脚本、登录认证脚本、自定义Topic等。脚本用于处理非标准协议设备的数据转换、自定义认证逻辑
* @summary 更新产品自定义信息
* @param {ProductCustom} productCustom
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductCustomUpdate (
productCustom: ProductCustom,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/custom/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productCustom, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProductCustomGetOne operation in ThingsProductCustomApi.
 */
export interface ThingsProductCustomApiPostApiV1ThingsProductCustomGetOneRequest {
    readonly productCustomGetOneReq: ProductCustomGetOneReq
}

/**
 * Request parameters for postApiV1ThingsProductCustomUpdate operation in ThingsProductCustomApi.
 */
export interface ThingsProductCustomApiPostApiV1ThingsProductCustomUpdateRequest {
    readonly productCustom: ProductCustom
}
