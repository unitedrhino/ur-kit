import { bleDataSource } from '../data/datasources/bluetooth.datasource';
import type { BleScanResult } from '../domain/models/ble-scan-result.model';
import { createProvisionFailure } from '../domain/models/provision-failure.model';
import { eventBus } from '../utils/event-bus';
import { bytesToArrayBuffer } from '../utils/ble-protocol';
import { ensureBluetoothReadyWithGuide } from '../utils/ble-readiness';

export const BLE_SERVICE_UUID = '0000FFFF-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_WRITE_UUID = '0000FF01-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_NOTIFY_UUID = '0000FF02-0000-1000-8000-00805F9B34FB';

const SHORT_SERVICE = 'ffff';
const SHORT_WRITE = 'ff01';
const SHORT_NOTIFY = 'ff02';
const DEFAULT_SCAN_TIMEOUT_MS = 8000;
const MIN_RSSI = -85;
const NAME_PREFIXES = ['ur-', 'ur_', 'ur', 'lx-', 'lx_', 'lianxi', '联犀'];

type DataSourceLike = Pick<typeof bleDataSource,
  'openAdapter' | 'startScan' | 'stopScan' | 'createConnection' | 'closeConnection' | 'getServices' | 'getCharacteristics' | 'writeCharacteristic'
>;

export interface BleDeviceConnectionInfo {
  deviceId: string;
  serviceId: string;
  writeCharId: string;
  notifyCharId: string;
}

export interface ScanCandidateOptions {
  timeoutMs?: number;
  filter?: (device: BleScanResult) => boolean;
}

function eqUuid(uuid: string, short: string): boolean {
  const normalized = uuid.toLowerCase();
  return normalized === short || normalized.startsWith(`0000${short}-`);
}

function hasProvisionService(device: BleScanResult): boolean {
  return (device.advertisServiceUUIDs || []).some((uuid) => eqUuid(uuid, SHORT_SERVICE));
}

function hasProvisionName(device: BleScanResult): boolean {
  const name = `${device.name || ''} ${device.localName || ''}`.trim().toLowerCase();
  if (!name) return false;
  return NAME_PREFIXES.some((prefix) => name.startsWith(prefix) || name.includes(prefix));
}

export class BleDeviceSessionService {
  constructor(private readonly dataSource: DataSourceLike = bleDataSource) {}

  isProvisionCandidate(device: BleScanResult): boolean {
    if (!device.deviceId) return false;
    if (typeof device.RSSI === 'number' && device.RSSI < MIN_RSSI) return false;
    if (hasProvisionService(device)) return true;
    return hasProvisionName(device);
  }

  async scanCandidates(options: ScanCandidateOptions = {}): Promise<BleScanResult[]> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_SCAN_TIMEOUT_MS;
    const filter = options.filter ?? ((device: BleScanResult) => this.isProvisionCandidate(device));
    const candidates: BleScanResult[] = [];
    const seen = new Set<string>();
    const handler = (payload: unknown): void => {
      const devices = Array.isArray(payload) ? payload as BleScanResult[] : [];
      devices.forEach((device) => {
        if (seen.has(device.deviceId) || !filter(device)) return;
        seen.add(device.deviceId);
        candidates.push(device);
      });
    };

    eventBus.on('ble:found', handler);
    const ready = await ensureBluetoothReadyWithGuide();
    if (!ready.ok) {
      eventBus.off('ble:found', handler);
      throw createProvisionFailure(
        'BLE_ADAPTER_NOT_READY',
        'scanning_ble',
        ready.reason === 'system_off'
          ? '系统蓝牙未打开'
          : ready.reason === 'app_unauthorized'
            ? '微信蓝牙权限未授权'
            : ready.errMsg || '蓝牙不可用',
      );
    }
    await this.dataSource.startScan();

    await new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    });

    this.dataSource.stopScan();
    eventBus.off('ble:found', handler);
    return candidates;
  }

  async connect(deviceId: string): Promise<BleDeviceConnectionInfo> {
    try {
      await this.dataSource.createConnection(deviceId);
    } catch (error) {
      throw createProvisionFailure('BLE_CONNECT_FAILED', 'connecting_ble', (error as Error).message);
    }

    const services = await this.dataSource.getServices(deviceId);
    const service = services.find((item) => eqUuid(item.uuid, SHORT_SERVICE));
    if (!service) {
      throw createProvisionFailure('SERVICE_NOT_FOUND', 'connecting_ble', `未找到服务 ${BLE_SERVICE_UUID}`);
    }

    const characteristics = await this.dataSource.getCharacteristics(deviceId, service.uuid);
    const writeChar = characteristics.find((item) => eqUuid(item.uuid, SHORT_WRITE));
    const notifyChar = characteristics.find((item) => eqUuid(item.uuid, SHORT_NOTIFY));
    if (!writeChar || !notifyChar) {
      throw createProvisionFailure('CHARACTERISTIC_NOT_FOUND', 'connecting_ble', '未找到配网写入或通知特征');
    }

    return {
      deviceId,
      serviceId: service.uuid,
      writeCharId: writeChar.uuid,
      notifyCharId: notifyChar.uuid,
    };
  }

  async writeFrames(connection: BleDeviceConnectionInfo, frames: Uint8Array[]): Promise<void> {
    for (const frame of frames) {
      await this.dataSource.writeCharacteristic(
        connection.deviceId,
        connection.serviceId,
        connection.writeCharId,
        bytesToArrayBuffer(frame),
      );
    }
  }

  async disconnect(deviceId: string): Promise<void> {
    if (!deviceId) return;
    await this.dataSource.closeConnection(deviceId);
  }
}

export const bleDeviceSessionService = new BleDeviceSessionService();
