/** 配网会话状态：首次绑定与保留绑定换网共享阶段，但不共享绑定动作。 */
import type { BleScanResult } from './ble-scan-result.model';
import type { ProvisionFailure } from './provision-failure.model';
import type { WifiCredential } from './wifi-credential.model';

export { PROVISION_FAILURE_CODES } from './provision-failure.model';

export const PROVISION_STAGES = [
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
] as const;

export type ProvisionStage = typeof PROVISION_STAGES[number];

export interface ProvisionSessionState {
  /** bind 保留原首次添加流程；changeNetwork 禁止创建 Token 或修改绑定。 */
  mode: 'bind' | 'changeNetwork';
  /** 换网目标及当前事务标识；离线入口在验证 BLE 身份后采用设备请求标识。 */
  networkTarget?: { productID: string; deviceName: string; requestId?: string };
  stage: ProvisionStage;
  credential: WifiCredential | null;
  currentDevice: BleScanResult | null;
  boundDevice?: {
    productID: string;
    deviceName: string;
  };
  failure: ProvisionFailure | null;
  bindToken: string;
  locationWarning?: string;
  updatedAt: number;
}

export function createInitialProvisionSessionState(): ProvisionSessionState {
  return {
    mode: 'bind',
    stage: 'idle',
    credential: null,
    currentDevice: null,
    boundDevice: undefined,
    failure: null,
    bindToken: '',
    locationWarning: '',
    updatedAt: Date.now(),
  };
}
