<script lang="ts">
import { authProvider } from './providers/auth.provider';
import { appProvider } from './providers/app.provider';
import { deviceListProvider } from './providers/device-list.provider';
import { alarmProvider } from './providers/alarm.provider';
import { webSocketProvider } from './providers/websocket.provider';
import { tenantProvider } from './providers/tenant.provider';
import { appContextProvider } from './providers/app-context.provider';
import { privacyConsentService } from './services/privacy-consent.service';
import { permissionWarmupService } from './services/permission-warmup.service';
import { reportGlobalError } from './utils/logger';

export default {
  onLaunch(options: any) {
    // 隐私授权监听由页面内真实 agreePrivacyAuthorization 按钮承接。
    // #ifdef MP-WEIXIN
    privacyConsentService.init();
    // #endif

    // 初始化应用级 provider
    appProvider.init();
    webSocketProvider.init();
    tenantProvider.restore();
    const hasInvite = appContextProvider.captureLaunchOptions({
      ...(options?.query || {}),
      scene: options?.scene ? String(options.scene) : undefined,
    });

    // 登录态检查 + 恢复
    authProvider.init();
    if (authProvider.getState().loggedIn) {
      void restoreCachedSession(hasInvite);
      return;
    }
    handleCapturedLaunchContext(hasInvite);
  },

  onLoginSuccess() {
    initializeAfterLogin({ connectWebSocket: true });
  },

  onShow(options: any) {
    const hasInvite = appContextProvider.captureLaunchOptions({
      ...(options?.query || {}),
      scene: options?.scene ? String(options.scene) : undefined,
    });
    const authState = authProvider.getState();
    if (authState.loggedIn && authState.sessionConfirmed) {
      if (hasInvite) {
        handleCapturedLaunchContext(hasInvite, loadAlarmIfTenantReady);
        return;
      }
      loadAlarmIfTenantReady();
    }
  },

  onHide() {
    // 后台时不主动断开 ws
  },

  onError(error: string) {
    reportGlobalError(new Error(error || 'App script error'), 'app.error');
  },
  onUnhandledRejection(event: { reason?: unknown }) {
    reportGlobalError(event?.reason, 'promise.unhandled');
  },
};

/** 登录后统一初始化需要鉴权的模块，缓存恢复时等普通鉴权请求确认后再连接 WS。 */
function initializeAfterLogin(options: { connectWebSocket?: boolean } = {}) {
  deviceListProvider.init();
  alarmProvider.init();
  if (options.connectWebSocket) {
    const authState = authProvider.getState();
    if (authState.sessionConfirmed) {
      webSocketProvider.connect(authState.user?.token || '');
    }
  }
  const userID = authProvider.getState().user?.userID || '';
  if (userID) {
    void permissionWarmupService.tryWarmupAfterLogin(userID);
  }
}

/** restoreCachedSession 确认缓存 token 有效后再恢复登录后模块。 */
async function restoreCachedSession(hasInvite: boolean) {
  const restored = await authProvider.restoreSession();
  if (!restored) {
    handleCapturedLaunchContext(hasInvite);
    return;
  }
  initializeAfterLogin({ connectWebSocket: true });
  handleCapturedLaunchContext(hasInvite);
}

/** handleCapturedLaunchContext 先准备组织上下文，再继续登录后上下文恢复。 */
function handleCapturedLaunchContext(hasLaunchContext: boolean, afterReady?: () => void) {
  if (!hasLaunchContext) return;
  void appContextProvider.prepareTenantContextBeforeAuth().then((ready) => {
    const authState = authProvider.getState();
    if (!ready || !authState.loggedIn || !authState.sessionConfirmed) return;
    void appContextProvider.continueAfterLogin('/pages/home/index').then(() => {
      afterReady?.();
    });
  });
}

/** loadAlarmIfTenantReady 仅在已有有效组织上下文时加载消息提醒。 */
function loadAlarmIfTenantReady() {
  const currentTenant = tenantProvider.getState().current;
  if (currentTenant?.code) {
    alarmProvider.loadFirst();
  }
}
</script>

<style lang="scss">
/* 全局样式入口在 main.ts 引入 app.scss */
</style>
