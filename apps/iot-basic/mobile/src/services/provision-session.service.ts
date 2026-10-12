/** 配网会话编排：首次绑定与换网显式分流，异步结果按会话代次隔离。 */
import type { LLSyncNetworkChange } from '../utils/llsync-protocol';
import { DeviceNetworkRepository } from '../data/repositories/device-network.repository';
import {
  bluetoothConfigService,
  TYPE_BIND_TOKEN_WRITTEN,
  TYPE_PROVISION_FAIL,
  TYPE_PROVISION_SUCCESS,
  TYPE_SERVER_INFO,
  TYPE_WIFI_CONNECT_RESULT,
  type BleMessage,
} from './bluetooth-config.service';
import { bleLogger, getBleLogHistory, subscribeBleLogs, type BleLogEntry } from '../data/datasources/bluetooth.datasource';
import { deviceService } from './device.service';
import { isApiError } from '../utils/request';
import type { BleScanResult } from '../domain/models/ble-scan-result.model';
import { createProvisionFailure, isProvisionFailure, type ProvisionFailure } from '../domain/models/provision-failure.model';
import {
  createInitialProvisionSessionState,
  type ProvisionSessionState,
  type ProvisionStage,
} from '../domain/models/provision-session-state.model';
import type { WifiCredential } from '../domain/models/wifi-credential.model';
import {
  llsyncProvisionTrace,
  type LLSyncTraceResult,
  type LLSyncTraceSession,
} from '../utils/llsync-provision-trace';

/** 将 BLE 调试日志条目格式化为单行字符串。 */
function formatBleLogEntry(entry: BleLogEntry): string {
  const payload = entry.payload === undefined ? '' : ` ${JSON.stringify(entry.payload)}`;
  return `[${entry.time}][${entry.level}][${entry.scope}] ${entry.message}${payload}`;
}

export interface ProvisionTransport {
  /** 只在当前 GATT 身份匹配后返回换网能力，不支持时不得退回首次绑定。 */
  getNetworkChangeInfo?(target: { productID: string; deviceName: string; requestId?: string }): Promise<LLSyncNetworkChange>;
  /** 发送候选并等待本地保存成功；重试已提交请求时只查询结果。 */
  sendNetworkChange?(params: { productID: string; deviceName: string; requestId: string; ssid: string; pwd?: string }, trace: LLSyncTraceSession): Promise<void>;
  /** 只读恢复已提交结果，不发送候选凭据；不支持时保留未确认失败。 */
  readNetworkChangeResult?(params: { productID: string; deviceName: string; requestId: string; ssid: string }, trace: LLSyncTraceSession): Promise<void>;
  scanCandidates(options?: { timeoutMs?: number }): Promise<BleScanResult[]>;
  connect(deviceId: string, trace: LLSyncTraceSession): Promise<unknown>;
  sendProvision(params: { ssid: string; pwd?: string; uid?: string }, trace: LLSyncTraceSession): Promise<void>;
  onMessage(handler: (message: BleMessage) => void): () => void;
  getModuleLog?(trace: LLSyncTraceSession): Promise<string>;
  disconnect?(deviceId: string): Promise<void> | void;
  stopScan?(): void;
  clearLogs?(): void;
}

export interface ProvisionBindingGateway {
  createBindToken?(): Promise<{ token: string; status: number }>;
  getBindTokenStatus?(token: string): Promise<{ token: string; status: number }>;
  bind?(productID: string, deviceName: string, token?: string): Promise<void>;
  /** 解绑设备：用于 bindLevel=3（弱绑定）下"先解绑后重绑"流程。 */
  unbind?(productID: string, deviceName: string): Promise<void>;
  /** 读取产品绑定等级：1=强 / 2=中 / 3=弱，失败应返回 1。 */
  getProductBindLevel?(productID: string): Promise<number>;
}

/** 后端"设备已被他人绑定"业务码（与老 harmony 项目对齐）。 */
export const BIND_OWNED_BY_OTHER_CODE = 2000007;

export interface ProvisionSessionTimeouts {
  scanMs: number;
  protocolMs: number;
  bindingMs: number;
  bindPollIntervalMs: number;
}

interface ProvisionSessionOptions {
  /** 网络入口权限网关；仅查询既有项目权限，不签发 BLE 许可。 */
  networkGateway?: ProvisionNetworkGateway;
  transport?: ProvisionTransport;
  bindingGateway?: ProvisionBindingGateway;
  timeouts?: Partial<ProvisionSessionTimeouts>;
}

/** ProvisionNetworkGateway 校验官方客户端项目管理权限，不负责唤起设备。 */
export interface ProvisionNetworkGateway {
  /** 缺失授权能力时拒绝，不能降级为未鉴权换网。 */
  authorize?(target: { productID: string; deviceName: string }): Promise<{ allowed: boolean }>;
}

/** 默认网关复用设备、账号和项目查询，与物模型及绑定接口分离。 */
class DeviceNetworkGateway extends DeviceNetworkRepository implements ProvisionNetworkGateway {
}

