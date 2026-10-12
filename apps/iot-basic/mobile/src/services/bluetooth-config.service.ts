/**
 * LLSync WiFi 蓝牙绑定服务。
 *
 * 负责微信/uni BLE API 编排：扫描、连接、服务特征发现、notify 订阅、
 * 命令写入与响应等待。协议字节本身统一由 utils/llsync-protocol 维护。
 */
import { bleDataSource, bleLogger, clearBleLogs } from '../data/datasources/bluetooth.datasource';
import type { BleScanResult } from '../domain/models/ble-scan-result.model';
import { createProvisionFailure } from '../domain/models/provision-failure.model';
import { eventBus } from '../utils/event-bus';
import { ensureBluetoothReadyWithGuide } from '../utils/ble-readiness';
import type { LLSyncTraceSession } from '../utils/llsync-provision-trace';
import {
  LLSYNC_ADVERTISING_SERVICE_UUID,
  LLSYNC_DEVICE_INFO_WRITE_UUID,
  LLSYNC_EVENT_DEVICE_INFO,
  LLSYNC_EVENT_GET_DEV_LOG_INFO,
  LLSYNC_EVENT_NETWORK_CHANGE,
  LLSYNC_EVENT_NOTIFY_UUID,
  LLSYNC_EVENT_SET_WIFI_CONNECT_RESULT,
  LLSYNC_EVENT_SET_WIFI_INFO_RESULT,
  LLSYNC_EVENT_SET_WIFI_MODE_RESULT,
  LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT,
  LLSYNC_SERVICE_UUID,
  LLSYNC_SHORT_NOTIFY_UUID,
  LLSYNC_SHORT_SERVICE_UUID,
  LLSYNC_SHORT_WRITE_UUID,
  buildConnectWifiCommand,
  buildGetDeviceInfoCommand,
  buildGetLogCommand,
  buildSendTokenCommand,
  buildSetWifiInfoCommand,
  buildSetWifiModeCommand,
  buildWriteMtuResultCommand,
  bytesToArrayBuffer,
  hasLLSyncAdvertisingService,
  isLLSyncSuccessResult,
  parseLLSyncAdvertisingData,
  LLSyncEventDecoder,
  uuidMatchesShort,
  type LLSyncDeviceInfo,
  type LLSyncEvent,
  type LLSyncWifiConnectResult,
  type LLSyncNetworkChange,
} from '../utils/llsync-protocol';

export const BLE_SERVICE_UUID = LLSYNC_SERVICE_UUID;
export const BLE_CHAR_WRITE_UUID = LLSYNC_DEVICE_INFO_WRITE_UUID;
export const BLE_CHAR_NOTIFY_UUID = LLSYNC_EVENT_NOTIFY_UUID;

export const TYPE_SERVER_INFO = LLSYNC_EVENT_DEVICE_INFO;
export const TYPE_PROVISION_FAIL = -1;
export const TYPE_PROVISION_SUCCESS = LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT;
export const TYPE_WIFI_CONNECT_RESULT = LLSYNC_EVENT_SET_WIFI_CONNECT_RESULT;
/** TYPE_BIND_TOKEN_WRITTEN 表示 E4 token 已写入设备，后续等待设备 E3 确认。 */
export const TYPE_BIND_TOKEN_WRITTEN = 0x100 + LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT;

const DEFAULT_ATT_MTU = 23;
const LLSYNC_WRITE_GAP_MS = 300;
const GATT_OPERATION_SETTLE_MS = 180;
const WAIT_GET_DEVICE_INFO_MS = 10000;
const WAIT_SET_WIFI_MODE_MS = 10000;
const WAIT_SET_WIFI_INFO_MS = 10000;
const WAIT_SET_WIFI_CONNECT_MS = 70000;
const WAIT_SET_WIFI_TOKEN_MS = 60000;
const WAIT_GET_DEV_LOG_MS = 10000;

export interface BleMessage {
  type: number;
  value?: unknown;
  raw?: number[];
}

export type MessageHandler = (msg: BleMessage) => void;

