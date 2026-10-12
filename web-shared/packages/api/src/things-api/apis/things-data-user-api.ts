import type { DataUserGetListReq } from '../models';
import type { PostApiV1ThingsDataUserGetList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDataUserApi - axios parameter creator
 */

/**
* 查询指定区域下已授权的用户列表，支持传入多个区域ID。仅项目管理员或租户管理员可调用。
* @summary 获取有区域权限的用户列表
* @param {DataUserGetListReq} dataUserGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDataUserGetList (
dataUserGetListReq: DataUserGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/data/user/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDataUserGetList200Response>>(localVarPath, dataUserGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDataUserGetList operation in ThingsDataUserApi.
 */
export interface ThingsDataUserApiPostApiV1ThingsDataUserGetListRequest {
    readonly dataUserGetListReq: DataUserGetListReq
}
