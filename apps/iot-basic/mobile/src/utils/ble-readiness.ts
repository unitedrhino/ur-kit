/**
 * 蓝牙就绪检查 + 兜底引导。
 *
 * 微信小程序 BLE 真机在以下任一前置条件不满足时, `uni.openBluetoothAdapter`
 * 会以 `errCode: 10001` (errMsg: "open fail") 失败:
 *   1. 系统蓝牙开关未打开
 *   2. iOS / Android 12+ 中, 用户拒绝了"微信使用蓝牙"的系统授权
 *   3. 用户拒绝了小程序的 `scope.bluetooth` (旧机型)
 *   4. Android 微信未开启定位 / 精确位置, 扫描可能返回空列表
 *   5. 适配器被其他 App 独占
 *
 * 调用方应使用 `ensureBluetoothReady()` 替代裸 `uni.openBluetoothAdapter`,
 * 失败后调用 `showBluetoothNotReadyGuide()` 引导用户解决。
 */
import { bleLogger } from './ble-logger';
import { bleDataSource } from '../data/datasources/bluetooth.datasource';
import { privacyConsentService } from '../services/privacy-consent.service';

export type BleReadinessReason =
  | 'system_off'
  | 'app_unauthorized'
  | 'location_off'
  | 'location_unauthorized'
  | 'location_not_determined'
  | 'location_reduced_accuracy'
  | 'privacy_not_declared'
  | 'scope_not_determined'
  | 'scope_denied'
  | 'adapter_busy'
  | 'unknown';

export interface BleReadinessResult {
  ok: boolean;
  reason?: BleReadinessReason;
  errMsg?: string;
  errCode?: number;
  errno?: number;
}

interface SystemSettingResult {
  bluetoothEnabled?: boolean;
  locationEnabled?: boolean;
}

interface AppAuthorizeSettingResult {
  bluetoothAuthorized?: 'authorized' | 'denied' | 'not determined' | 'non determined' | 'config error';
  locationAuthorized?: 'authorized' | 'denied' | 'not determined' | 'non determined' | 'config error';
  locationReducedAccuracy?: boolean;
}

interface OpenAdapterFail {
  errMsg?: string;
  errCode?: number;
  errno?: number;
}

interface MiniProgramSettingResult {
  authSetting?: Record<string, boolean | undefined>;
}

interface BleReadinessOptions {
  /** interactive=true 表示由用户点击触发，可主动拉起微信授权弹窗。 */
  interactive?: boolean;
}

interface RuntimeSystemInfo {
  platform?: string;
  system?: string;
}

const BLUETOOTH_AUTHORIZE_SCOPE = 'scope.bluetooth';
const LOCATION_AUTHORIZE_SCOPE = 'scope.userLocation';
const OPEN_ADAPTER_RETRY_DELAY_MS = 300;

let pendingBluetoothReady: Promise<BleReadinessResult> | null = null;
let pendingInteractiveBluetoothReady: Promise<BleReadinessResult> | null = null;

function getRuntimeApi(): Record<string, unknown> {
  if (typeof uni !== 'undefined') return uni as unknown as Record<string, unknown>;
  if (typeof wx !== 'undefined') return wx as unknown as Record<string, unknown>;
  return {};
}

function safeGetSystemSetting(): SystemSettingResult {
  const runtimeApi = getRuntimeApi();
  const api = runtimeApi.getSystemSetting as (() => SystemSettingResult) | undefined;
  if (typeof api !== 'function') return {};
  try {
    return api.call(runtimeApi) || {};
  } catch (err) {
    bleLogger.warn('readiness', 'getSystemSetting:exception', err);
    return {};
  }
}

function safeGetAppAuthorizeSetting(): AppAuthorizeSettingResult {
  const runtimeApi = getRuntimeApi();
  const api = runtimeApi.getAppAuthorizeSetting as (() => AppAuthorizeSettingResult) | undefined;
  if (typeof api !== 'function') return {};
  try {
    return api.call(runtimeApi) || {};
  } catch (err) {
    bleLogger.warn('readiness', 'getAppAuthorizeSetting:exception', err);
    return {};
  }
}