interface PendingEvent {
  resolve: (event: LLSyncEvent) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** BleNotifyResult 描述微信 BLE 特征通知的最小运行时结构。 */
interface BleNotifyResult {
  deviceId: string;
  serviceId: string;
  characteristicId: string;
  value: ArrayBuffer;
}

/** BleNotifyHandler 是可保存并用同一引用解绑的通知回调。 */
type BleNotifyHandler = (result: BleNotifyResult) => void;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRuntimeApi(): Record<string, unknown> {
  if (typeof uni !== 'undefined') return uni as unknown as Record<string, unknown>;
  if (typeof wx !== 'undefined') return wx as unknown as Record<string, unknown>;
  return {};
}

function eventValue<T>(event: LLSyncEvent): T {
  return event.value as T;
}

/** appendMacSuffix 按官方适配器习惯给无下划线设备名补 MAC 前两字节，便于列表区分。 */
function appendMacSuffix(device: BleScanResult, mac: string): string {
  const name = device.localName || device.name || '';
  if (!name || name.includes('_')) return name;
  const suffix = mac.split(':').slice(0, 2).join('');
  return suffix ? `${name}_${suffix}` : name;
}

export class BluetoothConfigService {
  private scanning = false;
  private activeDeviceId = '';
  private activeServiceId = '';
  private activeWriteCharId = '';
  private activeNotifyCharId = '';
  private notifyBound = false;
  private notifyCallback: BleNotifyHandler | null = null;
  /** 当前连接的断线监听，主动释放或换代时精确解绑，不能全局清除其他模块监听。 */
  private connectionStateListener: ((payload: unknown) => void) | null = null;
  /** 当前代次已由系统事件确认断开的设备；不将未知关闭错误猜作已断开。 */
  private physicallyDisconnectedDeviceId = '';
  /** 关闭未确认时保留目标；下次连接前必须重试释放，不能悄悄遗留活动链路。 */
  private pendingCloseDeviceId = '';
  private handlers = new Set<MessageHandler>();
  private pendingEvents = new Map<number, Set<PendingEvent>>();
  private advertisingInfoByDeviceId = new Map<string, { productID: string; mac: string; moduleVersion: number }>();
  private scanListener: ((devices: BleScanResult[]) => void) | null = null;
  private currentDeviceInfo: LLSyncDeviceInfo | null = null;
  /** 当前连接收到的换网通知；断开和重新连接均清除，禁止复用旧能力。 */
  private networkChange: LLSyncNetworkChange | null = null;
  /** 异步写入每一步核对连接代次，避免取消后的续步写进新连接。 */
  private connectionGeneration = 0;
  /** 通知半包只属于当前连接，在重连及断开时清除。 */
  private readonly eventDecoder = new LLSyncEventDecoder();
  private currentProductID = '';
  private currentModuleVersion = 0;
  private currentMac = '';
  private attMtu = DEFAULT_ATT_MTU;
  /** activeTrace 记录当前连接内所有 LLSync 原始收发包，断开后立即清空。 */
  private activeTrace: LLSyncTraceSession | null = null;

  clearLogs(): void {
    clearBleLogs();
  }

  /** init 确认蓝牙、隐私和定位前置条件均已满足。 */
  async init(): Promise<void> {
    bleLogger.info('service', 'init:start');
    const result = await ensureBluetoothReadyWithGuide();
    if (!result.ok) {
      bleLogger.error('service', 'init:bluetooth-not-ready', result);
      const message = result.reason === 'system_off'
        ? '系统蓝牙未打开'
        : result.reason === 'app_unauthorized'
          ? '微信蓝牙权限未授权'
          : result.reason === 'privacy_not_declared'
            ? '蓝牙隐私声明未配置'
            : result.reason === 'scope_denied'
              ? '小程序蓝牙权限被拒绝'
              : result.errMsg || '蓝牙不可用';
      throw new Error(message);
    }
    bleLogger.info('service', 'init:success');
  }

