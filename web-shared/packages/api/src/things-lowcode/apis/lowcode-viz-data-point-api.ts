import type { GetApiV1LowcodeVizDataPointGetList200Response } from '../models';
import type { PostApiV1LowcodeRuleChainDetailUpdate200Response } from '../models';
import type { VizDataPointBatchSendPropertyReq } from '../models';
import type { VizDataPointGetListReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * LowcodeVizDataPointApi - axios parameter creator
 */

/**
* 业务说明：数据点读取
* @summary 数据点读取
* @param {number} [bodyParam.vizID] 分组的标识符
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1LowcodeVizDataPointGetList (bodyParam: { vizID?: number; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/data-point/get-list`;
        if ((bodyParam as Record<string, unknown>)['vizID'] !== undefined) {
            localVarQueryParameter['vizID'] = (bodyParam as Record<string, unknown>)['vizID'];
        }
    return requestClient.get<ExtractDataType<GetApiV1LowcodeVizDataPointGetList200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量调用设备属性
* @summary 批量调用设备属性
* @param {VizDataPointBatchSendPropertyReq} vizDataPointBatchSendPropertyReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizDataPointControlBatchSend (
vizDataPointBatchSendPropertyReq: VizDataPointBatchSendPropertyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/data-point/control-batch-send`;
    return requestClient.post<ExtractDataType<PostApiV1LowcodeRuleChainDetailUpdate200Response>>(localVarPath, vizDataPointBatchSendPropertyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：数据点读取
* @summary 数据点读取
* @param {VizDataPointGetListReq} vizDataPointGetListReq  VizGroup 定义可视化
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1LowcodeVizDataPointGetList (
vizDataPointGetListReq: VizDataPointGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/lowcode/viz/data-point/get-list`;
    return requestClient.post<ExtractDataType<GetApiV1LowcodeVizDataPointGetList200Response>>(localVarPath, vizDataPointGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for getApiV1LowcodeVizDataPointGetList operation in LowcodeVizDataPointApi.
 */
export interface LowcodeVizDataPointApiGetApiV1LowcodeVizDataPointGetListRequest {
    /**
     * 分组的标识符
     */
    readonly vizID?: number
}

/**
 * Request parameters for postApiV1LowcodeVizDataPointControlBatchSend operation in LowcodeVizDataPointApi.
 */
export interface LowcodeVizDataPointApiPostApiV1LowcodeVizDataPointControlBatchSendRequest {
    readonly vizDataPointBatchSendPropertyReq: VizDataPointBatchSendPropertyReq
}

/**
 * Request parameters for postApiV1LowcodeVizDataPointGetList operation in LowcodeVizDataPointApi.
 */
export interface LowcodeVizDataPointApiPostApiV1LowcodeVizDataPointGetListRequest {
    /**
     *  VizGroup 定义可视化
     */
    readonly vizDataPointGetListReq: VizDataPointGetListReq
}
