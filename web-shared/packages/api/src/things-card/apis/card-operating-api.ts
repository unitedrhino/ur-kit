import type { CardOperatingGetListReq } from '../models';
import type { PostApiV1ThingsCardOperatingGetList200Response } from '../models';
import type { PostApiV1ThingsCardOperatingGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardOperatingApi - axios parameter creator
 */

/**
* 业务说明：分页查询物联卡操作日志
* @summary 获取操作日志列表
* @param {CardOperatingGetListReq} cardOperatingGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOperatingGetList (
cardOperatingGetListReq: CardOperatingGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/operating/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardOperatingGetList200Response>>(localVarPath, cardOperatingGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按租户和主键查询单条操作日志
* @summary 获取操作日志详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardOperatingGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/operating/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardOperatingGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardOperatingGetList operation in CardOperatingApi.
 */
export interface CardOperatingApiPostApiV1ThingsCardOperatingGetListRequest {
    readonly cardOperatingGetListReq: CardOperatingGetListReq

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
 * Request parameters for postApiV1ThingsCardOperatingGetOne operation in CardOperatingApi.
 */
export interface CardOperatingApiPostApiV1ThingsCardOperatingGetOneRequest {
    readonly withID: WithID
}