  /** startScan 只上报符合 LLSync FFF0 广播和 manufacturer data 的设备。 */
  async startScan(onFound: (device: BleScanResult) => void): Promise<void> {
    bleLogger.info('service', 'startScan:start');
    this.stopScan();
    await this.init();
    const seen = new Set<string>();
    const listener = (devices: BleScanResult[]) => {
      bleLogger.debug('service', 'startScan:listener-received', devices);
      for (const device of devices) {
        const parsed = parseLLSyncAdvertisingData(device.advertisData);
        if (!parsed || !hasLLSyncAdvertisingService(device.advertisServiceUUIDs)) {
          bleLogger.debug('service', 'startScan:skip-non-llsync', device);
          continue;
        }
        if (seen.has(device.deviceId)) {
          bleLogger.debug('service', 'startScan:skip-duplicate', device);
          continue;
        }
        seen.add(device.deviceId);
        this.advertisingInfoByDeviceId.set(device.deviceId, {
          productID: parsed.productID,
          mac: parsed.mac,
          moduleVersion: parsed.moduleVersion,
        });
        const normalized: BleScanResult = {
          ...device,
          name: appendMacSuffix(device, parsed.mac),
          localName: appendMacSuffix(device, parsed.mac),
          productID: parsed.productID,
          mac: parsed.mac,
          moduleVersion: parsed.moduleVersion,
        };
        bleLogger.info('service', 'startScan:onFound', normalized);
        onFound(normalized);
      }
    };
    this.scanListener = listener;
    eventBus.on('ble:found', listener as (...args: unknown[]) => void);
    this.scanning = true;
    try {
      await bleDataSource.startScan([LLSYNC_ADVERTISING_SERVICE_UUID]);
    } catch (error) {
      // 启动拒绝也必须释放本轮业务监听，重试不继承扫描中标记。
      if (this.scanListener === listener) this.stopScan();
      throw error;
    }
    bleLogger.info('service', 'startScan:discovery-started');
  }

  stopScan(): void {
    if (!this.scanning) {
      bleLogger.debug('service', 'stopScan:skip-not-scanning');
      return;
    }
    this.scanning = false;
    bleLogger.info('service', 'stopScan:start');
    bleDataSource.stopScan();
    if (this.scanListener) {
      eventBus.off('ble:found', this.scanListener as (...args: unknown[]) => void);
      this.scanListener = null;
    }
    bleLogger.info('service', 'stopScan:done');
  }

  /** connect 建立 GATT 连接，订阅 notify 后立即 E0 获取设备信息。 */
  async connect(deviceId: string, trace?: LLSyncTraceSession): Promise<void> {
    if (this.pendingCloseDeviceId) await this.disconnect(this.pendingCloseDeviceId);
    this.eventDecoder.reset();
    this.connectionGeneration += 1;
    const generation = this.connectionGeneration;
    this.unbindConnectionState();
    this.physicallyDisconnectedDeviceId = '';
    this.networkChange = null;
    bleLogger.info('service', 'connect:start', { deviceId });
    this.activeTrace = trace ?? null;
    await bleDataSource.createConnection(deviceId);
    if (generation !== this.connectionGeneration) throw new Error('蓝牙连接已失效');
    this.activeDeviceId = deviceId;
    this.bindConnectionState(deviceId, generation);
    this.currentDeviceInfo = null;
    const identity = this.advertisingInfoByDeviceId.get(deviceId);
    this.currentProductID = identity?.productID || '';
    this.currentMac = identity?.mac || '';
    this.currentModuleVersion = identity?.moduleVersion || 0;
    bleLogger.info('service', 'connect:connection-created', { deviceId });

    const services = await bleDataSource.getServices(deviceId);
    if (generation !== this.connectionGeneration) throw new Error('蓝牙连接已失效');
    const service = services.find((item) => uuidMatchesShort(item.uuid, LLSYNC_SHORT_SERVICE_UUID));
    if (!service) {
      bleLogger.error('service', 'connect:service-not-found', { deviceId, services });
      throw new Error('当前设备不支持一键添加');
    }
    this.activeServiceId = service.uuid;
    bleLogger.info('service', 'connect:service-selected', { deviceId, serviceId: service.uuid });

    const chars = await bleDataSource.getCharacteristics(deviceId, service.uuid);
    if (generation !== this.connectionGeneration) throw new Error('蓝牙连接已失效');
    const writeChar = chars.find((item) => uuidMatchesShort(item.uuid, LLSYNC_SHORT_WRITE_UUID));
    const notifyChar = chars.find((item) => uuidMatchesShort(item.uuid, LLSYNC_SHORT_NOTIFY_UUID));
    if (!writeChar) throw new Error('设备连接不可用，请重试');
    if (!notifyChar) throw new Error('设备连接不可用，请重试');
    this.activeWriteCharId = writeChar.uuid;
    this.activeNotifyCharId = notifyChar.uuid;
    bleLogger.info('service', 'connect:characteristics-selected', {
      deviceId,
      writeCharId: writeChar.uuid,
      notifyCharId: notifyChar.uuid,
    });

    await delay(GATT_OPERATION_SETTLE_MS);
    if (generation !== this.connectionGeneration) throw new Error('蓝牙连接已失效');
    await this.enableNotify(trace);
    if (generation !== this.connectionGeneration) throw new Error('蓝牙连接已失效');
    const deviceInfo = eventValue<LLSyncDeviceInfo>(await this.writeAndWaitForEvent(
      buildGetDeviceInfoCommand(),
      LLSYNC_EVENT_DEVICE_INFO,
      WAIT_GET_DEVICE_INFO_MS,
      '获取设备信息超时',
      trace,
    ));
    if (generation !== this.connectionGeneration) throw new Error('蓝牙连接已失效');
    this.currentDeviceInfo = deviceInfo;
    this.attMtu = Math.max(DEFAULT_ATT_MTU, deviceInfo.mtu || DEFAULT_ATT_MTU);
    bleLogger.info('service', 'connect:device-info', deviceInfo);

    if (deviceInfo.needSetMtu) {
      await this.syncMtu(deviceId, this.attMtu, trace);
    } else {
      this.attMtu = await this.readCurrentMtu(deviceId, this.attMtu);
    }
    bleLogger.info('service', 'connect:ready', {
      deviceId,
      serviceId: this.activeServiceId,
      writeCharId: this.activeWriteCharId,
      notifyCharId: this.activeNotifyCharId,
      mtu: this.attMtu,
      productID: this.currentProductID,
      deviceName: this.currentDeviceInfo?.deviceName || '',
    });
  }

