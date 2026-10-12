/** 蓝牙系统 API 适配：扫描、连接、GATT 与事件桥，协议流程可要求严格释放确认。 */
import { eventBus } from '../../utils/event-bus';
import type { BleScanResult } from '../../domain/models/ble-scan-result.model';
import {
  bleLogger,
  clearBleLogs,
  getBleLogHistory,
  subscribeBleLogs,
  type BleLogEntry,
  type BleLogLevel,
} from '../../utils/ble-logger';

export { bleLogger, clearBleLogs, getBleLogHistory, subscribeBleLogs };
export type { BleLogEntry, BleLogLevel };

interface AdapterStateChangeRes {
  available: boolean;
  discovering: boolean;
}

interface BLEConnectionStateChangeRes {
  deviceId: string;
  connected: boolean;
}

function getRuntimeApi(): Record<string, unknown> {
  if (typeof uni !== 'undefined') return uni as unknown as Record<string, unknown>;
  if (typeof wx !== 'undefined') return wx as unknown as Record<string, unknown>;
  return {};
}

function normalizeAdvertisData(value: unknown): ArrayBuffer | undefined {
  if (!value) return undefined;
  if (value instanceof ArrayBuffer) return value;
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    const output = new ArrayBuffer(view.byteLength);
    new Uint8Array(output).set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    return output;
  }
  if (Array.isArray(value)) {
    return new Uint8Array(value.map((item) => Number(item) & 0xff)).buffer;
  }
  return undefined;
}

export class BluetoothDataSource {
  /** 扫描系统调用按提交顺序完成，防止旧 stop 停掉新一轮 start。 */
  private scanOperation: Promise<void> = Promise.resolve();
  /** 仅保存本实例的发现监听，不移除其他蓝牙使用方。 */
  private foundHandler: ((result: UniApp.OnBluetoothDeviceFoundResult) => void) | null = null;
  /** 停止失败时下次启动先重试停止，不能把本地标志当成系统已释放。 */
  private scanStopPending = false;
  private scanning = false;
  private adapterReady = false;
  private adapterStateBound = false;
  private connectionStateBound = false;

  private bindAdapterStateListener(): void {
    if (this.adapterStateBound) return;
    this.adapterStateBound = true;
    bleLogger.info('datasource', 'bindAdapterStateListener');
    uni.onBluetoothAdapterStateChange((res: AdapterStateChangeRes) => {
      bleLogger.info('datasource', 'onBluetoothAdapterStateChange', res);
      if (!res.available) {
        this.adapterReady = false;
        this.scanning = false;
      }
      eventBus.emit('ble:adapter-state', res);
    });
  }

  private bindConnectionStateListener(): void {
    if (this.connectionStateBound) return;
    this.connectionStateBound = true;
    bleLogger.info('datasource', 'bindConnectionStateListener');
    uni.onBLEConnectionStateChange((res: BLEConnectionStateChangeRes) => {
      bleLogger.info('datasource', 'onBLEConnectionStateChange', res);
      eventBus.emit('ble:connection-state', res);
    });
  }

  /** 已经成功 openAdapter 之后, 子模块可调用此方法跳过重复打开。 */
  isAdapterReady(): boolean {
    return this.adapterReady;
  }

  markAdapterReady(): void {
    this.adapterReady = true;
    this.bindAdapterStateListener();
    this.bindConnectionStateListener();
  }

  async openAdapter(): Promise<void> {
    if (this.adapterReady) {
      bleLogger.debug('datasource', 'openAdapter:skip-already-ready');
      return;
    }
    bleLogger.info('datasource', 'openAdapter:start');
    return new Promise((resolve, reject) => {
      uni.openBluetoothAdapter({
        success: (res) => {
          bleLogger.info('datasource', 'openAdapter:success', res);
          this.markAdapterReady();
          resolve();
        },
        fail: (err) => {
          bleLogger.error('datasource', 'openAdapter:fail', err);
          reject(new Error(err.errMsg));
        },
      });
    });
  }

