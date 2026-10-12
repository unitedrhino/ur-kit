import type { CardApiAuditTrailGetListReq } from '../models';
import type { PostApiV1ThingsCardAuditTrailGetList200Response } from '../models';
import type { PostApiV1ThingsCardAuditTrailGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardAuditTrailApi - axios parameter creator
 */

/**
* 业务说明：分页查询已同步的上游设备变更记录，支持按卡号、通道、变更类型与时间范围筛选
* @summary 获取上游变更记录列表
* @param {CardApiAuditTrailGetListReq} cardApiAuditTrailGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardAuditTrailGetList (
cardApiAuditTrailGetListReq: CardApiAuditTrailGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/audit-trail/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardAuditTrailGetList200Response>>(localVarPath, cardApiAuditTrailGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条上游变更记录，含上游摘要
* @summary 获取上游变更记录详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardAuditTrailGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/audit-trail/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardAuditTrailGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardAuditTrailGetList operation in CardAuditTrailApi.
 */
export interface CardAuditTrailApiPostApiV1ThingsCardAuditTrailGetListRequest {
    readonly cardApiAuditTrailGetListReq: CardApiAuditTrailGetListReq

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
 * Request parameters for postApiV1ThingsCardAuditTrailGetOne operation in CardAuditTrailApi.
 */
export interface CardAuditTrailApiPostApiV1ThingsCardAuditTrailGetOneRequest {
    readonly withID: WithID
}
