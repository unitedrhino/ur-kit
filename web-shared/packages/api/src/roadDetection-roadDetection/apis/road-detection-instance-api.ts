import type { InstanceCreateReq } from '../models';
import type { InstanceGetListReq } from '../models';
import type { InstanceSaveDataReq } from '../models';
import type { PostApiV1RoadDetectionCommissionDelete200Response } from '../models';
import type { PostApiV1RoadDetectionInstanceCreate200Response } from '../models';
import type { PostApiV1RoadDetectionInstanceGenerate200Response } from '../models';
import type { PostApiV1RoadDetectionInstanceGetList200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionInstanceApi - axios parameter creator
 */

/**
* 确认预览的生成结果并落库（状态 draft → generated）
* @summary 确认生成结果
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionInstanceConfirm (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/instance/confirm`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 创建一个数据实例（一次完整的报告生成），自动生成编号
* @summary 创建数据实例
* @param {InstanceCreateReq} instanceCreateReq  数据实例创建请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionInstanceCreate (
instanceCreateReq: InstanceCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/instance/create`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionInstanceCreate200Response>>(localVarPath, instanceCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除数据实例及其数据
* @summary 删除数据实例
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionInstanceDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/instance/delete`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 根据关联关系从数据源表生成各模板数据，返回预览（未落库确认）
* @summary 生成报告（预览）
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionInstanceGenerate (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/instance/generate`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionInstanceGenerate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 分页查询数据实例列表
* @summary 获取数据实例列表
* @param {InstanceGetListReq} instanceGetListReq  数据实例列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionInstanceGetList (
instanceGetListReq: InstanceGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/instance/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionInstanceGetList200Response>>(localVarPath, instanceGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按 ID 获取数据实例详情（各模板数据）
* @summary 获取数据实例详情
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionInstanceGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/instance/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionInstanceGenerate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 保存某个数据源模板的填写数据
* @summary 保存数据源表数据
* @param {InstanceSaveDataReq} instanceSaveDataReq  数据实例保存数据请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionInstanceSaveData (
instanceSaveDataReq: InstanceSaveDataReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/instance/save-data`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionDelete200Response>>(localVarPath, instanceSaveDataReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionInstanceConfirm operation in RoadDetectionInstanceApi.
 */
export interface RoadDetectionInstanceApiPostApiV1RoadDetectionInstanceConfirmRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionInstanceCreate operation in RoadDetectionInstanceApi.
 */
export interface RoadDetectionInstanceApiPostApiV1RoadDetectionInstanceCreateRequest {
    /**
     *  数据实例创建请求
     */
    readonly instanceCreateReq: InstanceCreateReq
}

/**
 * Request parameters for postApiV1RoadDetectionInstanceDelete operation in RoadDetectionInstanceApi.
 */
export interface RoadDetectionInstanceApiPostApiV1RoadDetectionInstanceDeleteRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionInstanceGenerate operation in RoadDetectionInstanceApi.
 */
export interface RoadDetectionInstanceApiPostApiV1RoadDetectionInstanceGenerateRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionInstanceGetList operation in RoadDetectionInstanceApi.
 */
export interface RoadDetectionInstanceApiPostApiV1RoadDetectionInstanceGetListRequest {
    /**
     *  数据实例列表请求
     */
    readonly instanceGetListReq: InstanceGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionInstanceGetOne operation in RoadDetectionInstanceApi.
 */
export interface RoadDetectionInstanceApiPostApiV1RoadDetectionInstanceGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionInstanceSaveData operation in RoadDetectionInstanceApi.
 */
export interface RoadDetectionInstanceApiPostApiV1RoadDetectionInstanceSaveDataRequest {
    /**
     *  数据实例保存数据请求
     */
    readonly instanceSaveDataReq: InstanceSaveDataReq
}
