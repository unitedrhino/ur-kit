import type { ConsumptionGetListReq } from '../models';
import type { PostApiV1EnergyConsumptionGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ConsumptionApi - axios parameter creator
 */

/**
* 业务说明：分页查询房间的消费扣费记录，支持按房间、账户类型和时间范围过滤。用于管理员核对水电扣费明细。
* @summary 获取消费记录列表
* @param {ConsumptionGetListReq} consumptionGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyConsumptionGetList (
consumptionGetListReq: ConsumptionGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/consumption/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyConsumptionGetList200Response>>(localVarPath, consumptionGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyConsumptionGetList operation in ConsumptionApi.
 */
export interface ConsumptionApiPostApiV1EnergyConsumptionGetListRequest {
    readonly consumptionGetListReq: ConsumptionGetListReq
}