/** isAndroidRuntime 判断当前微信运行环境是否为 Android，用于 BLE 扫描位置权限补齐。 */
function isAndroidRuntime(): boolean {
  const runtimeApi = getRuntimeApi();
  const api = runtimeApi.getSystemInfoSync as (() => RuntimeSystemInfo) | undefined;
  if (typeof api !== 'function') return false;
  try {
    const info = api.call(runtimeApi) || {};
    return `${info.platform || ''} ${info.system || ''}`.toLowerCase().includes('android');
  } catch (err) {
    bleLogger.warn('readiness', 'getSystemInfoSync:exception', err);
    return false;
  }
}

function classifyReason(fail: OpenAdapterFail): BleReadinessReason {
  const sys = safeGetSystemSetting();
  if (sys.bluetoothEnabled === false) return 'system_off';
  const appAuth = safeGetAppAuthorizeSetting();
  if (appAuth.bluetoothAuthorized === 'denied') return 'app_unauthorized';
  if (isPrivacyAgreementUndeclared(fail)) return 'privacy_not_declared';
  const locationReason = checkLocationPrerequisite(sys, appAuth);
  if (locationReason) return locationReason;
  if (fail.errCode === 10001) return 'system_off';
  return 'adapter_busy';
}

/** isPrivacyAgreementUndeclared 识别微信后台用户隐私保护指引未声明蓝牙能力的失败。 */
function isPrivacyAgreementUndeclared(fail: OpenAdapterFail): boolean {
  if (fail.errno === 112) return true;
  const errMsg = fail.errMsg || '';
  return errMsg.includes('api scope is not declared in the privacy agreement') || errMsg.includes('privacy agreement');
}

/** formatOpenAdapterFail 将小程序错误对象摊平成普通字段，避免 DevTools 控制台显示空对象。 */
function formatOpenAdapterFail(err: OpenAdapterFail, reason: BleReadinessReason): OpenAdapterFail & { reason: BleReadinessReason } {
  return {
    reason,
    errMsg: err.errMsg,
    errCode: err.errCode,
    errno: err.errno,
  };
}

/** checkLocationPrerequisite 检查微信 BLE 扫描依赖的系统定位和精确位置状态。 */
function checkLocationPrerequisite(
  sys: SystemSettingResult,
  appAuth: AppAuthorizeSettingResult,
): BleReadinessReason | null {
  if (sys.locationEnabled === false) return 'location_off';
  if (appAuth.locationAuthorized === 'denied') return 'location_unauthorized';
  if (appAuth.locationReducedAccuracy === true) return 'location_reduced_accuracy';
  return null;
}

/** authorizeMiniProgramScope 在用户点击触发的链路中主动请求小程序 scope 授权。 */
function authorizeMiniProgramScope(scope: typeof BLUETOOTH_AUTHORIZE_SCOPE | typeof LOCATION_AUTHORIZE_SCOPE): Promise<BleReadinessResult | null> {
  // #ifdef MP-WEIXIN
  const runtimeApi = getRuntimeApi();
  const api = runtimeApi.authorize as ((options: {
    scope: string;
    success?: () => void;
    fail?: (err: OpenAdapterFail) => void;
  }) => void) | undefined;
  if (typeof api !== 'function') return Promise.resolve(null);
  return new Promise((resolve) => {
    api.call(runtimeApi, {
      scope,
      success: () => {
        bleLogger.info('readiness', 'authorize:success', { scope });
        resolve(null);
      },
      fail: (err) => {
        const failPayload = {
          scope,
          errMsg: err.errMsg,
          errCode: err.errCode,
          errno: err.errno,
        };
        bleLogger.warn('readiness', 'authorize:fail', failPayload);
        if (isPrivacyAgreementUndeclared(err)) {
          resolve({ ok: false, reason: 'privacy_not_declared', errMsg: err.errMsg, errCode: err.errCode, errno: err.errno });
          return;
        }
        resolve({
          ok: false,
          reason: scope === BLUETOOTH_AUTHORIZE_SCOPE ? 'scope_denied' : 'location_unauthorized',
          errMsg: err.errMsg,
          errCode: err.errCode,
          errno: err.errno,
        });
      },
    });
  });
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.resolve(null);
  // #endif
}

