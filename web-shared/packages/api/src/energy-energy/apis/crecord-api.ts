import type { CRecordGetListReq } from '../models';
import type { PostApiV1EnergyCRecordConsumptionList200Response } from '../models';
import type { PostApiV1EnergyCRecordRechargeList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CRecordApi - axios parameter creator
 */

/**
* 业务说明：查询租客端当前绑定房间的消费明细列表，返回电费或水费的扣费记录。用于租客查看近期用量和扣费情况。
* @summary 租客消费明细列表
* @param {CRecordGetListReq} cRecordGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyCRecordConsumptionList (
cRecordGetListReq: CRecordGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/c/record/consumption-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyCRecordConsumptionList200Response>>(localVarPath, cRecordGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询租客端当前绑定房间的充值记录列表，支持按房间、账户类型和时间范围过滤。用于租客查看历史充值流水。
* @summary 租客充值记录列表
* @param {CRecordGetListReq} cRecordGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1EnergyCRecordRechargeList (
cRecordGetListReq: CRecordGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/energy/c/record/recharge-list`;
    return requestClient.post<ExtractDataType<PostApiV1EnergyCRecordRechargeList200Response>>(localVarPath, cRecordGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1EnergyCRecordConsumptionList operation in CRecordApi.
 */
export interface CRecordApiPostApiV1EnergyCRecordConsumptionListRequest {
    readonly cRecordGetListReq: CRecordGetListReq
}

/**
 * Request parameters for postApiV1EnergyCRecordRechargeList operation in CRecordApi.
 */
export interface CRecordApiPostApiV1EnergyCRecordRechargeListRequest {
    readonly cRecordGetListReq: CRecordGetListReq
}
