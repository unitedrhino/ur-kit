/** 配网页面状态映射：换网保留绑定，由设备 BLE 回执确认，不显示平台验证。 */
import { provisionSessionService, type ProvisionSessionService } from '../services/provision-session.service';
import { wifiCredentialService, type WifiCredentialService } from '../services/wifi-credential.service';
import { deviceListProvider } from './device-list.provider';
import type { BleScanResult } from '../domain/models/ble-scan-result.model';
import type { ProvisionFailure } from '../domain/models/provision-failure.model';
import type { ProvisionSessionState, ProvisionStage } from '../domain/models/provision-session-state.model';
import type { WifiCredential, WifiOption, WifiPrepareMode, WifiPrepareResult } from '../domain/models/wifi-credential.model';

export type ProgressStatus = 'pending' | 'active' | 'done' | 'failed';

export interface ProvisionProgressItem {
  stage: ProvisionStage;
  title: string;
  desc: string;
  status: ProgressStatus;
}

export interface ProvisionProviderState {
  /** 页面据此切换换网标题、流程及结果说明。 */
  mode: 'bind' | 'changeNetwork';
  /** 失败重试返回原设备设置，不把过期事务当成新的首次绑定。 */
  networkTarget?: ProvisionSessionState['networkTarget'];
  stage: ProvisionStage;
  stepIndex: number;
  progressItems: ProvisionProgressItem[];
  wifiMode: WifiPrepareMode;
  wifiList: WifiOption[];
  currentSsid: string;
  /** 当前连接 WiFi 频率（MHz）；用于 5G 频段检测；获取不到为 0 */
  currentSsidFrequency: number;
  needsGuide: boolean;
  /** WiFi 准备失败原因，用于页面给出明确引导。 */
  wifiFailureCode: WifiPrepareResult['failureCode'];
  result: {
    success: boolean;
    title: string;
    message: string;
    failure: ProvisionFailure | null;
    locationWarning: string;
    boundDevice?: {
      productID: string;
      deviceName: string;
    };
  };
}

interface DeviceListRefreshProvider {
  loadFirst(): Promise<void>;
}

const PROGRESS_STAGES: Array<Pick<ProvisionProgressItem, 'stage' | 'title' | 'desc'>> = [
  { stage: 'scanning_ble', title: '发现设备', desc: '正在查找附近可添加的设备' },
  { stage: 'connecting_ble', title: '连接设备', desc: '正在与设备建立连接' },
  { stage: 'sending_credentials', title: '发送网络信息', desc: '正在发送 WiFi 名称和密码' },
  { stage: 'waiting_device_online', title: '等待设备联网', desc: '正在等待设备连接家庭网络' },
  { stage: 'binding_device', title: '等待上线并完成添加', desc: '网络已配置，正在等待设备重新上线并添加到当前账号' },
];

const STAGE_ORDER: ProvisionStage[] = [
  'idle',
  'preparing',
  'wifi_ready',
  'scanning_ble',
  'connecting_ble',
  'sending_credentials',
  'waiting_device_online',
  'binding_device',
  'success',
  'failed',
];

function stepIndexOf(stage: ProvisionStage): number {
  if (stage === 'idle' || stage === 'preparing') return 0;
  if (stage === 'wifi_ready') return 1;
  return 2;
}

function progressStatus(itemStage: ProvisionStage, session: ProvisionSessionState): ProgressStatus {
  if (session.stage === 'failed') {
    if (session.failure?.stage === itemStage) return 'failed';
    return STAGE_ORDER.indexOf(itemStage) < STAGE_ORDER.indexOf(session.failure?.stage || 'idle') ? 'done' : 'pending';
  }
  if (session.stage === 'success') return 'done';
  const current = STAGE_ORDER.indexOf(session.stage);
  const target = STAGE_ORDER.indexOf(itemStage);
  if (target < current) return 'done';
  if (target === current) return 'active';
  return 'pending';
}

