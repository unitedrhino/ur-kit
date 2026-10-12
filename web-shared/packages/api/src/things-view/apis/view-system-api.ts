import type { EnergyDashboardQueryReq } from '../models';
import type { PostApiV1ViewSystemEnergyDashboardDeviceStatus200Response } from '../models';
import type { PostApiV1ViewSystemEnergyDashboardOverview200Response } from '../models';
import type { PostApiV1ViewSystemUptime200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewSystemApi - axios parameter creator
 */

/**
* 业务说明：查询能源大屏设备状态统计，返回在线、离线、未激活和总数，并输出可直接绑定环图的数据集结构。用于系统内置能源大屏数据集消费。
* @summary 获取能源大屏设备状态统计
* @param {EnergyDashboardQueryReq} energyDashboardQueryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewSystemEnergyDashboardDeviceStatus (
energyDashboardQueryReq: EnergyDashboardQueryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/system/energy/dashboard/device-status`;
    return requestClient.post<ExtractDataType<PostApiV1ViewSystemEnergyDashboardDeviceStatus200Response>>(localVarPath, energyDashboardQueryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询能源大屏顶部统计数据，返回实时功率、今日用电、平均功率、最小功率和最大功率。用于系统内置能源大屏数据集消费。
* @summary 获取能源大屏顶部统计
* @param {EnergyDashboardQueryReq} energyDashboardQueryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewSystemEnergyDashboardOverview (
energyDashboardQueryReq: EnergyDashboardQueryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/system/energy/dashboard/overview`;
    return requestClient.post<ExtractDataType<PostApiV1ViewSystemEnergyDashboardOverview200Response>>(localVarPath, energyDashboardQueryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询可视化服务运行时长。用于系统运行状态展示。
* @summary 获取平台运行时间
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewSystemUptime (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/system/uptime`;
    return requestClient.post<ExtractDataType<PostApiV1ViewSystemUptime200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewSystemEnergyDashboardDeviceStatus operation in ViewSystemApi.
 */
export interface ViewSystemApiPostApiV1ViewSystemEnergyDashboardDeviceStatusRequest {
    readonly energyDashboardQueryReq: EnergyDashboardQueryReq
}

/**
 * Request parameters for postApiV1ViewSystemEnergyDashboardOverview operation in ViewSystemApi.
 */
export interface ViewSystemApiPostApiV1ViewSystemEnergyDashboardOverviewRequest {
    readonly energyDashboardQueryReq: EnergyDashboardQueryReq
}

/**
 * Request parameters for postApiV1ViewSystemUptime operation in ViewSystemApi.
 */
export interface ViewSystemApiPostApiV1ViewSystemUptimeRequest {
    readonly body: object
}
