/**
 * App 扫码权限服务。
 *
 * 仅在 App Android 端主动申请相机运行时权限；其他平台继续交给各自的
 * `uni.scanCode` 实现处理，避免在小程序或 H5 端引入 App 专有 API。
 */

const ANDROID_CAMERA_PERMISSION = 'android.permission.CAMERA';

interface AndroidPermissionEvent {
  granted?: string[];
  deniedPresent?: string[];
  deniedAlways?: string[];
}

interface PlusAndroidPermissionApi {
  requestPermissions: (
    permissions: string[],
    success: (event: AndroidPermissionEvent) => void,
    fail: (error: unknown) => void,
  ) => void;
}

interface CameraPermissionResult {
  ok: boolean;
  permanentlyDenied?: boolean;
}

function isAppAndroid(): boolean {
  // #ifdef APP-PLUS
  try {
    const appBase = uni.getAppBaseInfo() as { platform?: string };
    return (appBase.platform || '').toLowerCase() === 'android';
  } catch {
    return false;
  }
  // #endif
  // #ifndef APP-PLUS
  return false;
  // #endif
}

function getPlusAndroidPermissionApi(): PlusAndroidPermissionApi | null {
  const runtime = (typeof globalThis === 'undefined' ? {} : globalThis) as {
    plus?: { android?: Partial<PlusAndroidPermissionApi> };
  };
  const api = runtime.plus?.android;
  return typeof api?.requestPermissions === 'function'
    ? (api as PlusAndroidPermissionApi)
    : null;
}

/** 主动申请 Android 相机权限，并把拒绝状态转换成扫码入口可判断的结果。 */
function requestAndroidCameraPermission(): Promise<CameraPermissionResult> {
  const androidApi = getPlusAndroidPermissionApi();
  if (!androidApi) {
    return Promise.resolve({ ok: false });
  }

  return new Promise((resolve) => {
    androidApi.requestPermissions(
      [ANDROID_CAMERA_PERMISSION],
      (event) => {
        const deniedPresent = event.deniedPresent || [];
        const deniedAlways = event.deniedAlways || [];
        const denied = [...deniedPresent, ...deniedAlways];
        resolve({
          ok: !denied.includes(ANDROID_CAMERA_PERMISSION),
          permanentlyDenied: deniedAlways.includes(ANDROID_CAMERA_PERMISSION),
        });
      },
      () => resolve({ ok: false }),
    );
  });
}

/** 展示扫码相机权限被拒绝后的兜底说明。 */
function showCameraPermissionGuide(permanentlyDenied?: boolean): Promise<void> {
  return new Promise((resolve) => {
    uni.showModal({
      title: '需要相机权限',
      content: permanentlyDenied
        ? '请在系统设置中允许联犀Iot使用相机，否则无法扫码绑定设备。'
        : '扫码绑定设备需要使用相机，请允许相机权限后重试。',
      showCancel: false,
      confirmText: '我知道了',
      complete: () => resolve(),
    });
  });
}

/** 确保扫码前具备必要的相机权限；非 App Android 平台直接放行。 */
export async function ensureScanCameraReady(): Promise<boolean> {
  if (!isAppAndroid()) return true;

  const result = await requestAndroidCameraPermission();
  if (result.ok) return true;

  await showCameraPermissionGuide(result.permanentlyDenied);
  return false;
}
