import type { PostApiV1RoadDetectionExperimentGetRecords200Response } from '../models';
import type { PostApiV1RoadDetectionExperimentGetSlots200Response } from '../models';
import type { PostApiV1RoadDetectionExperimentSelectMix200Response } from '../models';
import type { PostApiV1RoadDetectionExperimentSubmit200Response } from '../models';
import type { SelectMixReq } from '../models';
import type { TestdataRecordsReq } from '../models';
import type { TestdataSlotsReq } from '../models';
import type { TestdataSubmitReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionExperimentApi - axios parameter creator
 */

/**
* 业务说明：按委托查询全部链结果【含历史版本与 Trace 展开】及当前全量锁定键，供报告侧只读引用与溯源
* @summary 按委托查询链结果
* @param {TestdataRecordsReq} testdataRecordsReq  链结果查询请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionExperimentGetRecords (
testdataRecordsReq: TestdataRecordsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/experiment/get-records`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionExperimentGetRecords200Response>>(localVarPath, testdataRecordsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按委托作业树节点聚合 pending_input 空槽投影【inputGroup 分组/required 必填/输入控件来源】，供试验数据录入表单渲染；槽位 key 与计算链 raw 键严格一致
* @summary 查询试验数据槽位投影
* @param {TestdataSlotsReq} testdataSlotsReq  试验数据槽位查询请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionExperimentGetSlots (
testdataSlotsReq: TestdataSlotsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/experiment/get-slots`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionExperimentGetSlots200Response>>(localVarPath, testdataSlotsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：作业树节点 6——检测员从三组试拌结果中选定实验室配合比【组别/预估配制强度/出具日期】单事务固化锁定键并推进节点完成；仅检测中委托且节点 2 已有配合比计算结果可用
* @summary 选定实验室配合比确认
* @param {SelectMixReq} selectMixReq  选定配合比确认请求（节点 6：检测员从三组试拌中选定实验室配合比并固化关键键值）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionExperimentSelectMix (
selectMixReq: SelectMixReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/experiment/select-mix`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionExperimentSelectMix200Response>>(localVarPath, selectMixReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按节点路由固定计算链执行【数值计算唯一入口】，链结果新版本落库【TraceLog 快照】+ 锁定键 upsert + 作业树推进；仅检测中委托可提交
* @summary 提交试验数据并跑链
* @param {TestdataSubmitReq} testdataSubmitReq  试验数据提交请求（跑链：委托 + 节点 + 原始数据 raw 键值）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionExperimentSubmit (
testdataSubmitReq: TestdataSubmitReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/experiment/submit`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionExperimentSubmit200Response>>(localVarPath, testdataSubmitReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionExperimentGetRecords operation in RoadDetectionExperimentApi.
 */
export interface RoadDetectionExperimentApiPostApiV1RoadDetectionExperimentGetRecordsRequest {
    /**
     *  链结果查询请求
     */
    readonly testdataRecordsReq: TestdataRecordsReq
}

/**
 * Request parameters for postApiV1RoadDetectionExperimentGetSlots operation in RoadDetectionExperimentApi.
 */
export interface RoadDetectionExperimentApiPostApiV1RoadDetectionExperimentGetSlotsRequest {
    /**
     *  试验数据槽位查询请求
     */
    readonly testdataSlotsReq: TestdataSlotsReq
}

/**
 * Request parameters for postApiV1RoadDetectionExperimentSelectMix operation in RoadDetectionExperimentApi.
 */
export interface RoadDetectionExperimentApiPostApiV1RoadDetectionExperimentSelectMixRequest {
    /**
     *  选定配合比确认请求（节点 6：检测员从三组试拌中选定实验室配合比并固化关键键值）
     */
    readonly selectMixReq: SelectMixReq
}

/**
 * Request parameters for postApiV1RoadDetectionExperimentSubmit operation in RoadDetectionExperimentApi.
 */
export interface RoadDetectionExperimentApiPostApiV1RoadDetectionExperimentSubmitRequest {
    /**
     *  试验数据提交请求（跑链：委托 + 节点 + 原始数据 raw 键值）
     */
    readonly testdataSubmitReq: TestdataSubmitReq
}
