import type { CardSettingEffectiveReq } from '../models';
import type { CardSettingResetReq } from '../models';
import type { CardSettingUpdateReq } from '../models';
import type { PostApiV1ThingsCardSettingGetEffective200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardSettingApi - axios parameter creator
 */

/**
* 业务说明：按 ICCID 合并企业默认设置与卡级覆盖设置
* @summary 查询卡有效设置
* @param {CardSettingEffectiveReq} cardSettingEffectiveReq  CardSettingEffectiveReq 查询租户与卡级合并设置。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardSettingGetEffective (
cardSettingEffectiveReq: CardSettingEffectiveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/setting/get-effective`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardSettingGetEffective200Response>>(localVarPath, cardSettingEffectiveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询当前企业设置，不存在时返回稳定系统默认值
* @summary 查询企业默认卡设置
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardSettingGetOne (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/setting/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardSettingGetEffective200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：租户作用域恢复系统默认，卡作用域删除覆盖并回退企业默认
* @summary 恢复默认卡设置
* @param {CardSettingResetReq} cardSettingResetReq  CardSettingResetReq 恢复指定作用域默认设置。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardSettingReset (
cardSettingResetReq: CardSettingResetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/setting/reset`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardSettingGetEffective200Response>>(localVarPath, cardSettingResetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按乐观版本全量更新企业默认或卡级设置
* @summary 更新卡设置
* @param {CardSettingUpdateReq} cardSettingUpdateReq  CardSettingUpdateReq 全量替换指定作用域设置。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardSettingUpdate (
cardSettingUpdateReq: CardSettingUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/setting/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardSettingGetEffective200Response>>(localVarPath, cardSettingUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardSettingGetEffective operation in CardSettingApi.
 */
export interface CardSettingApiPostApiV1ThingsCardSettingGetEffectiveRequest {
    /**
     *  CardSettingEffectiveReq 查询租户与卡级合并设置。
     */
    readonly cardSettingEffectiveReq: CardSettingEffectiveReq
}

/**
 * Request parameters for postApiV1ThingsCardSettingReset operation in CardSettingApi.
 */
export interface CardSettingApiPostApiV1ThingsCardSettingResetRequest {
    /**
     *  CardSettingResetReq 恢复指定作用域默认设置。
     */
    readonly cardSettingResetReq: CardSettingResetReq
}

/**
 * Request parameters for postApiV1ThingsCardSettingUpdate operation in CardSettingApi.
 */
export interface CardSettingApiPostApiV1ThingsCardSettingUpdateRequest {
    /**
     *  CardSettingUpdateReq 全量替换指定作用域设置。
     */
    readonly cardSettingUpdateReq: CardSettingUpdateReq
}