const DEFAULT_TIMEOUTS: ProvisionSessionTimeouts = {
  scanMs: 8000,
  protocolMs: 150000,
  bindingMs: 90000,
  bindPollIntervalMs: 2000,
};

/**
 * bindLevel=3（弱绑定）解绑后等待 BLE/云端状态同步的延迟，与老 harmony 项目保持一致。
 * 见 ykhl-harmony-app/pages/devices/add-result.uvue: weakBinding/middleBinding 中的 800ms。
 */
export const REBIND_AFTER_UNBIND_DELAY_MS = 800;

class BluetoothConfigProvisionTransport implements ProvisionTransport {
  /** getNetworkChangeInfo 委托 BLE 层核验目标身份和能力。 */
  getNetworkChangeInfo(target: { productID: string; deviceName: string }): Promise<LLSyncNetworkChange> {
    return bluetoothConfigService.getNetworkChangeInfo(target);
  }

  /** sendNetworkChange 委托候选专用路径，禁止调用绑定传输。 */
  sendNetworkChange(params: { productID: string; deviceName: string; requestId: string; ssid: string; pwd?: string }, trace: LLSyncTraceSession): Promise<void> {
    return bluetoothConfigService.sendNetworkChange(params, trace);
  }
  private activeDeviceId = '';

  async scanCandidates(options: { timeoutMs?: number } = {}): Promise<BleScanResult[]> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUTS.scanMs;
    const candidates: BleScanResult[] = [];
    const seen = new Set<string>();
    try {
      await bluetoothConfigService.startScan((device) => {
        if (seen.has(device.deviceId)) return;
        if (!this.isLikelyProvisionDevice(device)) return;
        seen.add(device.deviceId);
        candidates.push(device);
      });
    } catch (err) {
      throw createProvisionFailure(
        'BLE_ADAPTER_NOT_READY',
        'scanning_ble',
        (err as Error).message || '蓝牙不可用',
      );
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    });
    bluetoothConfigService.stopScan();
    return candidates;
  }

  async connect(deviceId: string, trace: LLSyncTraceSession): Promise<void> {
    this.activeDeviceId = deviceId;
    await bluetoothConfigService.connect(deviceId, trace);
  }

  async sendProvision(params: { ssid: string; pwd?: string; uid?: string }, trace: LLSyncTraceSession): Promise<void> {
    await bluetoothConfigService.sendProvision(params, trace);
  }

  onMessage(handler: (message: BleMessage) => void): () => void {
    return bluetoothConfigService.onMessage(handler);
  }

  async getModuleLog(trace: LLSyncTraceSession): Promise<string> {
    return bluetoothConfigService.getModuleLog(trace);
  }

  async disconnect(deviceId: string): Promise<void> {
    await bluetoothConfigService.disconnect(deviceId || this.activeDeviceId);
  }

  stopScan(): void {
    bluetoothConfigService.stopScan();
  }

  clearLogs(): void {
    bluetoothConfigService.clearLogs();
  }

  private isLikelyProvisionDevice(device: BleScanResult): boolean {
    return !!device.productID;
  }
}

function isLocalMockDevice(device: BleScanResult | null): boolean {
  const name = `${device?.name || ''} ${device?.localName || ''}`.toLowerCase();
  return name.includes('mock');
}

function isDevelopEnv(): boolean {
  try {
    if (typeof wx === 'undefined') return false;
    const info = uni.getAccountInfoSync?.();
    return info?.miniProgram?.envVersion === 'develop';
  } catch {
    return false;
  }
}

