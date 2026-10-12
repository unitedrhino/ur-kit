import { request } from '../../utils/request';
import type {
  DeviceLogQueryParams,
  IDeviceMsgRepository,
  PropertyAggPoint,
  PropertyLogAggParams,
  PropertyLogItem,
} from '../../domain/interfaces/device-msg.repository';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import type {
  DeviceDebugLogRaw,
  DeviceEventLogRaw,
  DeviceOperationLogRaw,
  DevicePropertyLogRaw,
  DeviceSdkLogRaw,
  DeviceStatusLogRaw,
} from '../../domain/models/device-log.model';

/** parsePageResult 将后端分页响应归一为移动端 PageResult。 */
function parsePageResult<T>(resp: Record<string, unknown>, mapper: (item: Record<string, unknown>) => T): PageResult<T> {
  const list = ((resp.list || []) as Record<string, unknown>[]).map(mapper);
  return { list, total: Number(resp.total || 0) };
}

/** buildLogPageData 生成日志查询接口共享的分页和时间条件。 */
function buildLogPageData(params: DeviceLogQueryParams) {
  return {
    page: { page: params.page, size: params.size },
    timeEnd: params.timeEnd,
    timeStart: params.timeStart,
  };
}

/** readString 从原始接口记录中安全读取字符串。 */
function readString(item: Record<string, unknown>, key: string): string {
  return String(item[key] ?? '');
}

/** readNumber 从原始接口记录中安全读取数字。 */
function readNumber(item: Record<string, unknown>, key: string): number {
  return Number(item[key] || 0);
}

function parseAggValue(raw: unknown): number | null {
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export class DeviceMsgRepositoryImpl implements IDeviceMsgRepository {
  async getPropertyLogList(
    productID: string,
    deviceName: string,
    dataID: string,
    params: PageParams & { startTime?: number; endTime?: number },
  ): Promise<PageResult<PropertyLogItem>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/property-log/get-list',
      data: {
        productID,
        deviceName,
        dataID,
        page: { page: params.page, size: params.size },
        timeStart: params.startTime ? String(params.startTime) : undefined,
        timeEnd: params.endTime ? String(params.endTime) : undefined,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map((item) => ({
      timestamp: Number(item.timestamp || 0),
      dataID: String(item.dataID || ''),
      value: String(item.value || ''),
      types: String(item.types || ''),
    }));
    return { list, total: Number(resp.total || 0) };
  }

  async getPropertyLogAggList(
    productID: string,
    deviceName: string,
    params: PropertyLogAggParams,
  ): Promise<PropertyAggPoint[]> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/property-log-agg/get-list',
      data: {
        productID,
        deviceName,
        interval: params.interval,
        intervalUnit: params.intervalUnit,
        timeStart: String(params.timeStart),
        timeEnd: String(params.timeEnd),
        aggs: [{
          dataID: params.dataID,
          argFuncs: [params.argFunc],
          noFirstTs: true,
        }],
      },
    });
    const list = (resp.list || []) as Record<string, unknown>[];
    return list.flatMap((group) => {
      const values = (group.values || []) as Record<string, unknown>[];
      return values.map((item) => {
        const aggValues = (item.values || {}) as Record<string, Record<string, unknown>>;
        const detail = aggValues[params.argFunc] || {};
        const rawValue = String(detail.value ?? '');
        return {
          timestamp: Number(item.timeWindow || detail.timestamp || 0),
          dataID: String(item.dataID || params.dataID),
          dataName: String(item.dataName || item.dataID || params.dataID),
          value: parseAggValue(rawValue),
          rawValue,
        };
      });
    });
  }

  async getStatusLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams,
  ): Promise<PageResult<DeviceStatusLogRaw>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/status-log/get-list',
      data: {
        productID,
        deviceName,
        ...buildLogPageData(params),
      },
    });
    return parsePageResult(resp, (item) => ({
      deviceName: readString(item, 'deviceName'),
      productID: readString(item, 'productID'),
      status: readNumber(item, 'status'),
      timestamp: readString(item, 'timestamp'),
    }));
  }

  async getOperationLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams,
  ): Promise<PageResult<DeviceOperationLogRaw>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/send-log/get-list',
      data: {
        productID,
        deviceName,
        actions: ['propertyControlSend', 'propertyGetReportSend', 'actionSend'],
        withUser: true,
        ...buildLogPageData(params),
      },
    });
    return parsePageResult(resp, (item) => ({
      account: readString(item, 'account'),
      action: readString(item, 'action'),
      content: readString(item, 'content'),
      dataID: readString(item, 'dataID'),
      deviceName: readString(item, 'deviceName'),
      productID: readString(item, 'productID'),
      resultCode: item.resultCode as number | string | undefined,
      timestamp: readString(item, 'timestamp'),
      traceID: readString(item, 'traceID'),
      user: item.user as DeviceOperationLogRaw['user'],
      userID: readString(item, 'userID'),
    }));
  }

  async getHubLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams,
  ): Promise<PageResult<DeviceDebugLogRaw>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/hub-log/get-list',
      data: {
        productID,
        deviceName,
        actions: ['connected', 'disconnected', 'property', 'event', 'action', 'thing', 'gateway'],
        ...buildLogPageData(params),
      },
    });
    return parsePageResult(resp, (item) => ({
      action: readString(item, 'action'),
      content: readString(item, 'content'),
      requestID: readString(item, 'requestID'),
      respPayload: readString(item, 'respPayload'),
      resultCode: item.resultCode as number | string | undefined,
      timestamp: readString(item, 'timestamp'),
      topic: readString(item, 'topic'),
      traceID: readString(item, 'traceID'),
    }));
  }

  async getEventLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams,
  ): Promise<PageResult<DeviceEventLogRaw>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/event-log/get-list',
      data: {
        productID,
        deviceNames: [deviceName],
        ...buildLogPageData(params),
      },
    });
    return parsePageResult(resp, (item) => ({
      dataID: readString(item, 'dataID'),
      params: readString(item, 'params'),
      timestamp: readString(item, 'timestamp'),
      type: readString(item, 'type'),
    }));
  }

  async getSdkLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams,
  ): Promise<PageResult<DeviceSdkLogRaw>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/sdk-log/get-list',
      data: {
        productID,
        deviceName,
        ...buildLogPageData(params),
      },
    });
    return parsePageResult(resp, (item) => ({
      content: readString(item, 'content'),
      loglevel: readNumber(item, 'loglevel') || readNumber(item, 'logLevel'),
      timestamp: readString(item, 'timestamp'),
    }));
  }

  async getDebugPropertyLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogQueryParams,
  ): Promise<PageResult<DevicePropertyLogRaw>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/property-log/get-list',
      data: {
        productID,
        deviceName,
        order: 2,
        ...buildLogPageData(params),
      },
    });
    return parsePageResult(resp, (item) => ({
      dataID: readString(item, 'dataID'),
      dataName: readString(item, 'dataName'),
      deviceName: readString(item, 'deviceName'),
      timestamp: readString(item, 'timestamp'),
      value: item.value,
    }));
  }
}