  async disconnect(deviceId: string): Promise<void> {
    this.unbindConnectionState();
    this.eventDecoder.reset();
    this.connectionGeneration += 1;
    this.networkChange = null;
    bleLogger.info('service', 'disconnect:start', { deviceId, activeDeviceId: this.activeDeviceId });
    this.unbindNotify();
    this.rejectAllPendingEvents('蓝牙连接已断开');
    this.handlers.clear();
    this.activeDeviceId = '';
    this.activeServiceId = '';
    this.activeWriteCharId = '';
    this.activeNotifyCharId = '';
    this.currentDeviceInfo = null;
    this.currentProductID = '';
    this.currentMac = '';
    this.currentModuleVersion = 0;
    this.activeTrace = null;
    if (deviceId && deviceId !== this.physicallyDisconnectedDeviceId) {
      this.pendingCloseDeviceId = deviceId;
      await bleDataSource.closeConnection(deviceId, true);
    }
    if (this.pendingCloseDeviceId === deviceId) this.pendingCloseDeviceId = '';
    bleLogger.info('service', 'disconnect:done', { deviceId });
  }

  /** bindConnectionState 将物理断开即时传到协议等待器，给本地结果重查保留时间。 */
  private bindConnectionState(deviceId: string, generation: number): void {
    this.unbindConnectionState();
    const listener = (payload: unknown): void => {
      if (this.connectionStateListener !== listener || generation !== this.connectionGeneration) return;
      const state = payload as { deviceId?: string; connected?: boolean } | null;
      if (!state || state.deviceId !== deviceId || state.connected !== false) return;
      this.physicallyDisconnectedDeviceId = deviceId;
      this.connectionGeneration += 1;
      this.eventDecoder.reset();
      this.networkChange = null;
      this.unbindConnectionState();
      this.unbindNotify();
      this.rejectAllPendingEvents('蓝牙连接已断开');
      this.activeDeviceId = '';
      this.currentDeviceInfo = null;
      this.currentProductID = '';
    };
    this.connectionStateListener = listener;
    eventBus.on('ble:connection-state', listener);
  }

  /** unbindConnectionState 只解除本实例拥有的监听，迟到闭包由代次再次拒绝。 */
  private unbindConnectionState(): void {
    if (this.connectionStateListener) eventBus.off('ble:connection-state', this.connectionStateListener);
    this.connectionStateListener = null;
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    bleLogger.debug('service', 'onMessage:handler-added', { count: this.handlers.size });
    return () => {
      this.handlers.delete(handler);
      bleLogger.debug('service', 'onMessage:handler-removed', { count: this.handlers.size });
    };
  }

  /** sendProvision 按官方流程完成 E1/E2/E3/E4，并在 token 成功后分发绑定消息。 */
  async sendProvision(params: { ssid: string; pwd?: string; uid?: string }, trace?: LLSyncTraceSession): Promise<void> {
    bleLogger.info('service', 'sendProvision:start', {
      ssid: params.ssid,
      hasPwd: !!params.pwd,
      hasToken: !!params.uid,
    });
    await this.setWiFiMode(trace);
    await delay(LLSYNC_WRITE_GAP_MS);
    await this.setWiFiInfo(params.ssid, params.pwd ?? '', trace);
    await delay(LLSYNC_WRITE_GAP_MS);
    const wifiState = await this.connectWifi(trace);
    if (!wifiState.connected) {
      throw new Error('设备连接 WiFi 失败');
    }

    if (params.uid) {
      await this.sendToken(params.uid, trace);
    }
    bleLogger.info('service', 'sendProvision:done');
  }