/** getMiniProgramBluetoothScopeStatus 读取小程序自身蓝牙 scope 授权状态，未出现表示尚未请求。 */
function getMiniProgramBluetoothScopeStatus(): Promise<boolean | undefined> {
  // #ifdef MP-WEIXIN
  const runtimeApi = getRuntimeApi();
  const api = runtimeApi.getSetting as ((options: {
    success?: (res: MiniProgramSettingResult) => void;
    fail?: (err: OpenAdapterFail) => void;
  }) => void) | undefined;
  if (typeof api !== 'function') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    api.call(runtimeApi, {
      success: (res) => {
        resolve(res.authSetting?.[BLUETOOTH_AUTHORIZE_SCOPE]);
      },
      fail: (err) => {
        bleLogger.warn('readiness', 'getSetting:fail', err);
        resolve(undefined);
      },
    });
  });
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.resolve(undefined);
  // #endif
}

/** ensureMiniProgramBluetoothAuthorized 检查或请求小程序自身蓝牙 scope 授权。 */
async function ensureMiniProgramBluetoothAuthorized(appAuth: AppAuthorizeSettingResult, interactive = false): Promise<BleReadinessResult | null> {
  // #ifdef MP-WEIXIN
  if (appAuth.bluetoothAuthorized === 'denied') {
    bleLogger.warn('readiness', 'appBluetooth:denied');
    return { ok: false, reason: 'app_unauthorized' };
  }
  const scopeStatus = await getMiniProgramBluetoothScopeStatus();
  if (scopeStatus === false) {
    return { ok: false, reason: 'scope_denied' };
  }
  if (scopeStatus === undefined && !interactive) {
    return { ok: false, reason: 'scope_not_determined' };
  }
  if (scopeStatus === undefined) {
    return authorizeMiniProgramScope(BLUETOOTH_AUTHORIZE_SCOPE);
  }
  return null;
  // #endif
  // #ifndef MP-WEIXIN
  return null;
  // #endif
}

/** ensureAndroidLocationAuthorizedForBleScan 在 Android 微信 BLE 扫描前补齐位置授权。 */
async function ensureAndroidLocationAuthorizedForBleScan(appAuth: AppAuthorizeSettingResult, interactive = false): Promise<BleReadinessResult | null> {
  // #ifdef MP-WEIXIN
  if (!isAndroidRuntime()) return null;
  if (appAuth.locationAuthorized === 'authorized') return null;
  if (appAuth.locationAuthorized === 'denied') return { ok: false, reason: 'location_unauthorized' };
  if (!interactive) return { ok: false, reason: 'location_not_determined' };
  return authorizeMiniProgramScope(LOCATION_AUTHORIZE_SCOPE);
  // #endif
  // #ifndef MP-WEIXIN
  return null;
  // #endif
}

