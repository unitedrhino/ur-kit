/**
 * 设备日志服务：聚合上下线、操作、调试三类日志并归一成移动端时间线数据。
 */

import { DeviceInteractRepositoryImpl } from '../data/repositories/device-interact.repository.impl';
import { DeviceMsgRepositoryImpl } from '../data/repositories/device-msg.repository.impl';
import type { IDeviceInteractRepository } from '../domain/interfaces/device-interact.repository';
import type { DeviceLogQueryParams, IDeviceMsgRepository } from '../domain/interfaces/device-msg.repository';
import type {
  DeviceLogTabKey,
  DeviceLogTimelineItem,
  SchemaNameMap,
} from '../domain/models/device-log.model';
import {
  buildSchemaNameMap,
  mergeAndSortDeviceLogItems,
  normalizeDeviceDebugLog,
  normalizeDeviceEventLog,
  normalizeDeviceOperationLog,
  normalizeDevicePropertyLog,
  normalizeDeviceSdkLog,
  normalizeDeviceStatusLog,
} from '../domain/models/device-log.model';
import type { PageResult } from '../domain/models/page-state.model';

/** DeviceLogLoadParams 是服务层读取日志列表需要的完整查询条件。 */
export interface DeviceLogLoadParams extends DeviceLogQueryParams {
  /** 当前页签。 */
  tab: DeviceLogTabKey;
}

/** DeviceLogLoadResult 是设备日志服务返回给 Provider 的分页结果。 */
export interface DeviceLogLoadResult {
  /** 归一后的时间线条目。 */
  list: DeviceLogTimelineItem[];
  /** 是否还有更多记录。 */
  hasMore: boolean;
}

/** collectSchemaItems 从物模型中提取可用于显示名称映射的属性、事件和行为。 */
function collectSchemaItems(schema: Awaited<ReturnType<IDeviceInteractRepository['getThingModel']>>) {
  return [
    ...schema.properties,
    ...schema.events,
    ...schema.actions,
  ];
}

/** hasMoreResult 根据后端分页总数和当前页数量判断是否可能还有下一页。 */
function hasMoreResult<T>(result: PageResult<T>, page: number, size: number): boolean {
  if (result.total > 0) return page * size < result.total;
  return result.list.length >= size;
}

export class DeviceLogService {
  constructor(
    private readonly msgRepo: IDeviceMsgRepository = new DeviceMsgRepositoryImpl(),
    private readonly interactRepo: IDeviceInteractRepository = new DeviceInteractRepositoryImpl(),
  ) {}

  /** loadLogs 按页签读取并归一化设备日志。 */
  async loadLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogLoadParams,
  ): Promise<DeviceLogLoadResult> {
    if (params.tab === 'status') {
      const result = await this.msgRepo.getStatusLogs(productID, deviceName, params);
      return {
        hasMore: hasMoreResult(result, params.page, params.size),
        list: result.list.map(normalizeDeviceStatusLog),
      };
    }

    const schemaMap = await this.loadSchemaMap(productID);
    if (params.tab === 'operation') {
      const result = await this.msgRepo.getOperationLogs(productID, deviceName, params);
      return {
        hasMore: hasMoreResult(result, params.page, params.size),
        list: result.list.map((item) => normalizeDeviceOperationLog(item, schemaMap)),
      };
    }

    return this.loadDebugLogs(productID, deviceName, params, schemaMap);
  }

  /** loadSchemaMap 读取物模型名称映射，失败时降级为空映射。 */
  private async loadSchemaMap(productID: string): Promise<SchemaNameMap> {
    try {
      const schema = await this.interactRepo.getThingModel(productID);
      return buildSchemaNameMap(collectSchemaItems(schema));
    } catch {
      return {};
    }
  }

  /** loadDebugLogs 聚合云端诊断、事件、属性和 SDK 日志。 */
  private async loadDebugLogs(
    productID: string,
    deviceName: string,
    params: DeviceLogLoadParams,
    schemaMap: SchemaNameMap,
  ): Promise<DeviceLogLoadResult> {
    const [hubResult, eventResult, propertyResult, sdkResult] = await Promise.allSettled([
      this.msgRepo.getHubLogs(productID, deviceName, params),
      this.msgRepo.getEventLogs(productID, deviceName, params),
      this.msgRepo.getDebugPropertyLogs(productID, deviceName, params),
      this.msgRepo.getSdkLogs(productID, deviceName, params),
    ]);

    const hubLogs = hubResult.status === 'fulfilled' ? hubResult.value : { list: [], total: 0 };
    const eventLogs = eventResult.status === 'fulfilled' ? eventResult.value : { list: [], total: 0 };
    const propertyLogs = propertyResult.status === 'fulfilled' ? propertyResult.value : { list: [], total: 0 };
    const sdkLogs = sdkResult.status === 'fulfilled' ? sdkResult.value : { list: [], total: 0 };

    return {
      hasMore: [hubLogs, eventLogs, propertyLogs, sdkLogs].some((result) => hasMoreResult(result, params.page, params.size)),
      list: mergeAndSortDeviceLogItems([
        ...hubLogs.list.map(normalizeDeviceDebugLog),
        ...eventLogs.list.map((item) => normalizeDeviceEventLog(item, schemaMap)),
        ...propertyLogs.list.map((item) => normalizeDevicePropertyLog(item, schemaMap)),
        ...sdkLogs.list.map(normalizeDeviceSdkLog),
      ]),
    };
  }
}

export const deviceLogService = new DeviceLogService();