  /** getNetworkChangeInfo 校验广播产品与 GATT 设备名，并等待当前连接的换网能力通知。 */
  async getNetworkChangeInfo(target: { productID: string; deviceName: string; requestId?: string }): Promise<LLSyncNetworkChange> {
    const generation = this.connectionGeneration;
    this.assertNetworkIdentity(target, generation);
    const status = this.networkChange ?? eventValue<LLSyncNetworkChange>(await this.waitForEvent(
      LLSYNC_EVENT_NETWORK_CHANGE, 3000, '设备未开启换网或固件不支持，请在设备菜单开启或升级固件',
    ));
    this.assertNetworkIdentity(target, generation);
    const readableCommit = status?.phase === 7 && target.requestId === status.requestId;
    if (!status || status.version !== 2 || status.mode !== 1 || (![2, 3].includes(status.phase) && !readableCommit)
      || status.error !== 0) throw new Error('设备当前不接受换网，请重新开启更换 Wi-Fi');
    return { ...status };
  }

  /** readNetworkChangeResult 仅重查同一请求的已提交结果，绝不写入模式、密码或绑定 Token。 */
  async readNetworkChangeResult(
    params: { productID: string; deviceName: string; requestId: string; ssid: string },
    trace?: LLSyncTraceSession,
  ): Promise<void> {
    const generation = this.connectionGeneration;
    const status = await this.getNetworkChangeInfo(params);
    this.assertNetworkIdentity(params, generation);
    if (status.phase !== 7 || status.requestId !== params.requestId) throw new Error('设备换网结果尚未确认');
    const result = await this.connectWifi(trace);
    this.assertNetworkIdentity(params, generation);
    this.assertNetworkRequest(params.requestId, true);
    if (!result.connected || result.ssid !== params.ssid) throw new Error('设备未确认目标 WiFi 连接成功');
  }

  /** sendNetworkChange 等待设备保存后返回的标准 E2 成功，换网不发送绑定 Token。 */
  async sendNetworkChange(
    params: { productID: string; deviceName: string; requestId: string; ssid: string; pwd?: string },
    trace?: LLSyncTraceSession,
  ): Promise<void> {
    const generation = this.connectionGeneration;
    const status = await this.getNetworkChangeInfo(params);
    if (status.requestId !== params.requestId) throw new Error('换网请求已过期，请重新开始');
    this.assertNetworkIdentity(params, generation);
    // 重试页面只允许读取同一已完成请求，不能再次覆盖已提交配置。
    if (status.phase === 7) return this.readNetworkChangeResult(params, trace);
    await this.setWiFiMode(trace);
    await delay(LLSYNC_WRITE_GAP_MS);
    this.assertNetworkIdentity(params, generation);
    this.assertNetworkRequest(params.requestId);
    await this.setWiFiInfo(params.ssid, params.pwd ?? '', trace);
    await delay(LLSYNC_WRITE_GAP_MS);
    this.assertNetworkIdentity(params, generation);
    this.assertNetworkRequest(params.requestId);
    // 复用原联网请求/回执，E2 只在设备可靠保存后发送；不等待云端属性。
    const result = await this.connectWifi(trace);
    this.assertNetworkIdentity(params, generation);
    // E2 不携带请求 ID：拒绝等待期间已被能力通知撤销或替换的事务。
    // 成功通知可能早于阶段通知，允许仍停留在候选阶段，但不接受失败阶段。
    this.assertNetworkRequest(params.requestId, true);
    if (!result.connected || result.ssid !== params.ssid) throw new Error('设备未确认目标 WiFi 连接成功');
  }

