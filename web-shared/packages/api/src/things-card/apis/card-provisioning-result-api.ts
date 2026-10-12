import type { CardApiProvisioningResultGetListReq } from '../models';
import type { PostApiV1ThingsCardProvisioningResultGetList200Response } from '../models';
import type { PostApiV1ThingsCardProvisioningResultGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardProvisioningResultApi - axios parameter creator
 */

/**
* 业务说明：分页查询 cd_card_api_provisioning_result，支持 iccid、通道、messageId、状态与时间范围筛选
* @summary 获取上游异步变更结果列表
* @param {CardApiProvisioningResultGetListReq} cardApiProvisioningResultGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardProvisioningResultGetList (
cardApiProvisioningResultGetListReq: CardApiProvisioningResultGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/provisioning-result/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardProvisioningResultGetList200Response>>(localVarPath, cardApiProvisioningResultGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按主键查询单条异步变更结果，并附带关联对账摘要
* @summary 获取上游异步变更结果详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardProvisioningResultGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/provisioning-result/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardProvisioningResultGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardProvisioningResultGetList operation in CardProvisioningResultApi.
 */
export interface CardProvisioningResultApiPostApiV1ThingsCardProvisioningResultGetListRequest {
    readonly cardApiProvisioningResultGetListReq: CardApiProvisioningResultGetListReq

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
 * Request parameters for postApiV1ThingsCardProvisioningResultGetOne operation in CardProvisioningResultApi.
 */
export interface CardProvisioningResultApiPostApiV1ThingsCardProvisioningResultGetOneRequest {
    readonly withID: WithID
}
