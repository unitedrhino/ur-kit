<!-- 应用生命周期：恢复身份、启动上下文，并承接扫码首页票据。 -->
<script lang="ts">
import { authProvider } from './providers/auth.provider';
import { appProvider } from './providers/app.provider';
import { deviceListProvider } from './providers/device-list.provider';
import { alarmProvider } from './providers/alarm.provider';
import { messageProvider } from './providers/message.provider';
import { webSocketProvider } from './providers/websocket.provider';
import { tenantProvider } from './providers/tenant.provider';
import { appContextProvider } from './providers/app-context.provider';
import { privacyConsentService } from './services/privacy-consent.service';
import { permissionWarmupService } from './services/permission-warmup.service';
import { logger, reportGlobalError } from './utils/logger';
// #ifdef H5
/** panelHandoffLaunch 保留本次H5启动的票据用途；设置返回时初始query仍可能包含已消费的面板票据。 */
let panelHandoffLaunch = false;
// #endif

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
    // #ifdef H5
    // 面板交接自行兑换并校验身份，避免旧H5缓存恢复请求与新账号交接并发。
    if (typeof location !== 'undefined' && location.hash.startsWith('#/packageDevice/pages/panel-entry/index')) { panelHandoffLaunch = true; return; }
    // #endif
    // 微信绑定只验证当前微信，不恢复平台会话，避免缓存令牌过期将确认页跳转到登录页。
    if (typeof options?.query?.bindTicket === 'string' && /^[a-f0-9]{64}$/.test(options.query.bindTicket)) return;
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
    logger.info('navigation.resume', '应用前台恢复', { launchPath: options?.path || '', route: getCurrentPages().at(-1)?.route || '', entryPolicy: 'explicit-panel-ticket' });
    // #ifdef H5
    // 交接完成后仍保留微信面板用途；原生设置返回会重放初始query，不能再把票据识别成电脑登录。
    if (panelHandoffLaunch || (typeof location !== 'undefined' && location.hash.startsWith('#/packageDevice/pages/panel-entry/index'))) return;
    // #endif
    // URL Link的电脑登录/微信绑定只由原生扫码入口承接；H5前台恢复不得解释通用ticket。
    // #ifndef H5
    if (appContextProvider.openWebLoginFromLaunch(options?.query, options?.path)) return;
    // #endif
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
  messageProvider.init();
  // 消息接口只依赖当前用户会话，登录成功后立即加载，保证首页消息入口能及时显示未读红点。
  void messageProvider.loadFirst();
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
    messageProvider.loadFirst();
  }
}
</script>

<style lang="scss">
/* 全局样式入口在 main.ts 引入 app.scss */
</style>