  async closeAdapter(): Promise<void> {
    await this.stopScan();
    bleLogger.info('datasource', 'closeAdapter:start');
    return new Promise((resolve) => {
      uni.closeBluetoothAdapter({
        success: (res) => {
          bleLogger.info('datasource', 'closeAdapter:success', res);
          this.adapterReady = false;
          resolve();
        },
        fail: (err) => {
          bleLogger.warn('datasource', 'closeAdapter:fail', err);
          this.adapterReady = false;
          resolve();
        },
      });
    });
  }

  /** startScan 排队启动扫描；每轮允许重复广播，由协议服务按本轮去重。 */
  startScan(services?: string[]): Promise<void> {
    const operation = this.scanOperation.then(() => this.startScanNow(services));
    this.scanOperation = operation.catch(() => {});
    return operation;
  }

  /** startScanNow 在系统启动之前订阅，避免快速到达的首包丢失。 */
  private async startScanNow(services?: string[]): Promise<void> {
    if (this.scanStopPending) await this.stopScanNow();
    if (this.scanning) {
      bleLogger.warn('datasource', 'startScan:skip-already-scanning');
      return Promise.resolve();
    }
    this.scanning = true;
    bleLogger.info('datasource', 'startScan:start', { services: services || [] });

    return new Promise((resolve, reject) => {
      // 旧平台没有 off 时，旧闭包也不能向新一轮投递事件。
      const handler = (found: UniApp.OnBluetoothDeviceFoundResult) => {
        if (!this.scanning || this.foundHandler !== handler) return;
        const devices: BleScanResult[] = found.devices.map((d) => ({
          deviceId: d.deviceId,
          name: d.name || d.localName || '',
          RSSI: d.RSSI,
          advertisServiceUUIDs: d.advertisServiceUUIDs || [],
          advertisData: normalizeAdvertisData(d.advertisData),
          localName: d.localName || '',
          serviceData: (d.serviceData || {}) as unknown as Record<string, unknown>,
        }));
        eventBus.emit('ble:found', devices);
      };
      this.foundHandler = handler;
      uni.onBluetoothDeviceFound(this.foundHandler);
      uni.startBluetoothDevicesDiscovery({
        services,
        allowDuplicatesKey: true,
        success: (res) => {
          bleLogger.info('datasource', 'startScan:success', res);
          resolve();
        },
        fail: (err) => {
          this.scanning = false;
          this.removeFoundHandler();
          bleLogger.error('datasource', 'startScan:fail', err);
          reject(new Error(err.errMsg || '蓝牙扫描启动失败'));
        },
      });
    });
  }

  /** stopScan 等待系统停止确认；调用方不 await 时下一轮仍自动排队。 */
  stopScan(): Promise<void> {
    const operation = this.scanOperation.then(() => this.stopScanNow());
    this.scanOperation = operation.catch(() => {});
    return operation;
  }

  /** stopScanNow 在系统停止完成前不放行下一轮；失败保留可重试状态。 */
  private stopScanNow(): Promise<void> {
    if (!this.scanning && !this.scanStopPending) {
      bleLogger.debug('datasource', 'stopScan:skip-not-scanning');
      return Promise.resolve();
    }
    this.scanning = false;
    this.scanStopPending = true;
    bleLogger.info('datasource', 'stopScan:start');
    this.removeFoundHandler();
    return new Promise((resolve, reject) => {
      uni.stopBluetoothDevicesDiscovery({
        success: () => { this.scanStopPending = false; resolve(); },
        fail: (err) => {
          bleLogger.warn('datasource', 'stopScan:fail', err);
          reject(new Error(err.errMsg || '蓝牙扫描停止失败'));
        },
      });
    });
  }