  /** assertNetworkIdentity 阻止错误设备、已关闭连接及上一代异步操作写入候选凭据。 */
  private assertNetworkIdentity(target: { productID: string; deviceName: string }, generation: number): void {
    if (generation !== this.connectionGeneration || !this.activeDeviceId) throw new Error('换网连接已失效');
    if (this.currentProductID !== target.productID || this.currentDeviceInfo?.deviceName !== target.deviceName) {
      const message = '蓝牙设备与所选设备不一致，未发送网络信息';
      // 使用既有结构化失败码，候选探测不能依赖中文报错字符串猜测身份。
      throw Object.assign(new Error(message), createProvisionFailure('DEVICE_IDENTITY_MISMATCH', 'connecting_ble', message, 'wifi_ready'));
    }
  }

  /** assertNetworkRequest 防止两次 BLE 写入之间收到取消、超时或其他事务通知后继续发送。 */
  private assertNetworkRequest(requestId: string, allowCommitted = false): void {
    const status = this.networkChange;
    const acceptedPhases = allowCommitted ? [2, 3, 7] : [2, 3];
    if (!status || status.requestId !== requestId || status.error !== 0 || !acceptedPhases.includes(status.phase)) {
      throw new Error('换网请求已结束或过期，请重新开始');
    }
  }

  /** getModuleLog 失败后排查用，正常配网链路不阻塞此调用。 */
  async getModuleLog(trace?: LLSyncTraceSession): Promise<string> {
    const event = await this.writeAndWaitForEvent(
      buildGetLogCommand(),
      LLSYNC_EVENT_GET_DEV_LOG_INFO,
      WAIT_GET_DEV_LOG_MS,
      '获取设备日志超时',
      trace,
    );
    const value = event.value as { logStr?: string } | undefined;
    return value?.logStr || '';
  }

  private async setWiFiMode(trace?: LLSyncTraceSession): Promise<void> {
    const event = await this.writeAndWaitForEvent(
      buildSetWifiModeCommand(),
      LLSYNC_EVENT_SET_WIFI_MODE_RESULT,
      WAIT_SET_WIFI_MODE_MS,
      '准备设备联网超时',
      trace,
    );
    if (!isLLSyncSuccessResult(event.value)) throw new Error('准备设备联网失败');
  }

  private async setWiFiInfo(ssid: string, password: string, trace?: LLSyncTraceSession): Promise<void> {
    const event = await this.writeAndWaitForEvent(
      buildSetWifiInfoCommand(ssid, password),
      LLSYNC_EVENT_SET_WIFI_INFO_RESULT,
      WAIT_SET_WIFI_INFO_MS,
      '发送网络信息超时',
      trace,
    );
    if (!isLLSyncSuccessResult(event.value)) throw new Error('发送网络信息失败');
  }

  private async connectWifi(trace?: LLSyncTraceSession): Promise<LLSyncWifiConnectResult> {
    return eventValue<LLSyncWifiConnectResult>(await this.writeAndWaitForEvent(
      buildConnectWifiCommand(),
      LLSYNC_EVENT_SET_WIFI_CONNECT_RESULT,
      WAIT_SET_WIFI_CONNECT_MS,
      '等待设备联网超时',
      trace,
    ));
  }

  private async sendToken(token: string, trace?: LLSyncTraceSession): Promise<void> {
    const ackWaiting = this.waitForEvent(LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT, WAIT_SET_WIFI_TOKEN_MS, '确认设备添加超时');
    try {
      await this.writeCommand(buildSendTokenCommand(token), trace);
    } catch (error) {
      ackWaiting.cancel(error);
      throw error;
    }
    this.dispatchTokenWritten();
    const event = await ackWaiting;
    if (!isLLSyncSuccessResult(event.value)) {
      throw new Error('设备添加失败');
    }
    bleLogger.info('service', 'sendToken:ack-success', { value: event.value });
  }

  /** dispatchTokenWritten 在 E4 写入成功后提示页面进入设备绑定确认阶段。 */
  private dispatchTokenWritten(): void {
    this.dispatchMessage({
      type: TYPE_BIND_TOKEN_WRITTEN,
      value: {
        productID: this.currentProductID,
        deviceName: this.currentDeviceInfo?.deviceName || '',
        mac: this.currentMac,
        moduleVersion: this.currentModuleVersion,
      },
    });
  }

  private async writeAndWaitForEvent(
    command: number[],
    eventType: number,
    timeoutMs: number,
    timeoutMessage: string,
    trace?: LLSyncTraceSession,
  ): Promise<LLSyncEvent> {
    const waiting = this.waitForEvent(eventType, timeoutMs, timeoutMessage);
    try {
      await this.writeCommand(command, trace);
    } catch (error) {
      waiting.cancel(error);
      throw error;
    }
    return waiting;
  }