function toNonEmptyString(value: unknown): string {
  if (typeof value === 'string') return value.replace(/\0/g, '').trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function pickStringField(value: unknown, keys: string[]): string {
  const directValue = toNonEmptyString(value);
  if (directValue) return directValue;
  if (!value || typeof value !== 'object') return '';

  const payload = value as Record<string, unknown>;
  for (const key of keys) {
    const fieldValue = toNonEmptyString(payload[key]);
    if (fieldValue) return fieldValue;
  }
  if (payload.value && payload.value !== value) {
    return pickStringField(payload.value, keys);
  }
  return '';
}

function resolveBindDeviceName(message: BleMessage): string {
  const DEVICE_NAME_KEYS = ['deviceName', 'DeviceName', 'device_name', 'mac', 'Mac', 'MAC', 'did', 'deviceId'];
  return pickStringField(message.value, DEVICE_NAME_KEYS) || pickStringField(message as unknown, DEVICE_NAME_KEYS);
}

function resolveBindProductID(message: BleMessage): string {
  const PRODUCT_ID_KEYS = ['productID', 'ProductID', 'productId', 'product_id', 'pid'];
  return pickStringField(message.value, PRODUCT_ID_KEYS) || pickStringField(message as unknown, PRODUCT_ID_KEYS);
}

/** 将 BLE 流程中的原始异常归一成用户可理解的配网失败类型。 */
function createFailureFromProvisionError(error: unknown, stage: ProvisionStage): ProvisionFailure {
  const message = (error as Error).message || '未知错误';
  if (message.includes('蓝牙连接已断开')) {
    return createProvisionFailure('BLE_CONNECT_FAILED', stage, message, 'wifi_ready');
  }
  if (message.includes('确认设备添加超时') || message.includes('设备添加失败')) {
    return createProvisionFailure('BIND_FAILED', 'binding_device', message, 'wifi_ready');
  }
  if (message.includes('等待设备联网超时')) {
    return createProvisionFailure('PROTOCOL_TIMEOUT', 'waiting_device_online', message, 'wifi_ready');
  }
  if (message.includes('设备连接 WiFi 失败') || message.includes('设备联网失败')) {
    return createProvisionFailure('PROVISION_REJECTED', 'waiting_device_online', message, 'wifi_ready');
  }
  return createProvisionFailure('UNKNOWN', stage, message);
}

/** StaleProvisionSessionError 表示异步结果所属会话已被取消或替换。 */
class StaleProvisionSessionError extends Error {
  constructor() {
    super('配网会话已被替换');
    this.name = 'StaleProvisionSessionError';
  }
}

export class ProvisionSessionService {
  /** 换网结果仅由当前设备、当前请求的云端终态确认。 */
  private readonly networkGateway: ProvisionNetworkGateway;
  private state: ProvisionSessionState = createInitialProvisionSessionState();
  private selectedCandidate: BleScanResult | null = null;
  private listeners: Set<(state: ProvisionSessionState) => void> = new Set();
  private readonly transport: ProvisionTransport;
  private readonly bindingGateway: ProvisionBindingGateway;
  private readonly timeouts: ProvisionSessionTimeouts;
  private protocolTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeMessage: (() => void) | null = null;
  private bindDeviceName = '';
  private bindingStarted = false;
  /** currentTrace 是当前配网唯一追踪句柄，所有 BLE 收发和终态共享该实例。 */
  private currentTrace: LLSyncTraceSession | null = null;
  /** traceFinalization 串行等待上一轮 E5 诊断和最终结果完成，避免会话交叉。 */
  private traceFinalization: Promise<void> = Promise.resolve();
  /** bleConnected 标记当前会话是否具备发送 E5 诊断命令的条件。 */
  private bleConnected = false;
  /** sessionGeneration 使取消、重置和重复启动后的旧异步结果自动失效。 */
  private sessionGeneration = 0;
  /** activeStartCompletion 让新一轮在旧 BLE 命令链完全退出后才建立连接。 */
  private activeStartCompletion: Promise<void> | null = null;

  constructor(options: ProvisionSessionOptions = {}) {
    this.networkGateway = options.networkGateway ?? new DeviceNetworkGateway();
    this.transport = options.transport ?? new BluetoothConfigProvisionTransport();
    this.bindingGateway = options.bindingGateway ?? deviceService;
    this.timeouts = { ...DEFAULT_TIMEOUTS, ...options.timeouts };
  }

  getState(): ProvisionSessionState {
    return this.state;
  }

  subscribe(listener: (state: ProvisionSessionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.sessionGeneration += 1;
    void this.finishCurrentTrace({
      result: 'failed',
      stage: this.state.stage,
      failureCode: 'SESSION_RESET',
      summary: '配网会话被重置',
    });
    this.clearRuntime();
    this.selectedCandidate = null;
    this.bindDeviceName = '';
    this.bindingStarted = false;
    this.bleConnected = false;
    this.state = createInitialProvisionSessionState();
    this.notify();
  }

  /** configureNetworkChange 设置已绑定目标；本方法不授予权限，写入前必须独立取得许可。 */
  configureNetworkChange(target: { productID: string; deviceName: string; requestId?: string }): void {
    if (!target.productID || !target.deviceName || (target.requestId !== undefined && !/^[0-9a-f]{16}$/.test(target.requestId))) {
      throw new Error('换网设备或请求标识无效');
    }
    this.reset();
    this.update({ mode: 'changeNetwork', networkTarget: { ...target } });
  }

  /** requestNetworkChange 预检查项目管理权限；设备窗口仍由用户从本地菜单开启。 */
  async requestNetworkChange(target: { productID: string; deviceName: string }): Promise<void> {
    this.configureNetworkChange(target);
    const generation = this.sessionGeneration;
    if (!this.networkGateway.authorize) throw new Error('网络授权服务不可用');
    const permission = await this.networkGateway.authorize(target);
    this.assertCurrentGeneration(generation);
    if (!permission.allowed) throw new Error('仅项目管理员可以管理设备网络');
    this.update({ stage: 'preparing' });
  }

  selectCandidate(device: BleScanResult): void {
    if (!device.deviceId) return;
    this.selectedCandidate = device;
  }

  confirmPrepared(): void {
    this.update({ stage: 'preparing', failure: null });
  }

  acceptWifi(credential: WifiCredential): void {
    this.update({ stage: 'wifi_ready', credential, failure: null, locationWarning: '' });
  }

  async start(): Promise<void> {
    const credential = this.state.credential;
    if (!credential) {
      throw this.fail('WIFI_LIST_UNAVAILABLE', 'wifi_ready', '未选择 WiFi');
    }

    const previousStartCompletion = this.activeStartCompletion;
    let completeStart!: () => void;
    const startCompletion = new Promise<void>((resolve) => { completeStart = resolve; });
    this.activeStartCompletion = startCompletion;
    const generation = ++this.sessionGeneration;
    let trace: LLSyncTraceSession | null = null;
    try {
      if (this.currentTrace) {
        await this.finishCurrentTrace({
          result: 'failed',
          stage: this.state.stage,
          failureCode: 'SESSION_REPLACED',
          summary: '新的配网尝试替换了当前会话',
        });
      }
      if (previousStartCompletion) {
        this.clearRuntime();
        await this.disconnectCurrentDevice();
        await previousStartCompletion;
      }
      await this.traceFinalization;
      this.assertCurrentGeneration(generation);
      const selectedCandidate = this.selectedCandidate;
      this.bindDeviceName = '';
      this.bindingStarted = false;
      this.bleConnected = false;
      this.transport.clearLogs?.();
      this.clearRuntime();
      this.currentTrace = llsyncProvisionTrace.start({
        stage: 'scanning_ble',
        bleDeviceId: selectedCandidate?.deviceId,
        productID: selectedCandidate?.productID,
        deviceName: selectedCandidate?.deviceName,
      });
      trace = this.currentTrace;
      await this.disconnectCurrentDevice();
      this.assertCurrentTrace(generation, trace);

      // 首次绑定仍使用首个候选；换网必须逐个只读核验 GATT 身份后再选择。
      let matching: BleScanResult[];
      if (selectedCandidate) {
        matching = [selectedCandidate];
      } else {
        this.update({ stage: 'scanning_ble', failure: null });
        const candidates = await this.transport.scanCandidates({ timeoutMs: this.timeouts.scanMs });
        this.assertCurrentTrace(generation, trace);
        if (candidates.length === 0) {
          throw createProvisionFailure('SCAN_TIMEOUT', 'scanning_ble', '扫描超时未发现目标设备');
        }
        const target = this.state.networkTarget;
        matching = target ? candidates.filter((item) => item.productID === target.productID) : candidates;
        if (!matching.length) throw createProvisionFailure('DEVICE_NOT_FOUND', 'scanning_ble', '未发现所选产品的换网设备');
      }

      if (this.state.mode === 'changeNetwork') {
        await this.connectNetworkCandidate(matching, generation, trace);
        await this.runNetworkChange(credential, generation, trace);
        return;
      }

      const currentDevice = matching[0];
      this.update({ stage: 'connecting_ble', currentDevice, failure: null });
      await this.transport.connect(currentDevice.deviceId, trace);
      this.assertCurrentTrace(generation, trace);
      this.bleConnected = true;

      this.update({ stage: 'sending_credentials' });
      const bindToken = await this.createBindTokenSafe();
      this.assertCurrentTrace(generation, trace);
      if (bindToken) {
        this.state = { ...this.state, bindToken, updatedAt: Date.now() };
      }
      this.unsubscribeMessage = this.transport.onMessage((message) => this.handleBleMessage(message));
      this.update({ stage: 'waiting_device_online' });
      this.protocolTimer = setTimeout(() => {
        this.setFailure(createProvisionFailure('PROTOCOL_TIMEOUT', 'waiting_device_online', '等待设备协议结果超时'));
      }, this.timeouts.protocolMs);
      await this.transport.sendProvision({
        ssid: credential.ssid,
        pwd: credential.password,
        uid: bindToken || '',
      }, trace);
      this.assertCurrentTrace(generation, trace);
    } catch (error) {
      if (error instanceof StaleProvisionSessionError || generation !== this.sessionGeneration) {
        throw error;
      }
      if (trace && this.currentTrace !== trace) {
        throw error;
      }
      if (isProvisionFailure(error)) {
        this.setFailure(error);
        throw error;
      }
      const failure = this.state.mode === 'changeNetwork'
        ? createProvisionFailure(
          /不支持|升级固件/.test((error as Error).message) ? 'NETWORK_CHANGE_UNSUPPORTED'
            : /设备不一致/.test((error as Error).message) ? 'DEVICE_IDENTITY_MISMATCH' : 'NETWORK_CHANGE_FAILED',
          this.state.stage, (error as Error).message, 'wifi_ready',
        )
        : createFailureFromProvisionError(error, this.state.stage);
      this.setFailure(failure);
      throw failure;
    } finally {
      completeStart();
      if (this.activeStartCompletion === startCompletion) {
        this.activeStartCompletion = null;
      }
    }
  }

  /** connectNetworkCandidate 只读探测同产品设备；仅明确身份不符可继续，断开失败或取消立即停止。 */
  private async connectNetworkCandidate(candidates: BleScanResult[], generation: number, trace: LLSyncTraceSession): Promise<void> {
    const target = this.state.networkTarget;
    if (!target || !this.transport.getNetworkChangeInfo || !this.transport.sendNetworkChange) {
      throw new Error('设备不支持保留绑定换网，请升级固件');
    }
    for (let index = 0; index < candidates.length; index += 1) {
      this.assertCurrentTrace(generation, trace);
      const currentDevice = candidates[index];
      this.update({ stage: 'connecting_ble', currentDevice, failure: null });
      await this.transport.connect(currentDevice.deviceId, trace);
      this.assertCurrentTrace(generation, trace);
      this.bleConnected = true;
      try {
        await this.transport.getNetworkChangeInfo(target);
        this.assertCurrentTrace(generation, trace);
        return;
      } catch (error) {
        this.assertCurrentTrace(generation, trace);
        if (!isProvisionFailure(error) || error.code !== 'DEVICE_IDENTITY_MISMATCH' || !this.transport.disconnect) throw error;
        await this.disconnectCurrentDevice();
        this.assertCurrentTrace(generation, trace);
        this.bleConnected = false;
        if (index === candidates.length - 1) throw error;
      }
    }
    throw createProvisionFailure('DEVICE_NOT_FOUND', 'connecting_ble', '未发现身份匹配的换网设备');
  }

  /** runNetworkChange 由已核对身份的 BLE 传输等待标准联网回执，不查询云端状态属性。 */
  private async runNetworkChange(credential: WifiCredential, generation: number, trace: LLSyncTraceSession): Promise<void> {
    this.assertCurrentTrace(generation, trace);
    const target = this.state.networkTarget;
    if (!target || !this.transport.getNetworkChangeInfo || !this.transport.sendNetworkChange) {
      throw new Error('设备不支持保留绑定换网，请升级固件');
    }
    const capability = await this.transport.getNetworkChangeInfo(target);
    this.assertCurrentTrace(generation, trace);
    if (capability.version !== 2 || capability.mode !== 1 || capability.error !== 0
      || (![2, 3].includes(capability.phase) && !(capability.phase === 7 && target.requestId === capability.requestId))) {
      throw new Error('设备不支持当前换网模式，请升级固件或重新开启换网');
    }
    if (!/^[0-9a-f]{16}$/.test(capability.requestId) || (target.requestId && target.requestId !== capability.requestId)) {
      throw new Error('换网请求不匹配，请重新开始');
    }
    const request = { ...target, requestId: capability.requestId };
    if (!this.networkGateway.authorize) throw new Error('网络授权服务不可用');
    const permission = await this.networkGateway.authorize(target);
    this.assertCurrentTrace(generation, trace);
    if (!permission.allowed) {
      throw new Error('仅项目管理员可以管理设备网络');
    }
    this.update({ stage: 'sending_credentials', networkTarget: request, bindToken: '' });
    this.protocolTimer = setTimeout(() => {
      this.setFailure(createProvisionFailure('PROTOCOL_TIMEOUT', 'waiting_device_online', '等待设备换网结果超时', 'wifi_ready'));
      // 断开实际 BLE 传输，使正在等待 E2 的启动链退出；不凭空释放仍运行的写入链。
      void this.releaseBleConnection();
    }, this.timeouts.protocolMs);
    try {
      await this.transport.sendNetworkChange({ ...request, ssid: credential.ssid, pwd: credential.password }, trace);
    } catch (sendError) {
      this.assertCurrentTrace(generation, trace);
      const device = this.state.currentDevice;
      if (!device?.deviceId || !this.transport.disconnect || !this.transport.readNetworkChangeResult) throw sendError;
      // 最多重连原 BLE 设备一次，只查询保存结果；失败不重新投递凭据或扫描另一设备。
      try {
        await this.disconnectCurrentDevice();
        this.assertCurrentTrace(generation, trace);
        this.bleConnected = false;
        this.update({ currentDevice: device });
        await this.transport.connect(device.deviceId, trace);
        this.assertCurrentTrace(generation, trace);
        this.bleConnected = true;
        await this.transport.readNetworkChangeResult({ ...request, ssid: credential.ssid }, trace);
      } catch {
        this.assertCurrentTrace(generation, trace);
        throw sendError;
      }
    }
    this.assertCurrentTrace(generation, trace);
    this.clearProtocolTimer();
    this.update({ stage: 'success', failure: null, boundDevice: { productID: target.productID, deviceName: target.deviceName } });
    await this.finishTrace(trace, { result: 'success', stage: 'success', summary: '设备已通过 BLE 确认新 WiFi 保存成功', productID: target.productID, deviceName: target.deviceName });
    this.assertCurrentGeneration(generation);
    await this.releaseBleConnection();
  }

  async retry(): Promise<void> {
    if (this.state.failure?.retryFrom === 'wifi_ready') {
      this.update({ stage: 'wifi_ready', failure: null });
      return;
    }
    await this.start();
  }

  cancel(reason = 'USER_CANCELLED'): void {
    this.sessionGeneration += 1;
    const deviceId = this.state.currentDevice?.deviceId || '';
    void this.finishCurrentTrace({
      result: 'failed',
      stage: this.state.stage,
      failureCode: reason,
      summary: reason === 'PAGE_UNLOADED' ? '配网页面被关闭' : '用户取消配网',
    });
    this.clearRuntime();
    this.selectedCandidate = null;
    this.bindDeviceName = '';
    this.bindingStarted = false;
    this.bleConnected = false;
    if (this.transport.stopScan) {
      this.transport.stopScan();
    }
    if (this.transport.disconnect && deviceId) {
      // 取消不等待系统关闭，但必须收敛拒绝，防止未处理 Promise；传输层保留未确认释放门禁。
      void this.releaseBleConnection();
    }
    this.update({ stage: 'idle', failure: null, currentDevice: null });
  }

  private async createBindTokenSafe(): Promise<string> {
    if (!this.bindingGateway.createBindToken) return '';
    try {
      const info = await this.bindingGateway.createBindToken();
      return info.token || '';
    } catch {
      return '';
    }
  }

  private handleBleMessage(message: BleMessage): void {
    if (this.state.mode === 'changeNetwork') return;
    if (this.state.stage === 'success' || this.state.stage === 'failed' || !this.currentTrace) {
      bleLogger.debug('provision', 'handleBleMessage:skip-closed-session', { type: message.type, stage: this.state.stage });
      return;
    }
    bleLogger.info('provision', 'handleBleMessage', { type: message.type, value: message.value });
    const deviceName = resolveBindDeviceName(message);
    if (deviceName) {
      this.bindDeviceName = deviceName;
      bleLogger.info('provision', 'handleBleMessage:bind-device-name', { deviceName });
    }
    if (message.type === TYPE_SERVER_INFO) {
      return;
    }
    if (message.type === TYPE_WIFI_CONNECT_RESULT) {
      const wifiResult = message.value as { connected?: boolean } | undefined;
      if (wifiResult?.connected) {
        this.update({ stage: 'binding_device' });
        return;
      }
      this.clearProtocolTimer();
      this.setFailure(createProvisionFailure('PROVISION_REJECTED', 'waiting_device_online', '设备联网失败'));
      return;
    }
    if (message.type === TYPE_BIND_TOKEN_WRITTEN) {
      this.clearProtocolTimer();
      this.update({ stage: 'binding_device' });
      return;
    }
    if (message.type === TYPE_PROVISION_SUCCESS) {
      this.clearProtocolTimer();
      void this.finishBinding(message);
      return;
    }
    if (message.type === TYPE_PROVISION_FAIL) {
      this.clearProtocolTimer();
      if (this.bindingStarted) {
        bleLogger.warn('provision', 'handleBleMessage:bind-fail-after-token', { type: message.type });
        this.setFailure(createProvisionFailure('BIND_FAILED', 'binding_device', '设备添加失败'));
        return;
      }
      this.setFailure(createProvisionFailure('PROVISION_REJECTED', 'waiting_device_online', '设备联网失败'));
    }
  }

  private async finishBinding(message: BleMessage): Promise<void> {
    const trace = this.currentTrace;
    if (this.state.stage === 'failed' || !trace) {
      bleLogger.warn('provision', 'finishBinding:skip-closed-session', { type: message.type, stage: this.state.stage });
      return;
    }
    if (this.bindingStarted) {
      bleLogger.info('provision', 'finishBinding:skip-duplicate', { type: message.type });
      return;
    }
    this.bindingStarted = true;
    this.update({ stage: 'binding_device' });
    const token = this.state.bindToken;
    // 1) 从协议成功包取; 2) 从扫描广播缓存取; 3) Android deviceId 是 MAC 时兜底用它。
    const productID = resolveBindProductID(message) || this.selectedCandidate?.productID || this.state.currentDevice?.productID || '';
    const deviceName = resolveBindDeviceName(message) || this.bindDeviceName || this.state.currentDevice?.deviceName || this.macFromCurrentDevice();
    if (this.bindingGateway.bind) {
      if (!productID || !deviceName) {
        bleLogger.error('provision', 'finishBinding:missing-device-identity', { message, currentDevice: this.state.currentDevice });
        this.setFailure(createProvisionFailure('BIND_FAILED', 'binding_device', '未获取到设备 ProductID 或 DeviceName，无法调用绑定接口'));
        return;
      }

      try {
        bleLogger.info('provision', 'finishBinding:bind-start', {
          productID,
          deviceName,
          hasToken: !!token,
        });
        await this.bindAfterDeviceOnline(productID, deviceName, token, trace);
        if (this.currentTrace !== trace) return;
        bleLogger.info('provision', 'finishBinding:bind-success', {
          productID,
          deviceName,
        });
        this.update({
          stage: 'success',
          failure: null,
          boundDevice: {
            productID,
            deviceName,
          },
        });
        await this.finishTrace(trace, {
          result: 'success',
          stage: 'success',
          productID,
          deviceName,
          summary: '设备联网并完成平台绑定',
        });
        await this.releaseBleConnection();
        return;
      } catch (error) {
        if (this.currentTrace !== trace) return;
        if (isProvisionFailure(error)) {
          this.setFailure(error);
          return;
        }
        bleLogger.error('provision', 'finishBinding:bind-fail', {
          productID,
          deviceName,
          err: (error as Error).message || 'unknown',
        });
        this.setFailure(createProvisionFailure('BIND_FAILED', 'binding_device', (error as Error).message || '绑定接口调用失败'));
        return;
      }
    }
    if (isLocalMockDevice(this.state.currentDevice) || isDevelopEnv()) {
      bleLogger.info('provision', 'finishBinding:local-success', { device: this.state.currentDevice });
      this.update({ stage: 'success', failure: null });
      await this.finishTrace(trace, { result: 'success', stage: 'success', summary: '本地调试设备配网完成' });
      await this.releaseBleConnection();
      return;
    }
    this.update({ stage: 'success', failure: null });
    await this.finishTrace(trace, { result: 'success', stage: 'success', summary: '设备配网完成' });
    await this.releaseBleConnection();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** bindAfterDeviceOnline 仅为 BLE 完成后的明确离线码等待上线，不重配网、不换 Token、不绕过服务端校验。 */
  private async bindAfterDeviceOnline(productID: string, deviceName: string, token: string, trace: LLSyncTraceSession): Promise<void> {
    const generation = this.sessionGeneration;
    const deadline = Date.now() + this.timeouts.bindingMs;
    for (;;) {
      this.assertCurrentTrace(generation, trace);
      try {
        await this.bindWithLevelHandling(productID, deviceName, token);
        return;
      } catch (error) {
        this.assertCurrentTrace(generation, trace);
        // 只重试服务端明确拒绝且尚未绑定的离线码；网络超时等结果不明的请求不能盲目重发。
        if (!isApiError(error) || error.code !== 2000003) throw error;
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          throw createProvisionFailure('BIND_TIMEOUT', 'binding_device', '配网完成后设备未在限定时间内恢复平台在线', 'wifi_ready');
        }
        bleLogger.info('provision', 'bind:waiting-device-online', { remainingMs: remaining });
        await this.delay(Math.min(Math.max(1, this.timeouts.bindPollIntervalMs), remaining));
        this.assertCurrentTrace(generation, trace);
        if (Date.now() >= deadline) {
          throw createProvisionFailure('BIND_TIMEOUT', 'binding_device', '等待设备恢复平台在线超时', 'wifi_ready');
        }
      }
    }
  }

  /** bindWithLevelHandling 沿用原有等级策略：2000007 时弱绑定先解绑后绑定，强/中绑定提示占用。
   * 中绑定携有效 Token 能否换绑由平台裁决，不在客户端伪造授权；离线由 BLE 入口有界等待。
   */
  private async bindWithLevelHandling(productID: string, deviceName: string, token: string): Promise<void> {
    try {
      await this.bindingGateway.bind!(productID, deviceName, token || undefined);
      return;
    } catch (error) {
      if (!isApiError(error) || error.code !== BIND_OWNED_BY_OTHER_CODE) {
        throw error;
      }

      const level = await this.resolveBindLevel(productID);
      bleLogger.info('provision', 'bind:owned-by-other', { productID, deviceName, bindLevel: level });

      if (level === 3 && this.bindingGateway.unbind) {
        bleLogger.info('provision', 'bind:weak-rebind-start', { productID, deviceName });
        await this.bindingGateway.unbind(productID, deviceName);
        await this.delay(REBIND_AFTER_UNBIND_DELAY_MS);
        await this.bindingGateway.bind!(productID, deviceName, token || undefined);
        bleLogger.info('provision', 'bind:weak-rebind-success', { productID, deviceName });
        return;
      }

      throw createProvisionFailure(
        'BIND_OWNED_BY_OTHER',
        'binding_device',
        `设备已被他人绑定 (productID=${productID}, bindLevel=${level})`,
      );
    }
  }

  private async resolveBindLevel(productID: string): Promise<number> {
    if (!this.bindingGateway.getProductBindLevel) return 1;
    try {
      const level = await this.bindingGateway.getProductBindLevel(productID);
      return Number(level) || 1;
    } catch {
      return 1;
    }
  }

  /** Android 上 deviceId 就是 MAC 地址（格式 AA:BB:CC:DD:EE:FF），可用作设备名。iOS 的是 UUID，不能用。 */
  private macFromCurrentDevice(): string {
    const id = this.state.currentDevice?.deviceId || '';
    return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(id) ? id : '';
  }

  private fail(code: ProvisionFailure['code'], stage: ProvisionStage, developerMessage: string): ProvisionFailure {
    const failure = createProvisionFailure(code, stage, developerMessage);
    this.setFailure(failure);
    return failure;
  }

  private setFailure(failure: ProvisionFailure): void {
    // 诊断完成后释放本次连接；捕获设备 ID，防止迟到清理关闭下一轮连接。
    const deviceId = this.state.currentDevice?.deviceId || '';
    this.clearProtocolTimer();
    this.update({ stage: 'failed', failure });
    const finalization = this.finishCurrentTrace({
      result: 'failed',
      stage: 'failed',
      failureCode: failure.code,
      summary: failure.developerMessage,
      productID: this.state.currentDevice?.productID,
      deviceName: this.bindDeviceName || this.state.currentDevice?.deviceName,
    }, this.bleConnected);
    this.traceFinalization = finalization.then(async () => {
      if (!deviceId || !this.transport.disconnect) return;
      try {
        await this.transport.disconnect(deviceId);
      } catch {
        bleLogger.warn('provision', 'disconnect-after-failure:fail', { deviceId });
      }
    });
  }

  private async captureDeviceLog(trace: LLSyncTraceSession): Promise<void> {
    if (!this.transport.getModuleLog) return;
    try {
      const logStr = await this.transport.getModuleLog(trace);
      if (logStr) bleLogger.warn('provision', 'device-log', { logStr });
    } catch (error) {
      bleLogger.warn('provision', 'device-log:fail', { err: (error as Error).message || 'unknown' });
    }
  }

  private update(partial: Partial<ProvisionSessionState>): void {
    if (partial.stage && partial.stage !== this.state.stage) {
      this.currentTrace?.recordStage(partial.stage);
    }
    this.state = { ...this.state, ...partial, updatedAt: Date.now() };
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private clearProtocolTimer(): void {
    if (this.protocolTimer) {
      clearTimeout(this.protocolTimer);
      this.protocolTimer = null;
    }
  }

  private clearRuntime(): void {
    this.clearProtocolTimer();
    if (this.unsubscribeMessage) {
      this.unsubscribeMessage();
      this.unsubscribeMessage = null;
    }
  }

  /** finishCurrentTrace 锁定首个终态，并在需要时先使用同一 trace 拉取 E5 设备日志。 */
  private finishCurrentTrace(result: LLSyncTraceResult, captureDeviceLog = false): Promise<void> {
    const trace = this.currentTrace;
    if (!trace) return this.traceFinalization;
    return this.finishTrace(trace, result, captureDeviceLog);
  }

  /** finishTrace 只允许调用方关闭自己持有的会话，禁止旧异步结果关闭新会话。 */
  private finishTrace(trace: LLSyncTraceSession, result: LLSyncTraceResult, captureDeviceLog = false): Promise<void> {
    if (this.currentTrace !== trace) return this.traceFinalization;
    this.clearRuntime();
    this.currentTrace = null;
    const finalization = trace.finish(result, captureDeviceLog
      ? { beforeClose: () => this.captureDeviceLog(trace) }
      : undefined);
    this.traceFinalization = finalization.catch((error) => {
      bleLogger.warn('provision', 'trace-finish:fail', { err: (error as Error).message || 'unknown' });
    });
    return this.traceFinalization;
  }

  /** releaseBleConnection 在成功终态后释放旧 notify 和连接，不允许下一轮复用旧闭包。 */
  private async releaseBleConnection(): Promise<void> {
    const deviceId = this.state.currentDevice?.deviceId || '';
    this.bleConnected = false;
    if (!this.transport.disconnect || !deviceId) return;
    try {
      await this.transport.disconnect(deviceId);
    } catch (error) {
      bleLogger.warn('provision', 'disconnect-after-success:fail', { err: (error as Error).message || 'unknown' });
    }
  }

  /** assertCurrentGeneration 阻止取消或重复启动前的异步流程继续写状态。 */
  private assertCurrentGeneration(generation: number): void {
    if (generation !== this.sessionGeneration) throw new StaleProvisionSessionError();
  }

  /** assertCurrentTrace 同时校验会话代次和显式 trace 身份。 */
  private assertCurrentTrace(generation: number, trace: LLSyncTraceSession): void {
    this.assertCurrentGeneration(generation);
    if (this.currentTrace !== trace) throw new StaleProvisionSessionError();
  }

  private async disconnectCurrentDevice(): Promise<void> {
    const deviceId = this.state.currentDevice?.deviceId || '';
    if (!deviceId || !this.transport.disconnect) return;
    try {
      await this.transport.disconnect(deviceId);
    } catch (error) {
      throw createProvisionFailure('BLE_CONNECT_FAILED', 'connecting_ble', `断开旧蓝牙连接失败: ${(error as Error).message || 'unknown'}`);
    }
    this.state = { ...this.state, currentDevice: null, updatedAt: Date.now() };
  }

  /** 获取已格式化的 BLE 调试日志历史（供配网进度页调试展示）。 */
  getDebugLogHistory(limit = 80): string[] {
    return getBleLogHistory().map(formatBleLogEntry).slice(-limit);
  }

  /** 订阅 BLE 调试日志，回调返回已格式化的字符串。 */
  subscribeDebugLogs(listener: (line: string) => void): () => void {
    return subscribeBleLogs((entry) => listener(formatBleLogEntry(entry)));
  }
}

export const provisionSessionService = new ProvisionSessionService();
