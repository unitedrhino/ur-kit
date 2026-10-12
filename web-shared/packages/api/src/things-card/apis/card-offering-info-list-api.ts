import type { CardApiOfferingInfoListGetListReq } from '../models';
import type { PostApiV1ThingsCardOfferingInfoListGetList200Response } from '../models';
import type { PostApiV1ThingsCardOfferingInfoListGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardOfferingInfoListApi - axios parameter creator
 */

/**
* 业务说明：按 ICCID 分页查询物联卡已订购资费
* @summary 获取单卡已订购资费列表
* @param {CardApiOfferingInfoListGetListReq} cardApiOfferingInfoListGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOfferingInfoListGetList (
cardApiOfferingInfoListGetListReq: CardApiOfferingInfoListGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/offering-info/list/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardOfferingInfoListGetList200Response>>(localVarPath, cardApiOfferingInfoListGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条已订购资费快照
* @summary 获取单卡已订购资费详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOfferingInfoListGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/offering-info/list/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardOfferingInfoListGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardOfferingInfoListGetList operation in CardOfferingInfoListApi.
 */
export interface CardOfferingInfoListApiPostApiV1ThingsCardOfferingInfoListGetListRequest {
    readonly cardApiOfferingInfoListGetListReq: CardApiOfferingInfoListGetListReq

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
 * Request parameters for postApiV1ThingsCardOfferingInfoListGetOne operation in CardOfferingInfoListApi.
 */
export interface CardOfferingInfoListApiPostApiV1ThingsCardOfferingInfoListGetOneRequest {
    readonly withID: WithID
}
