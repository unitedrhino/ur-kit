/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { setRequestClient } from '@vben/api';
import { useAppConfig } from '@vben/hooks';
import { i18n } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { authenticateResponseInterceptor, defaultResponseInterceptor, errorMessageResponseInterceptor, RequestClient } from '@vben/request';
import { useAccessStore, useProjectStore } from '@vben/stores';
import { useCookies } from '@vueuse/integrations/useCookies';

import { useAuthStore, useServerErrorStore } from '../store';
import { getRequestErrorMessage, markRequestErrorHandled } from '../utils/request-error';
import { useToast } from '../hooks/use-toast';
import { ACCESS_TOKEN_KEY, ORG_ID_KEY } from '../constants';
import { useSessionStore } from '../store/session';
import { syncSessionToken } from './token-sync';

import { refreshTokenApi } from './core';
import { shouldSkipTenantCode } from './request-tenant';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    timeout: 120_000,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    // 首次登出完成后，迟到的并发 401 不再重复调用退出接口和跳转登录页。
    if (!accessStore.accessToken) return;
    if (preferences.app.loginExpiredMode === 'modal' && accessStore.isAccessChecked) {
      accessStore.setAccessToken(null);
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    syncSessionToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理：统一从 sessionStore 读取 token 和 tenantCode
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const sessionStore = useSessionStore();
      sessionStore.syncTenantFromCookie();
      const cookies = useCookies([ACCESS_TOKEN_KEY, ORG_ID_KEY], { doNotParse: true });
      const cookieToken = cookies.get(ACCESS_TOKEN_KEY) || '';
      const cookieTenantCode = cookies.get(ORG_ID_KEY) || '';

      // 首屏阶段部分请求可能早于路由守卫执行；此处用 cookie 兜底，避免空 token 触发登出。
      if (!sessionStore.token && cookieToken) {
        sessionStore.setToken(cookieToken);
      }
      if (!sessionStore.tenantCode && cookieTenantCode) {
        sessionStore.setTenant(cookieTenantCode);
      }

      const APPID = import.meta.env.VITE_GLOB_APPID;
      config.headers['app-id'] = APPID;
      config.headers['Accept-Language'] ||= i18n.global.locale.value || preferences.app.locale;
      config.headers['token'] = sessionStore.token;

      if (!shouldSkipTenantCode(config.url)) {
        const headers = config.headers as Record<string, string | undefined>;
        // 单次请求可显式传 tenant-code（如控制台资讯走 platform），未传时再用 session
        let tc = headers['tenant-code'] || sessionStore.tenantCode || '';
        // 兜底：强制租户代码（如 platform-manage 固定为 platform）
        if (!tc) {
          const forcedTc = (import.meta.env.VITE_GLOB_TENANT_CODE as string | undefined)?.trim();
          if (forcedTc) {
            tc = forcedTc;
          }
        }
        if (tc) {
          headers['tenant-code'] = tc;
        }
      }

      // 自动注入 project-id header（从 cookie 读取，与 project store 保持一致）
      // 页面级开关：仅当前页面启用了项目上下文（见 project store 的 scope 配置）才注入，
      // 避免设备列表等租户维度页面被 cookie 里残留的旧项目 ID 污染
      const hdrs = config.headers as Record<string, string | undefined>;
      // 显式 null 表示调用方不使用项目上下文，不能再用旧 cookie 覆盖。
      if (!Object.prototype.hasOwnProperty.call(hdrs, 'project-id')) {
        const projectStore = useProjectStore();
        const currentPath =
          typeof window === 'undefined'
            ? ''
            : window.location.hash.replace(/^#/, '') || window.location.pathname;
        if (projectStore.isProjectScopeEnabled(currentPath)) {
          const pidMatch = document.cookie.match(/(?:^|; )project-id=([^;]*)/);
          const pid = pidMatch ? decodeURIComponent(pidMatch[1]!) : '';
          if (pid) {
            hdrs['project-id'] = pid;
          }
        }
      }

      return config;
    },
  });

  client.addResponseInterceptor({
    fulfilled: async (response) => {
      // 兼容 msg -> message
      if (response && typeof response === 'object') {
        if ('msg' in response && !('message' in response)) {
          (response as any).message = response.msg;
        }
        if ('data' in response && response.data && typeof response.data === 'object' && 'msg' in response.data && !('message' in response.data)) {
          response.data.message = response.data.msg;
        }
      }
      return response;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 200,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理
  const errorInterceptor = errorMessageResponseInterceptor((msg: string, error) => {
      const status = error?.response?.status;
      // 401 继续由登录态拦截器处理，避免在跳转/刷新时叠加错误提示。
      if (status === 401) return;
      // 5xx 服务器错误：显示全屏错误蒙层
      if (status !== undefined && status >= 500) {
        useServerErrorStore().show();
        return;
      }
      useToast().toast({ title: error?.isLicenseRestricted ? msg : getRequestErrorMessage(error?.response?.data ?? {}, () => msg), type: 'error' });
    });
  client.addResponseInterceptor({
    // 原始异常必须被标记；授权限制分支向回调传递副本，不能只标记该副本。
    rejected: (error) => {
      // 取消请求也保持静默，避免页面误报保存或删除失败。
      markRequestErrorHandled(error);
      return errorInterceptor.rejected!(error);
    },
  });

  setRequestClient(client);

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
