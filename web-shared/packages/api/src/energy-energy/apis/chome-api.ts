import type { CHomeDataReq } from '../models';
import type { PostApiV1EnergyCHomeGetData200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CHomeApi - axios parameter creator
 */

/**
* 业务说明：查询租客首页所需的当前房间余额、读数、本月消费摘要以及绑定房间列表，用于租客端首页展示。
* @summary 租客首页数据（当前房间余额+本月消费摘要）
* @param {CHomeDataReq} cHomeDataReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyCHomeGetData (
cHomeDataReq: CHomeDataReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/c/home/get-data`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyCHomeGetData200Response>>(localVarPath, cHomeDataReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyCHomeGetData operation in CHomeApi.
 */
export interface CHomeApiPostApiV1EnergyCHomeGetDataRequest {
    readonly cHomeDataReq: CHomeDataReq
}
