import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useSystemConfigStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { dialog } from '../adapter';
import { getUserInfoApi, logoutApi } from '../api';
import { useToast } from '../hooks/use-toast';
import { $t, applyPersonalLanguage } from '../locales';
import {
  clearForcePasswordSetupPending,
  getBackToConsoleUrl,
  getPasswordSetupPath,
  normalizeRedirectPath,
  markForcePasswordSetupPending,
  shouldForceSetPassword,
  shouldRemindSetPassword,
} from '../utils';
import { acceptPendingInviteAfterAuth } from '../views/_core/authentication/accept-invite';
import { useAppInfoStore } from './appInfo';
import {
  resolveOrgScopedAuthPath,
  resolveOrgScopedLoginSuccessPath,
  resolveOrgScopedUnauthorizedPath,
  shouldUseOrgScopedTenantContext,
} from './auth-scope';
import { useDictStore } from './dict';
import { useSessionStore } from './session';

export const useAuthStore = defineStore('auth', () => {
  const sessionStore = useSessionStore();
  const userStore = useUserStore();
  const router = useRouter();
  const { toast } = useToast();

  const loginLoading = ref(false);

  /**
   * 处理登录响应的公共逻辑
   * @param loginResult 登录接口返回的数据
   * @param onSuccess 登录成功后的回调
   */
  async function processLoginResult(loginResult: CoreApi.UserLoginResp, onSuccess?: () => Promise<void> | void) {
    const accessToken = loginResult?.token?.accessToken || '';
    if (!accessToken) return { userInfo: null };

    // 统一通过 sessionStore 写入 token（同步 Pinia + Cookie）
    sessionStore.setToken(accessToken);

    // 构建 selfAppList（用于企业切换权限判断）
    // 从登录响应的 tenant.appIDs 字段读取（TenantCore.appIDs，后端已部署）；
    // fallback：字段全部为空时，调 user/self/app/get-list 接口
    {
      const allTenants = (loginResult?.info?.tenants ?? []) as CoreApi.UserTenant[];
      const entries: Array<{ appID: string; tenantCode?: string }> = [];
      for (const t of allTenants) {
        // appIDs 定义为 string[]，但后端实际返回 number[]，统一转 string
        const appIDs = t.tenant?.appIDs as Array<string | number> | undefined;
        if (Array.isArray(appIDs)) {
          for (const id of appIDs) {
            entries.push({ appID: String(id), tenantCode: t.tenantCode });
          }
        }
      }
      if (entries.length > 0) {
        sessionStore.setSelfAppList(entries);
      } else {
        // fallback：appIDs 字段为空时，通过接口获取
        try {
          const result = await CoreApi.postApiV1SystemUserSelfAppGetList({}, { skipReAuthenticate: true });
          sessionStore.setSelfAppList(result?.list ?? []);
        } catch {
          // 网络异常时保持 null（未加载），hasSelfAppAccess 会 fail-open
        }
      }
    }

    let userInfo: CoreApi.UserInfo | null = null;

    // 优先用登录响应中的 info，避免额外的 fetchUserInfo 请求
    // 若登录响应包含 tenants，一并合并（tenants 在登录时是最新的）
    if (loginResult?.info) {
      const info = loginResult.info as CoreApi.UserInfo;
      const tenants = info?.tenants;
      userInfo = tenants && tenants.length > 0 ? { ...info, tenants } : info;

      userStore.setUserInfo(userInfo as any, sessionStore.tenantCode);
    } else {
      // 兜底：登录响应没有 info 时才发额外请求
      userInfo = await fetchUserInfo();
    }

    await applyPersonalLanguage(userInfo?.language);
    // 字典请求必须在个人语言生效后发出，避免旧语言结果覆盖新缓存。
    void useDictStore().initDict(true).catch(() => {});

    if (sessionStore.loginExpired) {
      sessionStore.setLoginExpired(false);
    } else {
      try {
        await acceptPendingInviteAfterAuth({
          join: (payload) => CoreApi.postApiV1SystemUserSelfTenantJoin(payload),
          refreshSelfAppList: async () => {
            const result = await CoreApi.postApiV1SystemUserSelfAppGetList({}, { skipReAuthenticate: true });
            sessionStore.setSelfAppList(result?.list ?? []);
          },
          refreshUserInfo: async () => {
            userInfo = await fetchUserInfo();
            return userInfo;
          },
          setTenant: (tenantCode) => sessionStore.setTenant(tenantCode),
        });
      } catch (error) {
        console.error('自动接受邀请失败:', error);
      }

      const systemConfig = await useSystemConfigStore().getSystemConfig();
      const forceSetPassword = shouldForceSetPassword(systemConfig, userInfo);
      const remindSetPassword = shouldRemindSetPassword(systemConfig, userInfo);
      const passwordSetupPath = getPasswordSetupPath({
        force: forceSetPassword,
        reminder: remindSetPassword && !forceSetPassword,
      });

      if (forceSetPassword) {
        markForcePasswordSetupPending();
        const targetUrl = getBackToConsoleUrl(passwordSetupPath);
        if (targetUrl) {
          window.location.href = targetUrl;
          return { userInfo };
        }
        await router.push(passwordSetupPath);
        return { userInfo };
      }

      clearForcePasswordSetupPending();

      // 判断租户选择 + 应用授权
      const tenantResult = await resolveLoginTenant(userInfo);
      const currentPath = router.currentRoute.value.path;
      if (tenantResult === 'choose-tenant') {
        await (onSuccess?.() ?? router.push(resolveOrgScopedUnauthorizedPath(currentPath, '/auth/tenant-choose')));
      } else if (tenantResult === 'app-unauthorized') {
        await (onSuccess?.() ?? router.push(resolveOrgScopedUnauthorizedPath(currentPath, '/auth/app-unauthorized')));
      } else {
        const scopedTenantContext = shouldUseOrgScopedTenantContext({
          currentPath,
          tenantCode: sessionStore.tenantCode,
        });
        const targetPath = resolveOrgScopedLoginSuccessPath(
          currentPath,
          scopedTenantContext ? normalizeRedirectPath(router.currentRoute.value.query?.redirect as string, preferences.app.defaultHomePath) : preferences.app.defaultHomePath,
        );
        await (onSuccess?.() ?? router.push(targetPath));
      }

      if (remindSetPassword) {
        dialog.warning({
          title: '请设置登录密码',
          content: '当前账号尚未设置登录密码，建议立即完成设置以避免后续登录受限。',
          positiveText: '立即设置',
          negativeText: '稍后设置',
          onPositiveClick: () => {
            const targetUrl = getBackToConsoleUrl(passwordSetupPath);
            if (targetUrl) {
              window.location.href = targetUrl;
            }
          },
        });
      }
    }

    if (userInfo?.userName) {
      toast({
        title: $t('authentication.loginSuccess'),
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo.userName}`,
        duration: 3000,
      });
    }

    return { userInfo };
  }

  /**
   * 使用登录响应数据完成登录流程（用于注册后自动登录）
   */
  async function authLoginWithResult(loginResult: CoreApi.UserLoginResp, onSuccess?: () => Promise<void> | void) {
    try {
      loginLoading.value = true;
      return await processLoginResult(loginResult, onSuccess);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      loginLoading.value = false;
    }
  }

  /**
   * 异步处理登录操作
   */
  async function authLogin(params: CoreApi.UserLoginReq, onSuccess?: () => Promise<void> | void) {
    try {
      loginLoading.value = true;
      const result = await CoreApi.postApiV1SystemUserSelfLogin({
        account: params.account,
        pwdType: params.pwdType ?? 1,
        password: params.password,
        loginType: params.loginType,
        code: params.code,
        codeID: params.codeID,
      });
      return await processLoginResult(result, onSuccess);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    const currentFullPath = router.currentRoute.value.fullPath;
    const currentPath = router.currentRoute.value.path;
    const loginPath = resolveOrgScopedAuthPath(currentPath, LOGIN_PATH);

    try {
      await logoutApi();
    } catch {
      // 静默失败，退出流程不受影响
    }

    // 重置所有 Pinia stores
    resetAllStores();

    // 显式退出登录时同步清空当前企业，避免后续换账号复用上一个 org-id
    sessionStore.clearSession();

    await router.replace({
      path: loginPath,
      query: redirect ? { redirect: encodeURIComponent(currentFullPath) } : {},
    });
  }

  /**
   * 检查当前租户是否已授权当前应用
   * 使用登录时缓存的 selfAppList，no network request
   * - selfAppList 为 null（未加载）时 fail-open
   */
  function checkAppAuthorization(appId: string): boolean {
    return sessionStore.hasSelfAppAccess(sessionStore.tenantCode, appId);
  }

  async function verifyAppAuthorization(appId: string): Promise<boolean> {
    return sessionStore.verifySelfAppAccess(sessionStore.tenantCode, appId);
  }

  /**
   * 登录后决定租户选择 + 应用授权
   * 返回:
   *  - 'proceed'         → 一切就绪，进入主页
   *  - 'choose-tenant'   → 需要用户选择企业
   *  - 'app-unauthorized' → 当前企业未开通此应用
   */
  async function resolveLoginTenant(userInfo: CoreApi.UserInfo | null): Promise<'app-unauthorized' | 'choose-tenant' | 'proceed'> {
    const appInfoStore = useAppInfoStore();
    const appId = import.meta.env.VITE_GLOB_APPID as string;
    const forcedTenantCode = (import.meta.env.VITE_GLOB_TENANT_CODE as string | undefined)?.trim();

    // 获取应用信息（含 tenantCode），若缓存为空会自动拉取
    const appInfo = await appInfoStore.getAppInfo(appId);
    const isCommonApp = appInfo?.tenantCode === 'common';

    if (
      shouldUseOrgScopedTenantContext({
        currentPath: router.currentRoute.value.path,
        tenantCode: sessionStore.tenantCode,
      })
    ) {
      userStore.syncUserRolesByTenant(sessionStore.tenantCode);
      const authorized = await verifyAppAuthorization(appId);
      return authorized ? 'proceed' : 'app-unauthorized';
    }

    if (!isCommonApp && forcedTenantCode) {
      if (!sessionStore.tenantCode) {
        sessionStore.setTenant(forcedTenantCode);
      }
      if (sessionStore.tenantCode === forcedTenantCode) {
        userStore.syncUserRolesByTenant(sessionStore.tenantCode);
        return 'proceed';
      }
    }

    if (!isCommonApp) {
      const appTenantCode = appInfo?.tenantCode;
      if (sessionStore.tenantCode && appTenantCode && sessionStore.tenantCode === appTenantCode) {
        userStore.syncUserRolesByTenant(sessionStore.tenantCode);
        return 'proceed';
      }

      // 非 common 应用（如 platform），tc 由 env/cookie 决定，仅校验授权
      if (sessionStore.tenantCode) {
        userStore.syncUserRolesByTenant(sessionStore.tenantCode);
        const authorized = await verifyAppAuthorization(appId);
        return authorized ? 'proceed' : 'app-unauthorized';
      }
      return 'proceed';
    }

    // ── common 应用：需要确定 tc ───────────────────────
    const tenants = userInfo?.tenants || [];
    if (tenants.length === 0) return 'proceed';

    let selectedTc: string | undefined;

    // 1. 优先使用 cookie 中已有的 tc（跨应用保留）
    const cookieTc = sessionStore.tenantCode;
    if (cookieTc && tenants.some((t) => t.tenantCode === cookieTc)) {
      selectedTc = cookieTc;
    }

    // 2. 仅一个企业时自动选中
    if (!selectedTc && tenants.length === 1) {
      selectedTc = tenants[0]?.tenantCode;
    }

    if (selectedTc) {
      sessionStore.setTenant(selectedTc);
      userStore.syncUserRolesByTenant(selectedTc);
      const authorized = await verifyAppAuthorization(appId);
      return authorized ? 'proceed' : 'app-unauthorized';
    }

    // 3. 多企业且无有效 cookie tc → 需要选择
    return 'choose-tenant';
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();

    userStore.setUserInfo(userInfo as any, sessionStore.tenantCode);
    await applyPersonalLanguage(userInfo.language);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    authLoginWithResult,
    checkAppAuthorization,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
