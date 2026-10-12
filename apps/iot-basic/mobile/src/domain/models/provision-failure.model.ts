/** 配网失败分类：换网错误不得提示解绑重试。 */
import type { ProvisionStage } from './provision-session-state.model';

export const PROVISION_FAILURE_CODES = [
  'BLE_ADAPTER_NOT_READY',
  'SCAN_TIMEOUT',
  'DEVICE_NOT_FOUND',
  'BLE_CONNECT_FAILED',
  'SERVICE_NOT_FOUND',
  'CHARACTERISTIC_NOT_FOUND',
  'WIFI_LIST_UNAVAILABLE',
  'PROVISION_REJECTED',
  'PROTOCOL_TIMEOUT',
  'BIND_FAILED',
  'BIND_TIMEOUT',
  'BIND_OWNED_BY_OTHER',
  'UNKNOWN',
  'NETWORK_CHANGE_FAILED',
  'NETWORK_CHANGE_UNSUPPORTED',
  'DEVICE_IDENTITY_MISMATCH',
] as const;

export type ProvisionFailureCode = typeof PROVISION_FAILURE_CODES[number];

export interface ProvisionFailure {
  code: ProvisionFailureCode;
  stage: ProvisionStage;
  userMessage: string;
  developerMessage: string;
  retryFrom: ProvisionStage;
}

const USER_MESSAGES: Record<ProvisionFailureCode, string> = {
  NETWORK_CHANGE_FAILED: '换网未完成，原绑定保留。请确认设备已开启换网，并检查网络后重试。',
  NETWORK_CHANGE_UNSUPPORTED: '未检测到换网能力。请在设备菜单开启更换 Wi-Fi；旧版固件请先升级，不需要解绑。',
  DEVICE_IDENTITY_MISMATCH: '附近蓝牙设备与所选设备不一致，未发送网络信息，请选择正确设备。',
  BLE_ADAPTER_NOT_READY: '蓝牙不可用，请检查手机蓝牙开关和微信蓝牙权限。',
  SCAN_TIMEOUT: '未发现可配网设备，请确认设备已进入配网模式。',
  DEVICE_NOT_FOUND: '未发现目标设备，请靠近设备后重试。',
  BLE_CONNECT_FAILED: '手机与设备连接失败，请重试。',
  SERVICE_NOT_FOUND: '当前蓝牙设备不支持一键配网。',
  CHARACTERISTIC_NOT_FOUND: '设备暂时无法连接，请重试。',
  WIFI_LIST_UNAVAILABLE: '未能获取 WiFi 列表，请手动输入 WiFi 名称。',
  PROVISION_REJECTED: '设备联网失败，请检查 WiFi 密码。',
  PROTOCOL_TIMEOUT: '等待设备联网超时，请确认设备和网络状态。',
  BIND_FAILED: '设备已联网，但添加到账号失败，请稍后重试。',
  BIND_TIMEOUT: '设备已联网，但添加确认超时。',
  BIND_OWNED_BY_OTHER: '设备已被其他账号绑定，请先在原账号上解绑后再试。',
  UNKNOWN: '添加失败，请稍后重试。',
};

export function createProvisionFailure(
  code: ProvisionFailureCode,
  stage: ProvisionStage,
  developerMessage = '',
  retryFrom: ProvisionStage = stage,
): ProvisionFailure {
  return {
    code,
    stage,
    userMessage: USER_MESSAGES[code],
    developerMessage: developerMessage || USER_MESSAGES[code],
    retryFrom,
  };
}

export function isProvisionFailure(value: unknown): value is ProvisionFailure {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<ProvisionFailure>;
  return typeof payload.code === 'string' && PROVISION_FAILURE_CODES.includes(payload.code as ProvisionFailureCode);
}
