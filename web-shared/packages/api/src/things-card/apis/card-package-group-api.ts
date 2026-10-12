import type { CardPackageCreateReq } from '../models';
import type { CardPackageGetListReq } from '../models';
import type { CardPackageGetOptionReq } from '../models';
import type { CardPackageRouteGetListReq } from '../models';
import type { CardPackageRouteReplaceReq } from '../models';
import type { CardPackageUpdateReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCancel200Response } from '../models';
import type { PostApiV1ThingsCardInfoCreate200Response } from '../models';
import type { PostApiV1ThingsCardPackageGetList200Response } from '../models';
import type { PostApiV1ThingsCardPackageGetOne200Response } from '../models';
import type { PostApiV1ThingsCardPackageGetOption200Response } from '../models';
import type { PostApiV1ThingsCardPackageRouteGetList200Response } from '../models';
import type { PostApiV1ThingsCardPackageRouteReplace200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardPackageGroupApi - axios parameter creator
 */

/**
* 业务说明：新增资费组
* @summary 新增资费组
* @param {CardPackageCreateReq} cardPackageCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPackageCreate (
cardPackageCreateReq: CardPackageCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/package/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoCreate200Response>>(localVarPath, cardPackageCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除资费组
* @summary 删除资费组
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPackageDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/package/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取资费组列表
* @summary 获取资费组列表
* @param {CardPackageGetListReq} cardPackageGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPackageGetList (
cardPackageGetListReq: CardPackageGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/package/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPackageGetList200Response>>(localVarPath, cardPackageGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取资费组详情
* @summary 获取资费组详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPackageGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/package/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPackageGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取资费组下拉选项
* @summary 获取资费组下拉选项
* @param {CardPackageGetOptionReq} cardPackageGetOptionReq  CardPackageGetOptionReq 按当前选择的通道反向缩小平台资费组选项。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPackageGetOption (
cardPackageGetOptionReq: CardPackageGetOptionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/package/get-option`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPackageGetOption200Response>>(localVarPath, cardPackageGetOptionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前企业指定平台资费组可见的通道，返回已选状态、组合引用数及可移除原因
* @summary 获取平台资费组关联通道
* @param {CardPackageRouteGetListReq} cardPackageRouteGetListReq  CardPackageRouteGetListReq 查询一个平台资费组可见及已选的通道。
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPackageRouteGetList (
cardPackageRouteGetListReq: CardPackageRouteGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/package/route/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPackageRouteGetList200Response>>(localVarPath, cardPackageRouteGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：在当前企业内原子替换指定平台资费组的全部通道关系，空集合表示清空可移除关系
* @summary 替换平台资费组关联通道
* @param {CardPackageRouteReplaceReq} cardPackageRouteReplaceReq  CardPackageRouteReplaceReq 原子替换一个平台资费组的全部通道关系。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPackageRouteReplace (
cardPackageRouteReplaceReq: CardPackageRouteReplaceReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/package/route/replace`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPackageRouteReplace200Response>>(localVarPath, cardPackageRouteReplaceReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新资费组
* @summary 更新资费组
* @param {CardPackageUpdateReq} cardPackageUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardPackageUpdate (
cardPackageUpdateReq: CardPackageUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/package/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardPackageUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardPackageCreate operation in CardPackageGroupApi.
 */
export interface CardPackageGroupApiPostApiV1ThingsCardPackageCreateRequest {
    readonly cardPackageCreateReq: CardPackageCreateReq
}

/**
 * Request parameters for postApiV1ThingsCardPackageDelete operation in CardPackageGroupApi.
 */
export interface CardPackageGroupApiPostApiV1ThingsCardPackageDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardPackageGetList operation in CardPackageGroupApi.
 */
export interface CardPackageGroupApiPostApiV1ThingsCardPackageGetListRequest {
    readonly cardPackageGetListReq: CardPackageGetListReq

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
 * Request parameters for postApiV1ThingsCardPackageGetOne operation in CardPackageGroupApi.
 */
export interface CardPackageGroupApiPostApiV1ThingsCardPackageGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardPackageGetOption operation in CardPackageGroupApi.
 */
export interface CardPackageGroupApiPostApiV1ThingsCardPackageGetOptionRequest {
    /**
     *  CardPackageGetOptionReq 按当前选择的通道反向缩小平台资费组选项。
     */
    readonly cardPackageGetOptionReq: CardPackageGetOptionReq
}

/**
 * Request parameters for postApiV1ThingsCardPackageRouteGetList operation in CardPackageGroupApi.
 */
export interface CardPackageGroupApiPostApiV1ThingsCardPackageRouteGetListRequest {
    /**
     *  CardPackageRouteGetListReq 查询一个平台资费组可见及已选的通道。
     */
    readonly cardPackageRouteGetListReq: CardPackageRouteGetListReq

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
 * Request parameters for postApiV1ThingsCardPackageRouteReplace operation in CardPackageGroupApi.
 */
export interface CardPackageGroupApiPostApiV1ThingsCardPackageRouteReplaceRequest {
    /**
     *  CardPackageRouteReplaceReq 原子替换一个平台资费组的全部通道关系。
     */
    readonly cardPackageRouteReplaceReq: CardPackageRouteReplaceReq
}

/**
 * Request parameters for postApiV1ThingsCardPackageUpdate operation in CardPackageGroupApi.
 */
export interface CardPackageGroupApiPostApiV1ThingsCardPackageUpdateRequest {
    readonly cardPackageUpdateReq: CardPackageUpdateReq
}