/** ensurePrivacyAgreementReady 主动检查微信隐私协议是否因后台更新需要重新确认。 */
async function ensurePrivacyAgreementReady(): Promise<BleReadinessResult | null> {
  // #ifdef MP-WEIXIN
  const authorized = await privacyConsentService.requestAuthorization();
  if (!authorized) {
    return { ok: false, reason: 'scope_denied', errMsg: '用户未同意隐私保护指引' };
  }
  return null;
  // #endif
  // #ifndef MP-WEIXIN
  return null;
  // #endif
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function openBluetoothAdapterOnce(): Promise<BleReadinessResult> {
  return new Promise<BleReadinessResult>((resolve) => {
    bleLogger.info('readiness', 'openBluetoothAdapter:start');
    uni.openBluetoothAdapter({
      success: (res) => {
        bleLogger.info('readiness', 'openBluetoothAdapter:success', res);
        bleDataSource.markAdapterReady();
        resolve({ ok: true });
      },
      fail: (err: OpenAdapterFail) => {
        const reason = classifyReason(err);
        const failPayload = formatOpenAdapterFail(err, reason);
        bleLogger.error('readiness', 'openBluetoothAdapter:fail', failPayload);
        resolve({
          ok: false,
          reason,
          errMsg: failPayload.errMsg,
          errCode: failPayload.errCode,
          errno: failPayload.errno,
        });
      },
    });
  });
}

/** openBluetoothAdapterWithRetry 对首轮瞬时忙碌做一次短重试，降低页面与预热并发误伤。 */
async function openBluetoothAdapterWithRetry(): Promise<BleReadinessResult> {
  const first = await openBluetoothAdapterOnce();
  if (first.ok || first.reason !== 'adapter_busy') return first;
  await sleep(OPEN_ADAPTER_RETRY_DELAY_MS);
  if (bleDataSource.isAdapterReady()) return { ok: true };
  bleLogger.warn('readiness', 'openBluetoothAdapter:retry', { delayMs: OPEN_ADAPTER_RETRY_DELAY_MS });
  return openBluetoothAdapterOnce();
}

/**
 * 同步前置检查 + 调用 openBluetoothAdapter, 不弹任何 UI。
 *
 * 失败时返回结构化 reason, 由调用方决定是否调用 showBluetoothNotReadyGuide。
 */
export async function ensureBluetoothReady(options: BleReadinessOptions = {}): Promise<BleReadinessResult> {
  if (bleDataSource.isAdapterReady()) {
    bleLogger.debug('readiness', 'skip-adapter-ready');
    return { ok: true };
  }

  const interactive = options.interactive === true;
  if (interactive) {
    if (pendingInteractiveBluetoothReady) return pendingInteractiveBluetoothReady;
    pendingInteractiveBluetoothReady = ensureBluetoothReadyInner(interactive).finally(() => {
      pendingInteractiveBluetoothReady = null;
    });
    return pendingInteractiveBluetoothReady;
  }

  if (pendingBluetoothReady) return pendingBluetoothReady;
  pendingBluetoothReady = ensureBluetoothReadyInner(interactive).finally(() => {
    pendingBluetoothReady = null;
  });
  return pendingBluetoothReady;
}

async function ensureBluetoothReadyInner(interactive: boolean): Promise<BleReadinessResult> {
  const sys = safeGetSystemSetting();
  if (sys.bluetoothEnabled === false) {
    bleLogger.warn('readiness', 'systemBluetooth:disabled');
    return { ok: false, reason: 'system_off' };
  }

  const appAuth = safeGetAppAuthorizeSetting();
  if (appAuth.bluetoothAuthorized === 'denied') {
    bleLogger.warn('readiness', 'appBluetooth:denied');
    return { ok: false, reason: 'app_unauthorized' };
  }

  const privacyAgreementResult = await ensurePrivacyAgreementReady();
  if (privacyAgreementResult) return privacyAgreementResult;

  const miniProgramAuthorizeResult = await ensureMiniProgramBluetoothAuthorized(appAuth, interactive);
  if (miniProgramAuthorizeResult) return miniProgramAuthorizeResult;
  const latestSys = safeGetSystemSetting();
  const latestAppAuth = safeGetAppAuthorizeSetting();
  const locationReason = checkLocationPrerequisite(latestSys, latestAppAuth);
  if (locationReason) {
    bleLogger.warn('readiness', 'location:not-ready', { reason: locationReason, sys: latestSys, appAuth: latestAppAuth });
    return { ok: false, reason: locationReason };
  }
  const locationAuthorizeResult = await ensureAndroidLocationAuthorizedForBleScan(latestAppAuth, interactive);
  if (locationAuthorizeResult) return locationAuthorizeResult;
  const finalLocationReason = checkLocationPrerequisite(safeGetSystemSetting(), safeGetAppAuthorizeSetting());
  if (finalLocationReason) return { ok: false, reason: finalLocationReason };

  return openBluetoothAdapterWithRetry();
}

/**
 * 弹出引导 modal, 用户确认后跳转到对应设置页, 让用户开蓝牙 / 重新授权。
 * 返回 true 表示用户点了"去开启" (App 暂时无法验证是否真正开启, 调用方应在 onShow 重试)。
 */
export function showBluetoothNotReadyGuide(reason: BleReadinessReason | undefined): Promise<boolean> {
  const config = resolveGuideConfig(reason);
  return new Promise((resolve) => {
    uni.showModal({
      title: config.title,
      content: config.content,
      confirmText: config.confirmText,
      cancelText: '取消',
      success: (modalRes) => {
        if (!modalRes.confirm) {
          resolve(false);
          return;
        }
        config.action().then(resolve).catch(() => resolve(false));
      },
      fail: () => resolve(false),
    });
  });
}

interface GuideConfig {
  title: string;
  content: string;
  confirmText: string;
  action: () => Promise<boolean>;
}

function resolveGuideConfig(reason: BleReadinessReason | undefined): GuideConfig {
  switch (reason) {
    case 'system_off':
      return {
        title: '请开启手机蓝牙',
        content: '配网需要使用蓝牙发现并连接设备, 请下拉控制中心打开蓝牙后返回本页重试。',
        confirmText: '我知道了',
        action: () => Promise.resolve(true),
      };
    case 'app_unauthorized':
      return {
        title: '微信蓝牙权限未开启',
        content: '请在系统设置里允许"微信"使用蓝牙, 否则无法搜索和连接设备。',
        confirmText: '去开启',
        action: openAppAuthorizeSetting,
      };
    case 'location_off':
      return {
        title: '请开启手机定位',
        content: 'Android 微信扫描蓝牙设备需要系统定位开关保持开启, 请打开定位后返回本页重试。',
        confirmText: '我知道了',
        action: () => Promise.resolve(true),
      };
    case 'location_unauthorized':
      return {
        title: '请允许微信使用位置',
        content: 'Android 微信扫描蓝牙设备需要位置权限, 请在权限设置中允许微信使用位置。',
        confirmText: '去设置',
        action: openSetting,
      };
    case 'location_not_determined':
      return {
        title: '请允许微信使用位置',
        content: 'Android 微信扫描蓝牙设备需要位置权限, 请允许后继续配网。',
        confirmText: '去授权',
        action: () => Promise.resolve(true),
      };
    case 'location_reduced_accuracy':
      return {
        title: '请开启精确位置',
        content: '当前只允许了大致位置, Android 微信蓝牙扫描可能搜不到设备。请在微信位置权限中开启精确位置后重试。',
        confirmText: '去设置',
        action: openAppAuthorizeSetting,
      };
    case 'privacy_not_declared':
      return {
        title: '蓝牙隐私声明未配置',
        content: '当前小程序后台的用户隐私保护指引未声明蓝牙能力，微信会拒绝拉起蓝牙授权。请在微信公众平台补充蓝牙声明后重试。',
        confirmText: '我知道了',
        action: () => Promise.resolve(true),
      };
    case 'scope_denied':
      return {
        title: '请允许小程序使用蓝牙',
        content: '小程序的蓝牙授权被拒绝, 请在权限设置中重新开启。',
        confirmText: '去设置',
        action: openSetting,
      };
    case 'scope_not_determined':
      return {
        title: '请允许小程序使用蓝牙',
        content: '配网需要使用蓝牙发现并连接设备, 请允许后继续。',
        confirmText: '去授权',
        action: () => Promise.resolve(true),
      };
    case 'adapter_busy':
      return {
        title: '蓝牙暂不可用',
        content: '系统蓝牙正忙或被其他应用占用, 请稍后重试或重启蓝牙开关。',
        confirmText: '我知道了',
        action: () => Promise.resolve(true),
      };
    default:
      return {
        title: '蓝牙暂不可用',
        content: '请检查系统蓝牙是否打开, 以及微信是否已授予蓝牙权限。',
        confirmText: '我知道了',
        action: () => Promise.resolve(true),
      };
  }
}

function openAppAuthorizeSetting(): Promise<boolean> {
  // #ifdef MP-WEIXIN
  const wxAny = (typeof wx !== 'undefined' ? wx : {}) as any;
  const api = wxAny.openAppAuthorizeSetting;
  if (typeof api !== 'function') {
    return openSetting();
  }
  return new Promise((resolve) => {
    api.call(wxAny, {
      success: () => resolve(true),
      fail: () => {
        openSetting().then(resolve).catch(() => resolve(false));
      },
    });
  });
  // #endif
  // #ifndef MP-WEIXIN
  return openSetting();
  // #endif
}

function openSetting(): Promise<boolean> {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    const wxAny = (typeof wx !== 'undefined' ? wx : {}) as any;
    if (typeof wxAny.openSetting !== 'function') {
      resolve(false);
      return;
    }
    wxAny.openSetting({
      success: () => resolve(true),
      fail: () => resolve(false),
    });
    return;
    // #endif
    // #ifdef APP-PLUS
    // App 端无 openSetting，引导用户去系统设置由调用方 UI 处理
    resolve(false);
    return;
    // #endif
    // #ifndef MP-WEIXIN || APP-PLUS
    resolve(false);
    // #endif
  });
}

/** 一站式: 检查 + 失败弹引导。返回最终是否就绪。 */
export async function ensureBluetoothReadyWithGuide(): Promise<BleReadinessResult> {
  const result = await ensureBluetoothReady({ interactive: true });
  if (result.ok) return result;
  await showBluetoothNotReadyGuide(result.reason);
  return result;
}
