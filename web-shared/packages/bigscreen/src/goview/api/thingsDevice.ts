import { ThingsApi } from '@vben/api';
import { useProjectStore } from '@vben/stores';

import { post } from '@/api/http';

const THINGS = '/api/v1/things';

type PageReq = {
  page: number;
  size: number;
};

const hasMeaningfulValue = (value: unknown) => value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null';

/** 获取产品列表 */
export const getProductList = (params?: { areaID?: string; areaIDPath?: string; page?: PageReq }) => post(`${THINGS}/product/info/get-list`, params ?? {});

/** 获取产品品类列表 */
export const getProductCategoryList = (params?: {
  code?: string;
  ids?: number[];
  name?: string;
  page?: PageReq;
  parentID?: string;
  projectID?: number | string;
}) =>
  ThingsApi.postApiV1ThingsProductCategoryGetList({
    page: params?.page ?? { page: 1, size: 1000 },
    ...(params?.code ? { code: params.code } : {}),
    ...(params?.ids?.length ? { ids: params.ids } : {}),
    ...(params?.name ? { name: params.name } : {}),
    ...(params?.parentID ? { parentID: params.parentID } : {}),
    ...(params?.projectID !== undefined && params?.projectID !== null && params?.projectID !== '' ? { projectID: String(params.projectID) } : {}),
  });

/** 获取某个产品品类自身绑定的物模型标识符 */
export const getProductCategorySchemaList = (params: { productCategoryID: number | string; withFather?: boolean }) =>
  ThingsApi.postApiV1ThingsProductCategorySchemaGetList({
    productCategoryID: String(params.productCategoryID),
    ...(params.withFather === undefined ? {} : { withFather: params.withFather }),
  });

/** 获取设备列表，支持按产品、区域、名称/别名过滤 */
export const getDeviceList = (params: {
  areaID?: string;
  areaIDs?: string[];
  deviceAlias?: string;
  deviceName?: string;
  deviceNameOrAlias?: string;
  page?: PageReq;
  productCategoryCode?: string;
  productCategoryID?: number | string;
  productID?: string;
}) => post(`${THINGS}/device/info/get-list`, params ?? {});

export const getDeviceInfoOne = (params: { deviceName: string; productID: string }) => post(`${THINGS}/device/info/get-one`, params ?? {});

/** 获取当前用户可见区域树 */
export const getUserAreaTree = (params?: { projectID?: string }) => {
  const projectStore = useProjectStore();
  const projectID = params?.projectID || projectStore.currentProjectID || undefined;
  return post(`${THINGS}/area/info/get-list`, {
    page: { page: 1, size: 1000 },
    ...(projectID ? { projectID } : {}),
  });
};

/** 获取产品物模型属性定义（type=1 为属性） */
export const getProductSchema = (params: { productID: string; type?: number }) => post(`${THINGS}/product/schema/get-list`, { type: 1, ...params });

/** 获取通用品类物模型属性定义（type=1 为属性） */
export const getCommonSchema = (params: { page?: PageReq; productCategoryCode?: string; productCategoryID?: number | string; type?: number }) =>
  ThingsApi.postApiV1ThingsSchemaCommonGetList({
    page: params.page ?? { page: 1, size: 1000 },
    type: params.type ?? 1,
    ...(params.productCategoryCode ? { productCategoryCode: params.productCategoryCode } : {}),
    ...(hasMeaningfulValue(params.productCategoryID) ? { productCategoryID: String(params.productCategoryID) } : {}),
  });

/** 获取设备属性最新值 */
export const getPropertyLatest = (params: { dataIDs: string[]; deviceName: string; productID: string }) =>
  post(`${THINGS}/device/msg/property-latest/get-list`, params ?? {});

/** 获取设备属性聚合数据（支持单设备多属性 / 多设备单属性 / 单设备单属性多聚合） */
export const getPropertyAgg = (params: {
  aggFunc?: string;
  aggFuncs?: string[];
  dataID?: string;
  dataIDs?: string[];
  deviceName?: string;
  deviceNames?: string[];
  interval?: number;
  intervalUnit?: string;
  productCategoryCode?: string;
  productCategoryID?: number | string;
  productID?: string;
  timeEnd: number;
  timeStart: number;
}) => {
  const body: any = {
    interval: params.interval ?? 1,
    intervalUnit: params.intervalUnit ?? 'h',
    timeStart: String(params.timeStart),
    timeEnd: String(params.timeEnd),
  };
  if (params.productID) body.productID = params.productID;
  if (params.productCategoryCode) body.productCategoryCode = params.productCategoryCode;
  if (hasMeaningfulValue(params.productCategoryID)) {
    body.productCategoryID = params.productCategoryID;
  }
  if (params.deviceName) body.deviceName = params.deviceName;
  if (params.deviceNames?.length) body.deviceNames = params.deviceNames;
  const funcs = params.aggFuncs?.length ? params.aggFuncs : [params.aggFunc ?? 'last'];
  let ids = params.dataIDs?.length ? params.dataIDs : [];
  if (ids.length === 0 && params.dataID) {
    ids = [params.dataID];
  }
  body.aggs = ids.map((id: string) => ({ dataID: id, argFuncs: funcs }));
  return post(`${THINGS}/device/msg/property-agg/get-list`, body);
};

/** 聚合属性历史记录（property-log-agg/get-list） */
export const getPropertyLogAgg = (params: {
  aggs: { argFuncs: string[]; dataID: string; noFirstTs?: boolean }[];
  areaIDs?: number[];
  deviceName?: string;
  deviceNames?: string[];
  interval: number;
  intervalUnit: string;
  partitionBy?: string;
  productCategoryCode?: string;
  productCategoryID?: number;
  productID?: string;
  projectID?: number;
  timeEnd: number;
  timeStart: number;
}) => {
  const body: any = {
    ...params,
    timeStart: String(params.timeStart),
    timeEnd: String(params.timeEnd),
  };
  return post(`${THINGS}/device/msg/property-log-agg/get-list`, body);
};

