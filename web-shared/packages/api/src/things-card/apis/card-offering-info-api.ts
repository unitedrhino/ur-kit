import type { CardApiOfferingInfoGetListReq } from '../models';
import type { PostApiV1ThingsCardOfferingInfoGetList200Response } from '../models';
import type { PostApiV1ThingsCardOfferingInfoGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardOfferingInfoApi - axios parameter creator
 */

/**
* 业务说明：按通道编码等条件分页查询上游资费组
* @summary 获取上游资费组列表
* @param {CardApiOfferingInfoGetListReq} cardApiOfferingInfoGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOfferingInfoGetList (
cardApiOfferingInfoGetListReq: CardApiOfferingInfoGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/offering-info/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardOfferingInfoGetList200Response>>(localVarPath, cardApiOfferingInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条上游资费组快照
* @summary 获取上游资费组详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOfferingInfoGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/offering-info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardOfferingInfoGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardOfferingInfoGetList operation in CardOfferingInfoApi.
 */
export interface CardOfferingInfoApiPostApiV1ThingsCardOfferingInfoGetListRequest {
    readonly cardApiOfferingInfoGetListReq: CardApiOfferingInfoGetListReq

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
 * Request parameters for postApiV1ThingsCardOfferingInfoGetOne operation in CardOfferingInfoApi.
 */
export interface CardOfferingInfoApiPostApiV1ThingsCardOfferingInfoGetOneRequest {
    readonly withID: WithID
}
