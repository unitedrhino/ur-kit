/**
 * Session 统一管理 Store
 *
 * 职责：
 * - 作为 accessToken 和 tenantCode (orgId) 的唯一写入点
 * - Cookie 仅用于跨应用共享持久化，由本 store 内部统一管理
 * - 外部代码只调用本 store 的方法，不直接操作 Cookie
 */
import { computed, ref } from 'vue';

import { CoreApi } from '@vben/api';
import { useAccessStore, useTabbarStore } from '@vben/stores';

import { useCookies } from '@vueuse/integrations/useCookies';
import { defineStore } from 'pinia';

import { ACCESS_TOKEN_KEY, ORG_ID_KEY } from '../constants';

/** 企业-应用权限条目（仅读取权限判断需要的字段） */
export type AppAccessEntry = { appID: string; tenantCode?: string };

/**
 * Pinia 持久化相关的 localStorage key 白名单
 * logout 时只清这些，保留主题/语言/列宽等用户偏好
 */
const SESSION_STORAGE_KEYS = ['core-access', 'core-user'];

export const useSessionStore = defineStore('saas-session', () => {
  const accessStore = useAccessStore();
  // Cookie 实例集中在此处创建，其他文件不再各自调用 useCookies
  const cookies = useCookies([ACCESS_TOKEN_KEY, ORG_ID_KEY], { doNotParse: true });

  // 当前租户编码的响应式状态，只从用户真实选择过的 cookie 初始化
  // 应用级默认租户（如 platform）只用于单次请求兜底，不能冒充成用户已选企业
  const _tenantCode = ref<string>(cookies.get(ORG_ID_KEY) || '');

  // 登录后缓存的用户跨企业 app 列表（null = 未加载，[] = 已加载但为空）
  const _selfAppList = ref<AppAccessEntry[] | null>(null);
  const appAccessCheckCache = new Map<string, boolean>();

  // ── 读（computed，对外响应式） ─────────────────────────
  const token = computed(() => accessStore.accessToken);
  const tenantCode = computed(() => _tenantCode.value);
  const isAuthenticated = computed(() => !!accessStore.accessToken);
  const loginExpired = computed(() => accessStore.loginExpired);
  const selfAppList = computed(() => _selfAppList.value);

  // ── 写 ────────────────────────────────────────────────

  /** 设置 token：同步写入 Pinia + Cookie */
  function setToken(value: string) {
    accessStore.setAccessToken(value);
    cookies.set(ACCESS_TOKEN_KEY, value, { path: '/' });
  }

  /** 切换当前租户：同步写入响应式 ref + Cookie */
  function setTenant(code: string) {
    const previousTenantCode = _tenantCode.value;
    if (previousTenantCode && previousTenantCode !== code) {
      useTabbarStore().clearTabs();
    }

    _tenantCode.value = code;
    cookies.set(ORG_ID_KEY, code, { path: '/' });
  }

  /** 从 cookie 重新同步当前租户，避免 store 先初始化后 cookie 才写入时 tenantCode 失真 */
  function syncTenantFromCookie() {
    // 只兜底：store 为空时才从 cookie 恢复，不覆盖已有值（避免旧 cookie 覆盖初始化好的正确值）
    const code = cookies.get(ORG_ID_KEY) || '';
    if (code && !_tenantCode.value) {
      _tenantCode.value = code;
    }
    return _tenantCode.value;
  }

  /** 标记 token 过期状态 */
  function setLoginExpired(expired: boolean) {
    accessStore.setLoginExpired(expired);
  }

  /** 更新用户跨企业 app 列表（登录后调用一次） */
  function setSelfAppList(list: AppAccessEntry[]) {
    _selfAppList.value = list;
  }

  /**
   * 判断指定企业+应用是否在用户的 selfAppList 中
   * - null（未加载）时 fail-open，返回 true，避免误拦截
   */
  function hasSelfAppAccess(tc: string, appId: string): boolean {
    if (_selfAppList.value === null) return true;
    return _selfAppList.value.some(
      (item) => item.tenantCode === tc && item.appID === appId,
    );
  }

  function getErrorCode(error: unknown) {
    const source = (error as any)?.response?.data ?? (error as any)?.data ?? error;
    return (source as any)?.code ?? (source as any)?.status ?? (error as any)?.response?.status;
  }

  function getErrorMessage(error: unknown) {
    const source = (error as any)?.response?.data ?? (error as any)?.data ?? error;
    return (source as any)?.msg ?? (source as any)?.message ?? '';
  }

  function isAppAccessDenied(error: unknown) {
    const code = String(getErrorCode(error) ?? '');
    return code === '100012' || code === '403' || getErrorMessage(error).includes('无权访问该应用');
  }

  /**
   * 切换企业前用目标企业实时校验当前应用权限。
   * 登录态里的 tenant.appIDs 在不同接口下可能是部分数据，只能作为兜底缓存。
   */
  async function verifySelfAppAccess(tc: string, appId: string): Promise<boolean> {
    const tenantCode = String(tc || '').trim();
    const currentAppId = String(appId || '').trim();
    if (!tenantCode || !currentAppId) return true;

    const cacheKey = `${tenantCode}:${currentAppId}`;
    if (appAccessCheckCache.has(cacheKey)) {
      return appAccessCheckCache.get(cacheKey)!;
    }

    try {
      const result = await CoreApi.postApiV1SystemUserSelfAppGetList(
        {},
        {
          headers: { 'tenant-code': tenantCode },
          skipReAuthenticate: true,
        },
      );
      const authorized = (result?.list ?? []).some(
        (item: any) => String(item?.appID ?? '') === currentAppId,
      );
      appAccessCheckCache.set(cacheKey, authorized);
      return authorized;
    } catch (error) {
      if (isAppAccessDenied(error)) {
        appAccessCheckCache.set(cacheKey, false);
        return false;
      }
      throw error;
    }
  }

  /**
   * 清理所有 session 数据
   * - 重置 Pinia 响应式状态
   * - 移除 Cookie
   * - 只清 session 相关 localStorage key，不碰用户偏好
   */
  function clearSession(options?: { preserveTenant?: boolean }) {
    const preserveTenant = options?.preserveTenant ?? false;

    // 清 Pinia state
    accessStore.setAccessToken(null);
    _selfAppList.value = null;
    appAccessCheckCache.clear();
    if (!preserveTenant) {
      _tenantCode.value = '';
    }

    // 清 Cookie
    cookies.remove(ACCESS_TOKEN_KEY, { path: '/' });
    if (!preserveTenant) {
      cookies.remove(ORG_ID_KEY, { path: '/' });
    }

    // 精准清 localStorage：只清 Pinia 持久化的 session 相关 key
    for (const key of SESSION_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    sessionStorage.clear();
  }

  function $reset() {
    // logout / resetAllStores 时默认保留 org-id，避免切换应用后丢租户上下文
    clearSession({ preserveTenant: true });
  }

  return {
    $reset,
    isAuthenticated,
    loginExpired,
    selfAppList,
    tenantCode,
    token,
    clearSession,
    hasSelfAppAccess,
    verifySelfAppAccess,
    setLoginExpired,
    setSelfAppList,
    setTenant,
    syncTenantFromCookie,
    setToken,
  };
});