/** 获取设备属性历史记录（原始数据，用于前端聚合）；deviceName 不传时按 dataID 查询（实现层已兼容） */
export const getPropertyLogList = (params: {
  areaIDs?: Array<number | string>;
  argFunc?: string;
  dataID: string;
  deviceName?: string;
  fill?: string;
  interval?: number;
  intervalUnit?: string;
  order?: number;
  page?: number;
  pageSize?: number;
  partitionBy?: string;
  productCategoryCode?: string;
  productCategoryID?: number | string;
  productID?: string;
  timeEnd: number;
  timeStart: number;
}) => {
  const body: any = {
    dataID: params.dataID,
    ...(params.deviceName ? { deviceName: params.deviceName } : {}),
    ...(params.argFunc ? { argFunc: params.argFunc } : {}),
    ...(params.fill ? { fill: params.fill } : {}),
    ...(params.interval ? { interval: params.interval } : {}),
    ...(params.intervalUnit ? { intervalUnit: params.intervalUnit } : {}),
    ...(params.order ? { order: params.order } : {}),
    ...(params.partitionBy ? { partitionBy: params.partitionBy } : {}),
  };
  if (params.page || params.pageSize || (!params.interval && !params.argFunc)) {
    body.page = { page: params.page ?? 1, size: params.pageSize ?? 500 };
  }
  if (params.areaIDs?.length) body.areaIDs = params.areaIDs;
  if (hasMeaningfulValue(params.timeStart)) body.timeStart = String(params.timeStart);
  if (hasMeaningfulValue(params.timeEnd)) body.timeEnd = String(params.timeEnd);
  if (params.productID) body.productID = params.productID;
  if (params.productCategoryCode) body.productCategoryCode = params.productCategoryCode;
  if (hasMeaningfulValue(params.productCategoryID)) {
    body.productCategoryID = params.productCategoryID;
  }
  return post(`${THINGS}/device/msg/property-log/get-list`, body);
};

/** 批量获取设备属性历史时序 */
export const getPropertyLogBatch = (params: {
  aggFunc?: string;
  aggInterval?: string;
  dataIDs: string[];
  deviceName: string;
  endTime: number;
  productCategoryCode?: string;
  productCategoryID?: number | string;
  productID?: string;
  startTime: number;
}) => {
  const reqs = params.dataIDs.map((dataID) => ({
    ...(params.productID ? { productID: params.productID } : {}),
    ...(params.productCategoryCode ? { productCategoryCode: params.productCategoryCode } : {}),
    ...(hasMeaningfulValue(params.productCategoryID) ? { productCategoryID: params.productCategoryID } : {}),
    deviceName: params.deviceName,
    dataID,
    timeStart: String(params.startTime),
    timeEnd: String(params.endTime),
    ...(params.aggFunc ? { argFunc: params.aggFunc } : {}),
    ...(params.aggInterval ? { interval: Number.parseInt(params.aggInterval), intervalUnit: 'm' } : {}),
  }));
  return post(`${THINGS}/device/msg/property-log/batch-get-list`, { reqs });
};

// ========== 设备交互（TASK-047） ==========

// 三个请求类型经 @vben/api 的 ThingsApi 命名空间（export * as ThingsApi）导出，
// 不能直接从 '@vben/api' 顶层 import（顶层未 re-export models）

/** 单设备属性下发 */
export const sendProperty = (params: {
  productID: string;
  deviceName: string;
  data: string;
  isAsync?: boolean;
  shadowControl?: number;
  syncTimeout?: number;
}) => ThingsApi.postApiV1ThingsDeviceInteractPropertyControlSend(params as ThingsApi.DeviceInteractSendPropertyReq);

/** 批量属性下发（按区域/分组/设备列表） */
export const sendPropertyBatch = (params: {
  productID?: string;
  data: string;
  areaID?: string;
  areaIDPath?: string;
  groupID?: string;
  deviceNames?: string[];
  isAsync?: boolean;
  shadowControl?: number;
}) => ThingsApi.postApiV1ThingsDeviceInteractPropertyControlBatchSend(params as ThingsApi.DeviceInteractBatchSendPropertyReq);

/** 动作调用 */
export const sendAction = (params: {
  productID: string;
  deviceName: string;
  actionID: string;
  inputParams?: string;
  isAsync?: boolean;
}) => ThingsApi.postApiV1ThingsDeviceInteractActionSend(params as ThingsApi.DeviceInteractSendActionReq);

/** 批量获取设备属性历史最后一条记录 */
export const getPropertyLogBatchLatest = (params: {
  dataID: string;
  deviceNames: string[];
  endTime: number;
  productCategoryCode?: string;
  productCategoryID?: number | string;
  productID?: string;
  startTime: number;
}) => {
  const reqs = params.deviceNames.map((deviceName) => ({
    ...(params.productID ? { productID: params.productID } : {}),
    ...(params.productCategoryCode ? { productCategoryCode: params.productCategoryCode } : {}),
    ...(hasMeaningfulValue(params.productCategoryID) ? { productCategoryID: params.productCategoryID } : {}),
    dataID: params.dataID,
    deviceName,
    order: 2,
    page: { page: 1, size: 1 },
    timeEnd: String(params.endTime),
    timeStart: String(params.startTime),
  }));
  return post(`${THINGS}/device/msg/property-log/batch-get-list`, { reqs });
};