function mapState(session: ProvisionSessionState, wifi: Pick<ProvisionProviderState, 'wifiMode' | 'wifiList' | 'currentSsid' | 'currentSsidFrequency' | 'needsGuide' | 'wifiFailureCode'>): ProvisionProviderState {
  const changingNetwork = session.mode === 'changeNetwork';
  const progress = changingNetwork ? PROGRESS_STAGES.filter((item) => item.stage !== 'binding_device').map((item) => ({
    ...item,
    desc: item.stage === 'scanning_ble' ? '正在查找已开启换网的目标设备'
      : item.stage === 'waiting_device_online' ? '正在等待设备连接并保存新网络' : item.desc,
  })) : PROGRESS_STAGES;
  const failure = session.failure;
  const success = session.stage === 'success';
  const wifiState = {
    wifiMode: wifi.wifiMode,
    wifiList: wifi.wifiList,
    currentSsid: wifi.currentSsid,
    currentSsidFrequency: wifi.currentSsidFrequency,
    needsGuide: wifi.needsGuide,
    wifiFailureCode: wifi.wifiFailureCode,
  };
  return {
    mode: changingNetwork ? 'changeNetwork' : 'bind',
    networkTarget: session.networkTarget,
    stage: session.stage,
    stepIndex: stepIndexOf(session.stage),
    progressItems: progress.map((item) => ({ ...item, status: progressStatus(item.stage, session) })),
    ...wifiState,
      result: {
        success,
      title: changingNetwork ? (success ? 'Wi-Fi 已更新' : failure ? '暂时没连上' : '正在连接新 Wi-Fi')
        : success ? '添加成功' : failure ? '添加失败' : '正在添加设备',
      message: success ? (changingNetwork ? '新网络已连接并保存，原网络和设备绑定保持不变。设备正在恢复在线，无需再次添加。' : '设备已连接到家庭网络，并添加到当前账号')
        : failure?.userMessage || (changingNetwork ? '请在设备上确认换网，并保持手机靠近' : '请保持设备和手机靠近'),
      failure,
      locationWarning: session.locationWarning || '',
      boundDevice: session.boundDevice,
    },
  };
}

export class ProvisionProvider {
  private state: ProvisionProviderState;
  private listeners: Set<(state: ProvisionProviderState) => void> = new Set();

  constructor(
    private readonly session: ProvisionSessionService = provisionSessionService,
    private readonly wifiService: WifiCredentialService = wifiCredentialService,
    private readonly deviceList: DeviceListRefreshProvider = deviceListProvider,
  ) {
    this.state = mapState(this.session.getState(), {
      wifiMode: 'manual',
      wifiList: [],
      currentSsid: '',
      currentSsidFrequency: 0,
      needsGuide: false,
      wifiFailureCode: undefined,
    });
    this.session.subscribe((sessionState) => {
      this.state = mapState(sessionState, this.state);
      this.notify();
      if (sessionState.stage === 'success') {
        void this.handleBindSuccess();
      }
    });
  }

  getState(): ProvisionProviderState {
    return this.state;
  }

  subscribe(listener: (state: ProvisionProviderState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /** 获取已格式化的 BLE 调试日志历史（委托 Service）。 */
  getDebugLogHistory(limit?: number): string[] {
    return this.session.getDebugLogHistory(limit);
  }

  /** 订阅 BLE 调试日志，回调返回已格式化字符串（委托 Service）。 */
  subscribeDebugLogs(listener: (line: string) => void): () => void {
    return this.session.subscribeDebugLogs(listener);
  }

  startSession(): void {
    this.session.reset();
    this.state = mapState(this.session.getState(), this.state);
    this.notify();
  }

  /** startNetworkChange 在线、离线设备都校验管理员权限，不通过物模型唤起。 */
  async startNetworkChange(target: { productID: string; deviceName: string }, _online?: boolean): Promise<void> {
    await this.session.requestNetworkChange(target);
  }

  confirmPrepared(): void {
    this.session.confirmPrepared();
  }

  selectScannedDevice(device: BleScanResult): void {
    this.session.selectCandidate(device);
  }

  async prepareWifi(): Promise<void> {
    const result = await this.wifiService.prepare();
    this.state = {
      ...this.state,
      wifiMode: result.mode,
      wifiList: result.wifiList,
      currentSsid: result.currentSsid,
      currentSsidFrequency: result.currentSsidFrequency,
      needsGuide: result.needsGuide,
      wifiFailureCode: result.failureCode,
    };
    this.notify();
  }

  async submitWifi(credential: WifiCredential): Promise<void> {
    this.session.acceptWifi(credential);
    void this.session.start().catch(() => undefined);
  }

  async retry(): Promise<void> {
    await this.session.retry();
  }

  /** cancel 结束当前配网，并把页面退出原因写入最终追踪结果。 */
  cancel(reason = 'USER_CANCELLED'): void {
    this.session.cancel(reason);
  }

  async handleBindSuccess(): Promise<void> {
    await this.deviceList.loadFirst();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const provisionProvider = new ProvisionProvider();