  /** waitForEvent 提前监听 ACK；写入失败仅取消本次等待，断连拒绝仍由上层正常接收。 */
  private waitForEvent(eventType: number, timeoutMs: number, timeoutMessage: string): Promise<LLSyncEvent> & { cancel: (error: unknown) => void } {
    // Promise 构造器同步赋值；cancel 不影响同类型的其他等待者。
    let current!: PendingEvent;
    const waiting = new Promise<LLSyncEvent>((resolve, reject) => {
      const pending: PendingEvent = {
        resolve,
        reject,
        timer: setTimeout(() => {
          this.removePendingEvent(eventType, pending);
          reject(new Error(timeoutMessage));
        }, timeoutMs),
      };
      const set = this.pendingEvents.get(eventType) || new Set<PendingEvent>();
      current = pending;
      set.add(pending);
      this.pendingEvents.set(eventType, set);
    });
    // 写入尚未完成时 ACK 可能先超时/断连，立即接住拒绝但不改变原 Promise 的失败状态。
    void waiting.catch(() => {});
    return Object.assign(waiting, {
      cancel: (error: unknown) => {
        this.removePendingEvent(eventType, current);
        current.reject(error instanceof Error ? error : new Error('蓝牙命令写入失败'));
      },
    });
  }

  private resolvePendingEvent(event: LLSyncEvent): void {
    const set = this.pendingEvents.get(event.type);
    if (!set || set.size === 0) return;
    const [pending] = Array.from(set);
    this.removePendingEvent(event.type, pending);
    pending.resolve(event);
  }

  private removePendingEvent(eventType: number, pending: PendingEvent): void {
    clearTimeout(pending.timer);
    const set = this.pendingEvents.get(eventType);
    if (!set) return;
    set.delete(pending);
    if (set.size === 0) this.pendingEvents.delete(eventType);
  }

  private rejectAllPendingEvents(message: string): void {
    for (const [eventType, set] of this.pendingEvents.entries()) {
      for (const pending of set) {
        this.removePendingEvent(eventType, pending);
        pending.reject(new Error(message));
      }
    }
    this.pendingEvents.clear();
  }

  private async writeCommand(command: number[], trace?: LLSyncTraceSession): Promise<void> {
    bleLogger.info('service', 'writeCommand:start', {
      deviceId: this.activeDeviceId,
      serviceId: this.activeServiceId,
      characteristicId: this.activeWriteCharId,
      opcode: command[0], byteLength: command.length,
    });
    (trace ?? this.activeTrace)?.recordTx(command);
    await bleDataSource.writeCharacteristic(
      this.activeDeviceId,
      this.activeServiceId,
      this.activeWriteCharId,
      bytesToArrayBuffer(command),
      'write',
    );
    bleLogger.info('service', 'writeCommand:success', { opcode: command[0], byteLength: command.length });
  }

  private async enableNotify(trace?: LLSyncTraceSession): Promise<void> {
    bleLogger.info('service', 'enableNotify:start', {
      deviceId: this.activeDeviceId,
      serviceId: this.activeServiceId,
      characteristicId: this.activeNotifyCharId,
    });
    await new Promise<void>((resolve, reject) => {
      uni.notifyBLECharacteristicValueChange({
        deviceId: this.activeDeviceId,
        serviceId: this.activeServiceId,
        characteristicId: this.activeNotifyCharId,
        state: true,
        success: (res) => {
          bleLogger.info('service', 'enableNotify:success', res);
          setTimeout(resolve, GATT_OPERATION_SETTLE_MS);
        },
        fail: (err) => {
          bleLogger.error('service', 'enableNotify:fail', err);
          reject(new Error(err.errMsg));
        },
      });
    });
    this.bindNotify(trace);
  }

  private bindNotify(trace?: LLSyncTraceSession): void {
    if (this.notifyBound) {
      bleLogger.debug('service', 'bindNotify:skip-already-bound');
      return;
    }
    this.notifyBound = true;
    bleLogger.info('service', 'bindNotify:start');
    const deviceId = this.activeDeviceId;
    const callback: BleNotifyHandler = (result) => {
      if (this.notifyCallback !== callback) return;
      this.handleNotify(result, deviceId, trace ?? this.activeTrace);
    };
    this.notifyCallback = callback;
    (uni.onBLECharacteristicValueChange as unknown as (cb: BleNotifyHandler) => void)(callback);
  }

