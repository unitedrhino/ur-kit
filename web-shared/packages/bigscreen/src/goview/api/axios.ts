import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { useSessionStore } from '@vben/saas';
import { useAccessStore, useProjectStore } from '@vben/stores';

import { ResultEnum } from '@/enums/httpEnum';
import { ErrorPageNameMap } from '@/enums/pageEnum';
import { redirectErrorPage } from '@/utils';
import axios from 'axios';

import { getCookieValue, restoreAccessTokenFromCookie } from '../../shared/auth';

const ORG_ID_KEY = 'org-id';

function restoreTokenFromCookie(): null | string {
  return restoreAccessTokenFromCookie('GoView Axios') || null;
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? import.meta.env.VITE_DEV_PATH : import.meta.env.VITE_PRO_PATH,
  timeout: ResultEnum.TIMEOUT,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token: null | string = null;

    try {
      token = useAccessStore().accessToken || null;
    } catch (error) {
      console.warn('[GoView Axios] Access store is unavailable:', error);
    }

    if (!token) {
      token = restoreTokenFromCookie();
    }

    if (token) {
      config.headers.token = token;
      config.headers['app-id'] = import.meta.env.VITE_GLOB_APPID || '2';
    }

    try {
      const sessionStore = useSessionStore();
      const tenantCode = sessionStore.tenantCode || getCookieValue(ORG_ID_KEY);
      if (tenantCode) config.headers['tenant-code'] = tenantCode;
    } catch (error) {
      console.warn('[GoView Axios] Failed to read organization id from cookie:', error);
    }

    // 注入 project-id（告警等按项目隔离的接口依赖该 header；store 初始化前回退到 cookie）
    try {
      const projectID = useProjectStore().currentProjectID || getCookieValue('project-id');
      if (projectID) config.headers['project-id'] = projectID;
    } catch (error) {
      console.warn('[GoView Axios] Failed to read project id:', error);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[GoView Axios] Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => {
    const { code } = res.data as { code: number };
    if (code === undefined || code === null) return Promise.resolve(res.data);
    if (code === ResultEnum.DATA_SUCCESS) return Promise.resolve(res.data);
    if (ErrorPageNameMap.get(code)) redirectErrorPage(code);
    return Promise.resolve(res.data);
  },
  (err: AxiosResponse) => {
    return Promise.reject(err);
  },
);

export default axiosInstance;
