import { getSystemInfo } from '../utils/platform';
import type { WifiOption, WifiPrepareResult } from '../domain/models/wifi-credential.model';

type WxWifiInfo = WechatMiniprogram.WifiInfo;

type WxWifiApi = Pick<typeof wx, 'startWifi' | 'getConnectedWifi' | 'getWifiList' | 'onGetWifiList' | 'getSetting' | 'authorize' | 'getNetworkType'>;
type WifiListResult = { wifiList?: WxWifiInfo[] };
type NetworkTypeResult = { networkType?: string };

const WIFI_LIST_TIMEOUT_MS = 4000;

interface WifiCredentialServiceOptions {
  wxApi?: WxWifiApi;
  getSystemInfo?: typeof getSystemInfo;
}

function normalizeWifi(info: WxWifiInfo): WifiOption {
  return {
    ssid: info.SSID || '',
    bssid: info.BSSID,
    rssi: info.signalStrength,
    secure: info.secure,
    // 微信基础库 ≥ 2.20.1 在 Android 提供 frequency；iOS / 鸿蒙通常无此字段
    frequency: typeof info.frequency === 'number' ? info.frequency : undefined,
  };
}

function isAndroid(platform: string): boolean {
  return platform.toLowerCase().includes('android');
}

function isSystemReturnPlatform(platform: string, isIOS: boolean): boolean {
  const value = platform.toLowerCase();
  return isIOS || value.includes('ios') || value.includes('harmony') || value.includes('ohos') || value.includes('devtools');
}

/** isKnownNonWifiNetwork 判断微信网络类型是否明确不是 WiFi。 */
function isKnownNonWifiNetwork(networkType: string): boolean {
  return ['2g', '3g', '4g', '5g', 'wwan', 'none'].includes(networkType);
}

function getDefaultWxApi(): WxWifiApi {
  if (typeof uni !== 'undefined') {
    return uni as unknown as WxWifiApi;
  }
  if (typeof wx !== 'undefined') {
    return wx as WxWifiApi;
  }
  return {
    startWifi: (options?: { fail?: (error: { errMsg: string; errCode: number }) => void }) => options?.fail?.({ errMsg: 'wifi api unavailable', errCode: 12000 }),
    getConnectedWifi: (options?: { fail?: (error: { errMsg: string; errCode: number }) => void }) => options?.fail?.({ errMsg: 'wifi api unavailable', errCode: 12000 }),
    getWifiList: (options?: { fail?: (error: { errMsg: string; errCode: number }) => void }) => options?.fail?.({ errMsg: 'wifi api unavailable', errCode: 12000 }),
    onGetWifiList: () => undefined,
    getSetting: (options?: { success?: (res: { authSetting: { 'scope.userLocation'?: boolean } }) => void }) => options?.success?.({ authSetting: {} }),
    authorize: (options?: { fail?: (error: { errMsg: string }) => void }) => options?.fail?.({ errMsg: 'wifi api unavailable' }),
    getNetworkType: (options?: { success?: (res: NetworkTypeResult) => void }) => options?.success?.({ networkType: 'unknown' }),
  } as unknown as WxWifiApi;
}

export class WifiCredentialService {
  private readonly wxApi: WxWifiApi;
  private readonly getInfo: typeof getSystemInfo;

  constructor(options: WifiCredentialServiceOptions = {}) {
    this.wxApi = options.wxApi ?? getDefaultWxApi();
    this.getInfo = options.getSystemInfo ?? getSystemInfo;
  }

  async prepare(): Promise<WifiPrepareResult> {
    const info = this.getInfo();
    if (isAndroid(info.platform)) {
      return this.prepareAndroid();
    }
    if (isSystemReturnPlatform(info.platform, info.isIOS)) {
      return this.prepareSystemReturn();
    }
    return {
      mode: 'manual',
      currentSsid: '',
      currentSsidFrequency: 0,
      wifiList: [],
      needsGuide: false,
    };
  }

  private async prepareAndroid(): Promise<WifiPrepareResult> {
    try {
      await this.startWifi();
      const [current, wifiList] = await Promise.all([
        this.getCurrentWifi(),
        this.getWifiList(),
      ]);
      return {
        mode: 'android-list',
        currentSsid: current.ssid,
        currentSsidFrequency: current.frequency,
        wifiList,
        needsGuide: false,
      };
    } catch {
      return {
        mode: 'manual',
        currentSsid: '',
        currentSsidFrequency: 0,
        wifiList: [],
        needsGuide: false,
        failureCode: 'WIFI_LIST_UNAVAILABLE',
      };
    }
  }

  private async prepareSystemReturn(): Promise<WifiPrepareResult> {
    try {
      await this.startWifi();
      const networkType = await this.getNetworkType();
      if (isKnownNonWifiNetwork(networkType)) {
        return {
          mode: 'system-return',
          currentSsid: '',
          currentSsidFrequency: 0,
          wifiList: [],
          needsGuide: true,
          failureCode: 'WIFI_NOT_CONNECTED',
        };
      }
      await this.ensureLocationPermission();
      const partial = await this.getCurrentWifi(true);
      const current = partial.ssid ? partial : await this.getCurrentWifi(false);
      return {
        mode: 'system-return',
        currentSsid: current.ssid,
        currentSsidFrequency: current.frequency,
        wifiList: [],
        needsGuide: current.ssid.length === 0,
      };
    } catch {
      return {
        mode: 'system-return',
        currentSsid: '',
        currentSsidFrequency: 0,
        wifiList: [],
        needsGuide: true,
      };
    }
  }

  private ensureLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      this.wxApi.getSetting({
        success: (res) => {
          if (res.authSetting['scope.userLocation'] === true) {
            resolve(true);
            return;
          }
          this.wxApi.authorize({
            scope: 'scope.userLocation',
            success: () => resolve(true),
            fail: () => resolve(false),
          });
        },
        fail: () => {
          this.wxApi.authorize({
            scope: 'scope.userLocation',
            success: () => resolve(true),
            fail: () => resolve(false),
          });
        },
      });
    });
  }

  private startWifi(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wxApi.startWifi({
        success: () => resolve(),
        fail: (error) => reject(new Error(error.errMsg || 'startWifi failed')),
      });
    });
  }

  /** getNetworkType 读取当前手机网络类型，读取失败时不阻断后续 WiFi 探测。 */
  private getNetworkType(): Promise<string> {
    return new Promise((resolve) => {
      this.wxApi.getNetworkType({
        success: (res) => resolve((res.networkType || '').toLowerCase()),
        fail: () => resolve(''),
      });
    });
  }

  private getCurrentWifi(partialInfo = false): Promise<{ ssid: string; frequency: number }> {
    return new Promise((resolve) => {
      this.wxApi.getConnectedWifi({
        partialInfo,
        success: (res) => {
          const wifi = res.wifi;
          resolve({
            ssid: wifi?.SSID || '',
            frequency: typeof wifi?.frequency === 'number' ? wifi.frequency : 0,
          });
        },
        fail: () => resolve({ ssid: '', frequency: 0 }),
      });
    });
  }

  private getWifiList(): Promise<WifiOption[]> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve([]);
      }, WIFI_LIST_TIMEOUT_MS);
      const finish = (res: WifiListResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve((res.wifiList || []).map(normalizeWifi).filter((item) => !!item.ssid));
      };
      this.wxApi.onGetWifiList(finish);
      this.wxApi.getWifiList({
        success: () => undefined,
        fail: (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(new Error(error.errMsg || 'getWifiList failed'));
        },
      });
    });
  }
}

export const wifiCredentialService = new WifiCredentialService();
