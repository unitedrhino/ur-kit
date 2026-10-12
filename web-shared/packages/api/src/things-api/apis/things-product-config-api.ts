import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { ProductConfig } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProductConfigApi - axios parameter creator
 */

/**
* 业务说明：更新产品设备初始化配置，设置设备首次接入时自动分配的租户、项目、区域、部门。用于批量设备自动归属配置
* @summary 更新配置
* @param {ProductConfig} productConfig
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductConfigUpdate (
productConfig: ProductConfig,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/config/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productConfig, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProductConfigUpdate operation in ThingsProductConfigApi.
 */
export interface ThingsProductConfigApiPostApiV1ThingsProductConfigUpdateRequest {
    readonly productConfig: ProductConfig
}