  /** removeFoundHandler 精确注销本实例监听，兼容不支持 off 的运行端。 */
  private removeFoundHandler(): void {
    const handler = this.foundHandler;
    this.foundHandler = null;
    if (!handler) return;
    const runtimeApi = getRuntimeApi();
    const offFn = runtimeApi.offBluetoothDeviceFound as ((cb: typeof handler) => void) | undefined;
    if (typeof offFn === 'function') {
      try {
        offFn.call(runtimeApi, handler);
        bleLogger.debug('datasource', 'offBluetoothDeviceFound:done');
      } catch (err) {
        bleLogger.warn('datasource', 'offBluetoothDeviceFound:exception', err);
      }
    }
  }

  async createConnection(deviceId: string): Promise<void> {
    bleLogger.info('datasource', 'createConnection:start', { deviceId });
    return new Promise((resolve, reject) => {
      uni.createBLEConnection({
        deviceId,
        success: (res) => {
          bleLogger.info('datasource', 'createConnection:success', { deviceId, res });
          this.bindConnectionStateListener();
          resolve();
        },
        fail: (err) => {
          bleLogger.error('datasource', 'createConnection:fail', { deviceId, err });
          reject(new Error(err.errMsg));
        },
      });
    });
  }

  /** closeConnection 释放指定设备；requireConfirmation 为 true 时必须成功回执，否则拒绝后续协议推进。 */
  async closeConnection(deviceId: string, requireConfirmation = false): Promise<void> {
    bleLogger.info('datasource', 'closeConnection:start', { deviceId });
    return new Promise((resolve, reject) => {
      uni.closeBLEConnection({
        deviceId,
        success: (res) => {
          bleLogger.info('datasource', 'closeConnection:success', { deviceId, res });
          resolve();
        },
        fail: (err) => {
          bleLogger.warn('datasource', 'closeConnection:fail', { deviceId, err });
          if (requireConfirmation) reject(err);
          else resolve();
        },
      });
    });
  }

  async getServices(deviceId: string): Promise<WechatMiniprogram.BLEService[]> {
    bleLogger.info('datasource', 'getServices:start', { deviceId });
    return new Promise((resolve, reject) => {
      uni.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          bleLogger.info('datasource', 'getServices:success', { deviceId, services: res.services });
          resolve(res.services);
        },
        fail: (err) => {
          bleLogger.error('datasource', 'getServices:fail', { deviceId, err });
          reject(new Error(err.errMsg));
        },
      });
    });
  }

  async getCharacteristics(deviceId: string, serviceId: string): Promise<WechatMiniprogram.BLECharacteristic[]> {
    bleLogger.info('datasource', 'getCharacteristics:start', { deviceId, serviceId });
    return new Promise((resolve, reject) => {
      uni.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => {
          bleLogger.info('datasource', 'getCharacteristics:success', {
            deviceId,
            serviceId,
            characteristics: res.characteristics,
          });
          resolve(res.characteristics);
        },
        fail: (err) => {
          bleLogger.error('datasource', 'getCharacteristics:fail', { deviceId, serviceId, err });
          reject(new Error(err.errMsg));
        },
      });
    });
  }

  async writeCharacteristic(
    deviceId: string,
    serviceId: string,
    characteristicId: string,
    value: ArrayBuffer,
    writeType: 'write' | 'writeNoResponse' = 'write',
  ): Promise<void> {
    bleLogger.info('datasource', 'writeCharacteristic:start', {
      deviceId,
      serviceId,
      characteristicId,
      byteLength: value.byteLength,
    });
    return new Promise((resolve, reject) => {
      uni.writeBLECharacteristicValue({
        deviceId,
        serviceId,
        characteristicId,
        value: value as unknown as any[],
        writeType,
        success: (res) => {
          bleLogger.info('datasource', 'writeCharacteristic:success', { deviceId, characteristicId, res });
          resolve();
        },
        fail: (err) => {
          bleLogger.error('datasource', 'writeCharacteristic:fail', { deviceId, characteristicId, err });
          reject(new Error(err.errMsg));
        },
      });
    });
  }
}

export const bleDataSource = new BluetoothDataSource();
