export const WIFI_CREDENTIAL_SOURCES = ['android-list', 'system-return', 'manual'] as const;
export type WifiCredentialSource = typeof WIFI_CREDENTIAL_SOURCES[number];

export interface WifiCredential {
  ssid: string;
  password: string;
  source: WifiCredentialSource;
}

export interface WifiOption {
  ssid: string;
  bssid?: string;
  rssi?: number;
  secure?: boolean;
  /** 频率，MHz；2.4G 在 2400 段，5G 在 5000 段；微信 WifiInfo 提供 */
  frequency?: number;
}

export const WIFI_PREPARE_MODES = ['android-list', 'system-return', 'manual'] as const;
export type WifiPrepareMode = typeof WIFI_PREPARE_MODES[number];

export interface WifiPrepareResult {
  mode: WifiPrepareMode;
  currentSsid: string;
  /** 当前连接 WiFi 的频率（MHz）；获取不到为 0 */
  currentSsidFrequency: number;
  wifiList: WifiOption[];
  needsGuide: boolean;
  /** WiFi 准备失败原因，用于页面展示针对性的引导文案。 */
  failureCode?: 'WIFI_LIST_UNAVAILABLE' | 'WIFI_NOT_CONNECTED';
}

/**
 * 判断 WiFi 频率是否为 5G 频段。
 * - 2.4GHz: 2400~2500 MHz
 * - 5GHz:   4900~5900 MHz
 * 频率为 0 / undefined 时返回 false（无法判断按 2.4G 处理，避免误拦截）。
 */
export function isWifi5G(frequencyMHz?: number): boolean {
  if (!frequencyMHz || frequencyMHz <= 0) return false;
  return frequencyMHz >= 4900 && frequencyMHz <= 5900;
}
