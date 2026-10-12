import type { CardDeviceBindingBindReq } from '../models';
import type { CardDeviceBindingCreateAndBindReq } from '../models';
import type { CardDeviceBindingGetListReq } from '../models';
import type { CardDeviceBindingGetOneReq } from '../models';
import type { CardDeviceBindingMatchReq } from '../models';
import type { CardDeviceBindingUnbindReq } from '../models';
import type { PostApiV1ThingsCardDeviceBindingBind200Response } from '../models';
import type { PostApiV1ThingsCardDeviceBindingCreateAndBind200Response } from '../models';
import type { PostApiV1ThingsCardDeviceBindingGetList200Response } from '../models';
import type { PostApiV1ThingsCardDeviceBindingGetOne200Response } from '../models';
import type { PostApiV1ThingsCardDeviceBindingMatch200Response } from '../models';
import type { PostApiV1ThingsCardDeviceBindingUnbind200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardDeviceBindingApi - axios parameter creator
 */

/**
* 业务说明：将当前企业已有卡绑定到蜂窝设备，冲突确认后执行原子换绑
* @summary 绑定已有物联卡
* @param {CardDeviceBindingBindReq} cardDeviceBindingBindReq  CardDeviceBindingBindReq 将已有卡绑定到设备。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardDeviceBindingBind (
cardDeviceBindingBindReq: CardDeviceBindingBindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/device-binding/bind`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardDeviceBindingBind200Response>>(localVarPath, cardDeviceBindingBindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：在同一事务创建当前企业物联卡并绑定设备，逻辑层额外校验 operate 权限
* @summary 快捷创建物联卡并绑定
* @param {CardDeviceBindingCreateAndBindReq} cardDeviceBindingCreateAndBindReq  CardDeviceBindingCreateAndBindReq 快捷创建卡并绑定设备。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardDeviceBindingCreateAndBind (
cardDeviceBindingCreateAndBindReq: CardDeviceBindingCreateAndBindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/device-binding/create-and-bind`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardDeviceBindingCreateAndBind200Response>>(localVarPath, cardDeviceBindingCreateAndBindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按当前企业设备或卡分页查询绑定、换绑和解绑历史
* @summary 查询设备物联卡绑定历史
* @param {CardDeviceBindingGetListReq} cardDeviceBindingGetListReq  CardDeviceBindingGetListReq 分页查询当前企业绑定历史。
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardDeviceBindingGetList (
cardDeviceBindingGetListReq: CardDeviceBindingGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/device-binding/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardDeviceBindingGetList200Response>>(localVarPath, cardDeviceBindingGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按当前认证企业的设备主键查询活动绑定，未绑定时返回空 binding
* @summary 查询设备当前物联卡绑定
* @param {CardDeviceBindingGetOneReq} cardDeviceBindingGetOneReq  CardDeviceBindingGetOneReq 按当前企业设备查询活动绑定。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardDeviceBindingGetOne (
cardDeviceBindingGetOneReq: CardDeviceBindingGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/device-binding/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardDeviceBindingGetOne200Response>>(localVarPath, cardDeviceBindingGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：只读匹配当前企业卡和双方冲突，不创建卡或绑定
* @summary 匹配设备上报 ICCID
* @param {CardDeviceBindingMatchReq} cardDeviceBindingMatchReq  CardDeviceBindingMatchReq 按设备和 ICCID 匹配当前企业卡。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardDeviceBindingMatch (
cardDeviceBindingMatchReq: CardDeviceBindingMatchReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/device-binding/match`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardDeviceBindingMatch200Response>>(localVarPath, cardDeviceBindingMatchReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按当前企业绑定主键幂等解除活动关系，不修改设备上报 ICCID
* @summary 解绑设备物联卡
* @param {CardDeviceBindingUnbindReq} cardDeviceBindingUnbindReq  CardDeviceBindingUnbindReq 按当前企业绑定关系解绑。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardDeviceBindingUnbind (
cardDeviceBindingUnbindReq: CardDeviceBindingUnbindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/device-binding/unbind`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardDeviceBindingUnbind200Response>>(localVarPath, cardDeviceBindingUnbindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardDeviceBindingBind operation in CardDeviceBindingApi.
 */
export interface CardDeviceBindingApiPostApiV1ThingsCardDeviceBindingBindRequest {
    /**
     *  CardDeviceBindingBindReq 将已有卡绑定到设备。
     */
    readonly cardDeviceBindingBindReq: CardDeviceBindingBindReq
}

/**
 * Request parameters for postApiV1ThingsCardDeviceBindingCreateAndBind operation in CardDeviceBindingApi.
 */
export interface CardDeviceBindingApiPostApiV1ThingsCardDeviceBindingCreateAndBindRequest {
    /**
     *  CardDeviceBindingCreateAndBindReq 快捷创建卡并绑定设备。
     */
    readonly cardDeviceBindingCreateAndBindReq: CardDeviceBindingCreateAndBindReq
}

/**
 * Request parameters for postApiV1ThingsCardDeviceBindingGetList operation in CardDeviceBindingApi.
 */
export interface CardDeviceBindingApiPostApiV1ThingsCardDeviceBindingGetListRequest {
    /**
     *  CardDeviceBindingGetListReq 分页查询当前企业绑定历史。
     */
    readonly cardDeviceBindingGetListReq: CardDeviceBindingGetListReq

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
 * Request parameters for postApiV1ThingsCardDeviceBindingGetOne operation in CardDeviceBindingApi.
 */
export interface CardDeviceBindingApiPostApiV1ThingsCardDeviceBindingGetOneRequest {
    /**
     *  CardDeviceBindingGetOneReq 按当前企业设备查询活动绑定。
     */
    readonly cardDeviceBindingGetOneReq: CardDeviceBindingGetOneReq
}

/**
 * Request parameters for postApiV1ThingsCardDeviceBindingMatch operation in CardDeviceBindingApi.
 */
export interface CardDeviceBindingApiPostApiV1ThingsCardDeviceBindingMatchRequest {
    /**
     *  CardDeviceBindingMatchReq 按设备和 ICCID 匹配当前企业卡。
     */
    readonly cardDeviceBindingMatchReq: CardDeviceBindingMatchReq
}

/**
 * Request parameters for postApiV1ThingsCardDeviceBindingUnbind operation in CardDeviceBindingApi.
 */
export interface CardDeviceBindingApiPostApiV1ThingsCardDeviceBindingUnbindRequest {
    /**
     *  CardDeviceBindingUnbindReq 按当前企业绑定关系解绑。
     */
    readonly cardDeviceBindingUnbindReq: CardDeviceBindingUnbindReq
}
