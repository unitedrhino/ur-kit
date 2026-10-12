import type { CardFlowGetListReq } from '../models';
import type { PostApiV1ThingsCardFlowGetList200Response } from '../models';
import type { PostApiV1ThingsCardFlowGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardFlowApi - axios parameter creator
 */

/**
* 业务说明：获取流量包记录列表
* @summary 获取流量包记录列表
* @param {CardFlowGetListReq} cardFlowGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardFlowGetList (
cardFlowGetListReq: CardFlowGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/flow/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardFlowGetList200Response>>(localVarPath, cardFlowGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条流量包事实记录
* @summary 获取流量包记录详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardFlowGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/flow/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardFlowGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardFlowGetList operation in CardFlowApi.
 */
export interface CardFlowApiPostApiV1ThingsCardFlowGetListRequest {
    readonly cardFlowGetListReq: CardFlowGetListReq

    /**
     *  页码
     */
    readonly page?: number

    /**
     *  每页大小
     */
    readonly size?: number
}

/**
 * Request parameters for postApiV1ThingsCardFlowGetOne operation in CardFlowApi.
 */
export interface CardFlowApiPostApiV1ThingsCardFlowGetOneRequest {
    readonly withID: WithID
}