  private unbindNotify(): void {
    const callback = this.notifyCallback;
    this.notifyCallback = null;
    if (this.notifyBound && callback) {
      const runtimeApi = getRuntimeApi();
      const off = runtimeApi.offBLECharacteristicValueChange as ((handler: BleNotifyHandler) => void) | undefined;
      off?.call(runtimeApi, callback);
    }
    this.notifyBound = false;
    bleLogger.info('service', 'unbindNotify');
  }

  private handleNotify(res: BleNotifyResult, deviceId: string, trace: LLSyncTraceSession | null): void {
    if (!deviceId || res.deviceId !== deviceId) return;
    if (!uuidMatchesShort(res.characteristicId, LLSYNC_SHORT_NOTIFY_UUID)) return;

    const bytes = Array.from(new Uint8Array(res.value));
    trace?.recordRx(bytes);
    const hex = bytes.map((item) => item.toString(16).padStart(2, '0')).join(' ');
    bleLogger.info('service', 'handleNotify:raw', {
      deviceId: res.deviceId,
      serviceId: res.serviceId,
      characteristicId: res.characteristicId,
      byteLength: bytes.length,
      hex,
    });

    const event = this.eventDecoder.push(bytes);
    if (!event) {
      bleLogger.warn('service', 'handleNotify:parse-fail', { bytes });
      return;
    }
    if (!event.value) return;
    if (event.type === LLSYNC_EVENT_NETWORK_CHANGE) {
      if (!event.value) return;
      this.networkChange = event.value as LLSyncNetworkChange;
    }
    this.resolvePendingEvent(event);
    if (event.type === LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT && !isLLSyncSuccessResult(event.value)) {
      this.dispatchMessage({ type: TYPE_PROVISION_FAIL, value: event.value, raw: event.raw });
      return;
    }
    this.dispatchMessage({ type: event.type, value: event.value, raw: event.raw });
  }

  private dispatchMessage(msg: BleMessage): void {
    bleLogger.info('service', 'dispatchMessage:start', {
      type: msg.type,
      value: msg.value,
      handlerCount: this.handlers.size,
    });
    for (const handler of this.handlers) {
      try {
        handler(msg);
      } catch (error) {
        bleLogger.error('service', 'dispatchMessage:handler-error', error);
      }
    }
  }

  private async syncMtu(deviceId: string, desiredMtu: number, trace?: LLSyncTraceSession): Promise<void> {
    let ok = true;
    try {
      this.attMtu = await this.negotiateMtu(deviceId, desiredMtu);
    } catch (error) {
      ok = false;
      bleLogger.warn('service', 'syncMtu:negotiate-fail', { deviceId, desiredMtu, error });
    }
    try {
      await this.writeCommand(buildWriteMtuResultCommand(ok), trace);
    } catch (error) {
      bleLogger.warn('service', 'syncMtu:write-result-fail', { deviceId, ok, error });
    }
  }

  private readCurrentMtu(deviceId: string, fallbackMtu: number): Promise<number> {
    bleLogger.info('service', 'readCurrentMtu:start', { deviceId, fallbackMtu });
    return new Promise((resolve) => {
      const runtimeApi = getRuntimeApi();
      const api = runtimeApi.getBLEMTU as ((opts: WechatMiniprogram.GetBLEMTUOption) => void) | undefined;
      if (!api) {
        resolve(fallbackMtu);
        return;
      }
      try {
        api.call(runtimeApi, {
          deviceId,
          success: (res: { mtu?: number } | undefined) => resolve(res?.mtu ?? fallbackMtu),
          fail: () => resolve(fallbackMtu),
        });
      } catch {
        resolve(fallbackMtu);
      }
    });
  }

  private negotiateMtu(deviceId: string, mtu: number): Promise<number> {
    bleLogger.info('service', 'negotiateMtu:start', { deviceId, mtu });
    return new Promise((resolve, reject) => {
      const runtimeApi = getRuntimeApi();
      const api = runtimeApi.setBLEMTU as ((opts: WechatMiniprogram.SetBLEMTUOption) => void) | undefined;
      if (!api) {
        resolve(mtu);
        return;
      }
      try {
        api.call(runtimeApi, {
          deviceId,
          mtu,
          success: (res: { mtu?: number } | undefined) => resolve(res?.mtu ?? mtu),
          fail: (err) => reject(new Error((err as { errMsg?: string }).errMsg || 'MTU 设置失败')),
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const bluetoothConfigService = new BluetoothConfigService();
