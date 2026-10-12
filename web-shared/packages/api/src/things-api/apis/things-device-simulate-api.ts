import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { SimulateReportReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceSimulateApi - axios parameter creator
 */

/**
* 业务说明：单次向指定设备注入一批属性模拟值【AI 数据任务工具的写入底座，走标准属性上报链路，属性历史/场景联动/告警/WS 推送自动生效】。属性值统一传字符串，平台按物模型类型自动转换；任一属性非法则整体报错不做部分写入。
* @summary 模拟数据上报
* @param {SimulateReportReq} simulateReportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceSimulateReport (
simulateReportReq: SimulateReportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/simulate/report`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, simulateReportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceSimulateReport operation in ThingsDeviceSimulateApi.
 */
export interface ThingsDeviceSimulateApiPostApiV1ThingsDeviceSimulateReportRequest {
    readonly simulateReportReq: SimulateReportReq
}
