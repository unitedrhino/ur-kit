/**
 * 设备日志页面 API 封装。
 *
 * 仅聚合现有 ThingsApi 日志接口，不改变后端协议，也不主动传 projectID，
 * org-iot-client 的项目作用域继续由应用级 request interceptor 注入。
 */

import type { ThingsApi } from '@vben/api';

import { ThingsApi as ThingsApiClient } from '@vben/api';

import { extractList } from '../../../../utils/api-response';

/** DeviceLogQuery 是四类日志查询共享的基础参数。 */
export interface DeviceLogQuery {
  /** 设备 ID。 */
  deviceName: string;
  /** 当前页，从 1 开始。 */
  page: number;
  /** 产品 ID。 */
  productID: string;
  /** 每页条数。 */
  size: number;
  /** 结束毫秒时间戳。 */
  timeEnd?: string;
  /** 开始毫秒时间戳。 */
  timeStart?: string;
}

/** ThingModelLogSourceResult 是物模型多源日志的原始返回。 */
export interface ThingModelLogSourceResult {
  /** 行为调用日志，来自 send-log(actionSend)。 */
  actionLogs: ThingsApi.DeviceMsgSendLogInfo[];
  /** 事件上报日志。 */
  eventLogs: ThingsApi.DeviceMsgEventLogInfo[];
  /** 属性诊断兜底日志，只有 property-log 不可用时才会有值。 */
  propertyHubLogs: ThingsApi.DeviceMsgHubLogInfo[];
  /** 属性历史日志。 */
  propertyLogs: ThingsApi.DeviceMsgPropertyLogInfo[];
}

function buildPage(query: DeviceLogQuery) {
  return {
    page: query.page,
    size: query.size,
  };
}

/** getDeviceInfo 读取日志页顶部展示所需的设备核心信息。 */
async function getDeviceInfo(query: Pick<DeviceLogQuery, 'deviceName' | 'productID'>) {
  return await ThingsApiClient.postApiV1ThingsDeviceInfoGetOne({
    deviceName: query.deviceName,
    isOnlyCore: true,
    productID: query.productID,
    propertyIgnoreEmpty: true,
    withProperties: [],
  });
}

/** getDeviceSchemas 读取设备物模型，用于把 dataID 翻译成业务名称。 */
async function getDeviceSchemas(query: Pick<DeviceLogQuery, 'deviceName' | 'productID'>) {
  const response = await ThingsApiClient.postApiV1ThingsDeviceSchemaGetList({
    deviceName: query.deviceName,
    page: { page: 1, size: 500 },
    productID: query.productID,
    withProductSchema: true,
  });
  return extractList<ThingsApi.DeviceSchema>(response);
}

/** getStatusLogs 查询设备上下线日志。 */
async function getStatusLogs(query: DeviceLogQuery) {
  const response = await ThingsApiClient.postApiV1ThingsDeviceMsgStatusLogGetList({
    deviceName: query.deviceName,
    page: buildPage(query),
    productID: query.productID,
    timeEnd: query.timeEnd,
    timeStart: query.timeStart,
  });
  return extractList<ThingsApi.DeviceMsgStatusLogInfo>(response);
}

/** getControlLogs 查询设备控制日志。 */
async function getControlLogs(query: DeviceLogQuery) {
  const response = await ThingsApiClient.postApiV1ThingsDeviceMsgSendLogGetList({
    actions: ['propertyControlSend', 'propertyGetReportSend', 'actionSend'],
    deviceName: query.deviceName,
    page: buildPage(query),
    productID: query.productID,
    timeEnd: query.timeEnd,
    timeStart: query.timeStart,
    withUser: true,
  });
  return extractList<ThingsApi.DeviceMsgSendLogInfo>(response);
}

/** getDebugLogs 查询云端诊断日志。 */
async function getDebugLogs(query: DeviceLogQuery) {
  const response = await ThingsApiClient.postApiV1ThingsDeviceMsgHubLogGetList({
    actions: ['connected', 'disconnected', 'property', 'event', 'action', 'thing', 'gateway'],
    deviceName: query.deviceName,
    page: buildPage(query),
    productID: query.productID,
    timeEnd: query.timeEnd,
    timeStart: query.timeStart,
  });
  return extractList<ThingsApi.DeviceMsgHubLogInfo>(response);
}

/** getPropertyLogsOrFallback 按设备物模型的属性标识批量读取历史，避免无 dataID 的无效请求。 */
async function getPropertyLogsOrFallback(query: DeviceLogQuery, dataIDs: string[]) {
  if (dataIDs.length === 0) return { propertyHubLogs: [], propertyLogs: [] };
  try {
    const response = await ThingsApiClient.postApiV1ThingsDeviceMsgPropertyLogBatchGetList({
      reqs: [...new Set(dataIDs)].map((dataID) => ({
        dataID,
        deviceName: query.deviceName,
        order: 2,
        page: buildPage(query),
        productID: query.productID,
        timeEnd: query.timeEnd,
        timeStart: query.timeStart,
      })),
    });
    return {
      propertyHubLogs: [],
      propertyLogs: (response.lists ?? []).flatMap((list) => list ?? []),
    };
  } catch {
    const response = await ThingsApiClient.postApiV1ThingsDeviceMsgHubLogGetList({
      actions: ['property'],
      deviceName: query.deviceName,
      page: buildPage(query),
      productID: query.productID,
      timeEnd: query.timeEnd,
      timeStart: query.timeStart,
    });
    return {
      propertyHubLogs: extractList<ThingsApi.DeviceMsgHubLogInfo>(response),
      propertyLogs: [],
    };
  }
}

/** getThingModelLogs 查询属性、事件、行为三类物模型语义日志。 */
async function getThingModelLogs(query: DeviceLogQuery, dataIDs: string[]): Promise<ThingModelLogSourceResult> {
  const [propertyResult, eventResponse, actionResponse] = await Promise.all([
    getPropertyLogsOrFallback(query, dataIDs),
    ThingsApiClient.postApiV1ThingsDeviceMsgEventLogGetList({
      deviceNames: [query.deviceName],
      page: buildPage(query),
      productID: query.productID,
      timeEnd: query.timeEnd,
      timeStart: query.timeStart,
    }),
    ThingsApiClient.postApiV1ThingsDeviceMsgSendLogGetList({
      actions: ['actionSend'],
      deviceName: query.deviceName,
      page: buildPage(query),
      productID: query.productID,
      timeEnd: query.timeEnd,
      timeStart: query.timeStart,
      withUser: true,
    }),
  ]);

  return {
    actionLogs: extractList<ThingsApi.DeviceMsgSendLogInfo>(actionResponse),
    eventLogs: extractList<ThingsApi.DeviceMsgEventLogInfo>(eventResponse),
    propertyHubLogs: propertyResult.propertyHubLogs,
    propertyLogs: propertyResult.propertyLogs,
  };
}

/** DeviceLogsApi 汇总日志页需要的所有后端访问方法。 */
export const DeviceLogsApi = {
  getControlLogs,
  getDebugLogs,
  getDeviceInfo,
  getDeviceSchemas,
  getStatusLogs,
  getThingModelLogs,
};
