import { DeviceInteractRepositoryImpl } from '../data/repositories/device-interact.repository.impl';
import { DeviceMsgRepositoryImpl } from '../data/repositories/device-msg.repository.impl';
import type { IDeviceInteractRepository } from '../domain/interfaces/device-interact.repository';
import type {
  IDeviceMsgRepository,
  PropertyAggFunc,
  PropertyAggIntervalUnit,
  PropertyAggPoint,
} from '../domain/interfaces/device-msg.repository';
import type {
  ActionItem,
  ActionParam,
  DeviceControlModel,
  PropertyItem,
  PropertyState,
  ThingModelDefine,
  ThingModelSchema,
} from '../domain/models/device-control.model';
import { SUPPORTED_DEFINE_TYPES } from '../domain/models/device-control.model';
import type { DeviceEntity } from '../domain/entities/device.entity';

function isSupported(define: ThingModelDefine): boolean {
  return (SUPPORTED_DEFINE_TYPES as string[]).includes(define.type);
}

/** 将物模型属性与最新值合并为 UI 渲染用的 PropertyItem 列表（仅保留受支持类型） */
function mergeProperties(schema: ThingModelSchema, latest: PropertyState[]): PropertyItem[] {
  const latestMap = new Map<string, PropertyState>();
  latest.forEach((p) => latestMap.set(p.dataID, p));
  return schema.properties
    .filter((p) => isSupported(p.define))
    .map((p) => {
      const l = latestMap.get(p.identifier);
      return {
        identifier: p.identifier,
        name: p.name,
        mode: p.mode,
        define: p.define,
        funcGroup: p.funcGroup,
        value: l ? l.value : null,
        timestamp: l ? l.timestamp : 0,
      };
    });
}

/** 过滤 dir==='down' 且所有入参均为受支持类型的 action，其余隐藏 */
function buildActions(schema: ThingModelSchema): ActionItem[] {
  return schema.actions
    .filter((a) => a.dir === 'down')
    // 网络配置属于设备设置，不能作为普通物模型按钮绕过网络管理引导。
    .filter((a) => a.identifier !== 'configureNetwork')
    .filter((a) => a.input.every((p: ActionParam) => isSupported(p.define)))
    .map((a) => ({ identifier: a.identifier, name: a.name, input: a.input }));
}

/** 按 define.type 将 JS 基本值序列化为下发字符串 */
export function serializeValue(define: ThingModelDefine, value: unknown): string {
  switch (define.type) {
    case 'bool':
      if (value === true || value === 1 || value === '1') return '1';
      return '0';
    case 'timestamp':
      return String(Number(value) || 0);
    case 'int':
    case 'float':
      return String(Number(value));
    case 'string':
    case 'enum':
      return value == null ? '' : String(value);
    default:
      return value == null ? '' : String(value);
  }
}

export class DeviceControlService {
  constructor(
    private readonly interactRepo: IDeviceInteractRepository = new DeviceInteractRepositoryImpl(),
    private readonly msgRepo: IDeviceMsgRepository = new DeviceMsgRepositoryImpl(),
  ) {}

  async loadControlModel(device: DeviceEntity): Promise<DeviceControlModel> {
    const [thingModel, latest] = await Promise.all([
      this.interactRepo.getThingModel(device.productID),
      this.interactRepo.getLatestProperties(device.productID, device.deviceName),
    ]);
    return {
      device,
      properties: mergeProperties(thingModel, latest),
      actions: buildActions(thingModel),
      thingModel,
      pendingCommands: [],
    };
  }

  async sendProperty(
    productID: string,
    deviceName: string,
    dataID: string,
    define: ThingModelDefine,
    rawValue: unknown,
  ): Promise<string> {
    return this.interactRepo.propertyControlSend({
      productID,
      deviceName,
      dataID,
      value: serializeValue(define, rawValue),
    });
  }

  async invokeAction(
    device: DeviceEntity,
    action: ActionItem,
    rawParams: Record<string, unknown>,
  ): Promise<string> {
    const params: Record<string, unknown> = {};
    action.input.forEach((p) => {
      const raw = rawParams[p.identifier];
      // 下发统一走字符串，避免浮点/int64 精度问题
      params[p.identifier] = serializeValue(p.define, raw);
    });
    return this.interactRepo.actionSend({
      productID: device.productID,
      deviceName: device.deviceName,
      actionID: action.identifier,
      params,
    });
  }

  async refreshProperties(productID: string, deviceName: string): Promise<PropertyState[]> {
    return this.interactRepo.getLatestProperties(productID, deviceName);
  }

  /** 获取产品物模型（属性 / 事件 / 服务），供物模型选择器等场景使用。 */
  async getThingModel(productID: string): Promise<ThingModelSchema> {
    return this.interactRepo.getThingModel(productID);
  }

  async getPropertyHistory(
    productID: string,
    deviceName: string,
    dataID: string,
    page: number,
    size: number,
    timeRange?: 'day' | 'week' | 'month',
  ) {
    const now = Date.now();
    const rangeMs = timeRange === 'month'
      ? 30 * 24 * 60 * 60 * 1000
      : timeRange === 'week'
        ? 7 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
    return this.msgRepo.getPropertyLogList(productID, deviceName, dataID, {
      page,
      size,
      startTime: now - rangeMs,
      endTime: now,
    });
  }

  /** 兜底返回设备历史查询可用的第一个 dataID，避免空 dataID 导致接口直接报参数错误 */
  async getDefaultHistoryDataID(productID: string, deviceName: string): Promise<string> {
    const latest = await this.interactRepo.getLatestProperties(productID, deviceName);
    return latest.map((item) => item?.dataID).find(Boolean) || '';
  }

  /** 获取属性历史聚合趋势点，供移动端历史属性分析图表使用。 */
  async getPropertyHistoryAgg(
    productID: string,
    deviceName: string,
    params: {
      dataID: string;
      argFunc: PropertyAggFunc;
      interval: number;
      intervalUnit: PropertyAggIntervalUnit;
      timeStart: number;
      timeEnd: number;
    },
  ): Promise<PropertyAggPoint[]> {
    return this.msgRepo.getPropertyLogAggList(productID, deviceName, params);
  }

  /** WS 实时推送时合并单个属性值 */
  mergeRealtimeProperty(
    current: PropertyItem[],
    dataID: string,
    value: unknown,
    timestamp: number,
  ): PropertyItem[] {
    return current.map((p) => (p.identifier === dataID ? { ...p, value, timestamp } : p));
  }
}

export const deviceControlService = new DeviceControlService();
