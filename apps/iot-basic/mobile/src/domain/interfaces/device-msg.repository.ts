import type { PageResult, PageParams } from '../models/page-state.model';
import type {
  DeviceDebugLogRaw,
  DeviceEventLogRaw,
  DeviceOperationLogRaw,
  DevicePropertyLogRaw,
  DeviceSdkLogRaw,
  DeviceStatusLogRaw,
} from '../models/device-log.model';

export interface PropertyLogItem {
  timestamp: number;
  dataID: string;
  value: string;
  types: string;
}

export type PropertyAggFunc = 'last' | 'avg' | 'min' | 'max' | 'count';
export type PropertyAggIntervalUnit = 'm' | 'h' | 'd';

export interface PropertyAggPoint {
  timestamp: number;
  dataID: string;
  dataName: string;
  value: number | null;
  rawValue: string;
}

export interface PropertyLogAggParams {
  dataID: string;
  argFunc: PropertyAggFunc;
  interval: number;
  intervalUnit: PropertyAggIntervalUnit;
  timeStart: number;
  timeEnd: number;
}

/** DeviceLogQueryParams 是三类设备日志查询共享的分页和时间范围。 */
export interface DeviceLogQueryParams extends PageParams {
  /** 日志开始毫秒时间戳。 */
  timeStart?: string;
  /** 日志结束毫秒时间戳。 */
  timeEnd?: string;
}

export interface IDeviceMsgRepository {
  getPropertyLogList(
    productID: string,
    deviceName: string,
    dataID: string,
    params: PageParams & { startTime?: number; endTime?: number }
  ): Promise<PageResult<PropertyLogItem>>;

  getPropertyLogAggList(
    productID: string,
    deviceName: string,
    params: PropertyLogAggParams
  ): Promise<PropertyAggPoint[]>;

  /** 查询设备上下线日志。 */
  getStatusLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams
  ): Promise<PageResult<DeviceStatusLogRaw>>;

  /** 查询设备操作日志。 */
  getOperationLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams
  ): Promise<PageResult<DeviceOperationLogRaw>>;

  /** 查询云端调试日志。 */
  getHubLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams
  ): Promise<PageResult<DeviceDebugLogRaw>>;

  /** 查询设备事件日志。 */
  getEventLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams
  ): Promise<PageResult<DeviceEventLogRaw>>;

  /** 查询设备 SDK 日志。 */
  getSdkLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams
  ): Promise<PageResult<DeviceSdkLogRaw>>;

  /** 查询调试页使用的属性上报日志。 */
  getDebugPropertyLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams
  ): Promise<PageResult<DevicePropertyLogRaw>>;
}
