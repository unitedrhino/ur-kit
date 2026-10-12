import { baseRequestClient, requestClient } from '../request';
import { useSessionStore } from '../../store/session';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
    tenantCode?: string;
  }

  /** 登录接口返回值 */

  export interface LoginResult {
    accessToken?: string;
    token: {
      accessExpire: string;
      accessToken: string;
      refreshAfter: string;
    };
    info: {
      nickName?: string;
      phone?: string;
      userID: number;
      userName?: string;
    };
    tenants?: any[]; // 租户列表，登录时返回
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/api/v1/system/user/self/login', data, {
    headers: {
      // 'ithings-tenant-code': data?.tenantCode || 'default',
      // 'app-id': "300"
    },
  });
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  const sessionStore = useSessionStore();
  return baseRequestClient.post('/api/v1/system/user/self/logout', {}, {
    headers: { token: sessionStore.token || '' },
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  // return requestClient.get<string[]>('/auth/codes');
  return [];
}

/**
 * 获取图片验证码
 */
export async function getCaptchaApi() {
  return requestClient.post<any>('/api/v1/system/user/self/captcha', {
    account: '',
    type: 'image',
    use: 'login',
  });
}
