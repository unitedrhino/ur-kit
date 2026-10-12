/**
 * org-iot-client 设备看板 API 封装。
 *
 * 本文件只聚合设备属性看板需要的 ThingsApi 能力，项目作用域继续由应用级
 * request interceptor 注入，避免页面层自行拼接虚假的 projectID。
 */
import type { ThingsApi } from '@vben/api';

import { ThingsApi as ThingsApiClient } from '@vben/api';

/** PropertyAggItem 描述单个属性聚合请求。 */
export interface PropertyAggItem {
  /** 聚合函数名称，例如 last、sum、avg。 */
  argFuncs: string[];
  /** 物模型属性标识符。 */
  dataID: string;
}

/** PropertyAggQuery 是历史属性分析接口的页面入参。 */
export interface PropertyAggQuery {
  /** 聚合定义列表。 */
  aggs: PropertyAggItem[];
  /** 设备 ID。 */
  deviceName: string;
  /** 调试说明，透传给后端便于定位。 */
  debugText?: string;
  /** 聚合间隔数值。 */
  interval: number;
  /** 聚合间隔单位。 */
  intervalUnit: string;
  /** 产品 ID。 */
  productID: string;
  /** 当前项目 ID，只有设备详情明确返回时才传。 */
  projectID?: string;
  /** 结束毫秒时间戳。 */
  timeEnd: string;
  /** 结束时间文本。 */
  timeEndText?: string;
  /** 开始毫秒时间戳。 */
  timeStart: string;
  /** 开始时间文本。 */
  timeStartText?: string;
}

/** getDeviceInfoWithProperties 读取设备核心信息和当前属性值。 */
async function getDeviceInfoWithProperties(deviceName: string, productID: string) {
  return await ThingsApiClient.postApiV1ThingsDeviceInfoGetOne({
    deviceName,
    productID,
    propertyIgnoreEmpty: true,
    withGateway: true,
    withProperties: [],
  });
}

/** getDeviceSchemas 读取设备物模型，用于看板属性名称和历史筛选。 */
async function getDeviceSchemas(deviceName: string, productID: string) {
  return await ThingsApiClient.postApiV1ThingsDeviceSchemaGetList({
    deviceName,
    productID,
    withProductSchema: true,
  });
}

/** getPropertyAggList 查询属性历史聚合数据；空 projectID 不会覆盖全局项目注入。 */
async function getPropertyAggList(params: PropertyAggQuery) {
  const request = {
    aggs: params.aggs,
    debugText: params.debugText,
    deviceName: params.deviceName,
    interval: params.interval,
    intervalUnit: params.intervalUnit,
    productID: params.productID,
    timeEnd: params.timeEnd,
    timeEndText: params.timeEndText,
    timeStart: params.timeStart,
    timeStartText: params.timeStartText,
    ...(params.projectID ? { projectID: params.projectID } : {}),
  };
  return await ThingsApiClient.postApiV1ThingsDeviceMsgPropertyAggGetList(request as any);
}

/** DeviceInfoApi 汇总设备属性看板需要的后端访问方法。 */
export const DeviceInfoApi = {
  getDeviceInfoWithProperties,
  getDeviceSchemas,
  getPropertyAggList,
};

export type { ThingsApi };
