import { deviceService } from '../services/device.service';
import { deviceControlService } from '../services/device-control.service';
import type { DeviceEntity } from '../domain/entities/device.entity';
import type {
  ActionItem,
  DeviceControlModel,
  ThingModelDefine,
} from '../domain/models/device-control.model';
import { eventBus } from '../utils/event-bus';
import { realtimeService } from '../services/realtime.service';

export interface DeviceDetailState {
  device: DeviceEntity | null;
  controlModel: DeviceControlModel | null;
  loading: boolean;
}

class DeviceDetailProvider {
  private state: DeviceDetailState = { device: null, controlModel: null, loading: false };
  private listeners: Set<(s: DeviceDetailState) => void> = new Set();
  private wsHandler: ((data: unknown) => void) | null = null;
  private wsHandlerKey = '';
  private wsStatusHandler: ((data: unknown) => void) | null = null;
  /** 当前订阅的设备，用于 clear 时取消 WS 订阅 */
  private wsProductID = '';
  private wsDeviceName = '';

  getState(): DeviceDetailState {
    return this.state;
  }

  subscribe(listener: (s: DeviceDetailState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private update(partial: Partial<DeviceDetailState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  async load(productID: string, deviceName: string): Promise<void> {
    this.update({ loading: true });
    try {
      const device = await deviceService.getDetail(productID, deviceName);
      const controlModel = await deviceControlService.loadControlModel(device);
      this.update({ device, controlModel, loading: false });
      this.listenRealtimeUpdates(productID, deviceName);
    } catch {
      this.update({ loading: false });
    }
  }

  async sendProperty(dataID: string, define: ThingModelDefine, rawValue: unknown): Promise<void> {
    const { device } = this.state;
    if (!device) return;
    await deviceControlService.sendProperty(
      device.productID,
      device.deviceName,
      dataID,
      define,
      rawValue,
    );
  }

  async invokeAction(action: ActionItem, rawParams: Record<string, unknown>): Promise<string> {
    const { device } = this.state;
    if (!device) throw new Error('设备未加载');
    return deviceControlService.invokeAction(device, action, rawParams);
  }

  private listenRealtimeUpdates(productID: string, deviceName: string): void {
    // 清理旧属性推送订阅
    if (this.wsHandler) {
      eventBus.off(this.wsHandlerKey, this.wsHandler as unknown as (...args: unknown[]) => void);
      this.wsHandler = null;
    }
    // 清理旧状态推送订阅
    if (this.wsStatusHandler) {
      eventBus.off('ws:device.status', this.wsStatusHandler as unknown as (...args: unknown[]) => void);
      this.wsStatusHandler = null;
    }
    // 取消旧设备的 WS 频道订阅
    if (this.wsProductID && this.wsDeviceName) {
      realtimeService.unsubscribe(`device.conn.${this.wsProductID}.${this.wsDeviceName}`);
      realtimeService.unsubscribe(`device.prop.${this.wsProductID}.${this.wsDeviceName}`);
    }
    this.wsProductID = productID;
    this.wsDeviceName = deviceName;

    // 订阅属性实时推送
    this.wsHandlerKey = 'ws:device.property';
    const handler = (data: unknown) => {
      const d = data as {
        productID: string;
        deviceName: string;
        dataID: string;
        value: unknown;
        timestamp: number;
      };
      if (d.productID !== productID || d.deviceName !== deviceName) return;
      const { controlModel } = this.state;
      if (!controlModel) return;
      this.update({
        controlModel: {
          ...controlModel,
          properties: deviceControlService.mergeRealtimeProperty(
            controlModel.properties,
            d.dataID,
            d.value,
            d.timestamp,
          ),
        },
      });
    };
    this.wsHandler = handler;
    eventBus.on(this.wsHandlerKey, handler as unknown as (...args: unknown[]) => void);

    // 订阅设备在线状态推送
    const statusHandler = (data: unknown) => {
      const d = data as { productID: string; deviceName: string; status: number };
      if (d.productID !== productID || d.deviceName !== deviceName) return;
      const { device } = this.state;
      if (!device) return;
      this.update({ device: { ...device, status: d.status } });
    };
    this.wsStatusHandler = statusHandler;
    eventBus.on('ws:device.status', statusHandler as unknown as (...args: unknown[]) => void);

    // 向服务端发起 WS 频道订阅（重连后由 datasource 自动重订阅）
    realtimeService.subscribe(`device.conn.${productID}.${deviceName}`);
    realtimeService.subscribe(`device.prop.${productID}.${deviceName}`);
  }

  clear(): void {
    if (this.wsHandler) {
      eventBus.off(this.wsHandlerKey, this.wsHandler as unknown as (...args: unknown[]) => void);
      this.wsHandler = null;
    }
    if (this.wsStatusHandler) {
      eventBus.off('ws:device.status', this.wsStatusHandler as unknown as (...args: unknown[]) => void);
      this.wsStatusHandler = null;
    }
    // 取消 WS 频道订阅
    if (this.wsProductID && this.wsDeviceName) {
      realtimeService.unsubscribe(`device.conn.${this.wsProductID}.${this.wsDeviceName}`);
      realtimeService.unsubscribe(`device.prop.${this.wsProductID}.${this.wsDeviceName}`);
      this.wsProductID = '';
      this.wsDeviceName = '';
    }
    this.update({ device: null, controlModel: null, loading: false });
  }
}

export const deviceDetailProvider = new DeviceDetailProvider();
