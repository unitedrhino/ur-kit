import type { PostApiV1RoadDetectionVersionCompare200Response } from '../models';
import type { PostApiV1RoadDetectionVersionCreate200Response } from '../models';
import type { PostApiV1RoadDetectionVersionGetHistory200Response } from '../models';
import type { PostApiV1RoadDetectionVersionGetList200Response } from '../models';
import type { PostApiV1RoadDetectionVersionGetLockStatus200Response } from '../models';
import type { VersionCompareReq } from '../models';
import type { VersionCreateReq } from '../models';
import type { VersionGetHistoryReq } from '../models';
import type { VersionGetListReq } from '../models';
import type { VersionGetLockStatusReq } from '../models';
import type { VersionSetCurrentReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionVersionApi - axios parameter creator
 */

/**
* 业务说明：按两条台账记录 ID 并排对比 changeLog【校验同租户同域同引用码，跨引用码对比拒绝】，返回两侧变更条目清单供差异高亮渲染
* @summary 版本对比
* @param {VersionCompareReq} versionCompareReq  版本对比请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionVersionCompare (
versionCompareReq: VersionCompareReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/version/compare`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionVersionCompare200Response>>(localVarPath, versionCompareReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：登记新版本到台账【changeLog 结构校验：type 仅 add/delete/modify】；status 可 draft 或 current——current 时同事务将同域同引用码旧 current 置 archived（同引用码仅一个 current）；同域同引用码同版本号重复登记拒绝
* @summary 登记新版本
* @param {VersionCreateReq} versionCreateReq  登记新版本请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionVersionCreate (
versionCreateReq: VersionCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/version/create`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionVersionCreate200Response>>(localVarPath, versionCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按台账域与引用码返回版本时间线【登记顺序倒序，current 版标记 isCurrent】，供版本中心时间线视图
* @summary 获取版本时间线
* @param {VersionGetHistoryReq} versionGetHistoryReq  版本时间线请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionVersionGetHistory (
versionGetHistoryReq: VersionGetHistoryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/version/get-history`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionVersionGetHistory200Response>>(localVarPath, versionGetHistoryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询版本台账列表【spec/template/project 三域通用登记册】，支持台账域/状态/引用码过滤，按登记时间倒序；每页大小上限 200
* @summary 获取版本台账列表
* @param {VersionGetListReq} versionGetListReq  版本台账列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionVersionGetList (
versionGetListReq: VersionGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/version/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionVersionGetList200Response>>(localVarPath, versionGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按实例 ID 返回版本锁定状态【逐项比对锁定值与当前值：链版本=锁定快照 vs calc 常量 / 模板版本=锁定快照 vs 台账 template 域 current / 包版本=锁定值 vs 作业包 Version】；锁定值为空数组视为一致（历史实例不提示），台账无登记视为一致；不一致项附台账 changeLog 摘要作提示文案数据源（提示不回溯，报告值一律不动）
* @summary 获取实例版本锁定状态
* @param {VersionGetLockStatusReq} versionGetLockStatusReq  实例版本锁定状态请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionVersionGetLockStatus (
versionGetLockStatusReq: VersionGetLockStatusReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/version/get-lock-status`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionVersionGetLockStatus200Response>>(localVarPath, versionGetLockStatusReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将指定台账记录设为当前版【单事务：同域同引用码旧 current 置 archived，本条置 current】；仅 draft/archived 状态可设，current 态重复设置拒绝
* @summary 设为当前版本
* @param {VersionSetCurrentReq} versionSetCurrentReq  设为当前版本请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionVersionSetCurrent (
versionSetCurrentReq: VersionSetCurrentReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/version/set-current`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionVersionCreate200Response>>(localVarPath, versionSetCurrentReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionVersionCompare operation in RoadDetectionVersionApi.
 */
export interface RoadDetectionVersionApiPostApiV1RoadDetectionVersionCompareRequest {
    /**
     *  版本对比请求
     */
    readonly versionCompareReq: VersionCompareReq
}

/**
 * Request parameters for postApiV1RoadDetectionVersionCreate operation in RoadDetectionVersionApi.
 */
export interface RoadDetectionVersionApiPostApiV1RoadDetectionVersionCreateRequest {
    /**
     *  登记新版本请求
     */
    readonly versionCreateReq: VersionCreateReq
}

/**
 * Request parameters for postApiV1RoadDetectionVersionGetHistory operation in RoadDetectionVersionApi.
 */
export interface RoadDetectionVersionApiPostApiV1RoadDetectionVersionGetHistoryRequest {
    /**
     *  版本时间线请求
     */
    readonly versionGetHistoryReq: VersionGetHistoryReq
}

/**
 * Request parameters for postApiV1RoadDetectionVersionGetList operation in RoadDetectionVersionApi.
 */
export interface RoadDetectionVersionApiPostApiV1RoadDetectionVersionGetListRequest {
    /**
     *  版本台账列表请求
     */
    readonly versionGetListReq: VersionGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionVersionGetLockStatus operation in RoadDetectionVersionApi.
 */
export interface RoadDetectionVersionApiPostApiV1RoadDetectionVersionGetLockStatusRequest {
    /**
     *  实例版本锁定状态请求
     */
    readonly versionGetLockStatusReq: VersionGetLockStatusReq
}

/**
 * Request parameters for postApiV1RoadDetectionVersionSetCurrent operation in RoadDetectionVersionApi.
 */
export interface RoadDetectionVersionApiPostApiV1RoadDetectionVersionSetCurrentRequest {
    /**
     *  设为当前版本请求
     */
    readonly versionSetCurrentReq: VersionSetCurrentReq
}
