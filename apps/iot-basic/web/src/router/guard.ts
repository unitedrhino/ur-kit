import type { Router } from 'vue-router';

import { CoreApi } from '@vben/api';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { ACCESS_TOKEN_KEY } from '@vben/saas/constants';
import { useAuthStore, useDictStore, useSessionStore } from '@vben/saas/store';
import { normalizeRedirectPath } from '@vben/saas/utils';
import { useAccessStore, useProjectStore, useSystemConfigStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { useCookies } from '@vueuse/integrations/useCookies';

import { accessRoutes, coreRouteNames } from '#/router/routes';

import { generateAccess } from './access';
import {
  APP_NOT_FOUND_PATH,
  buildOrgAuthPath,
  buildOrgPath,
  DEFAULT_ORG_HOME_PATH,
  extractOrgIdFromPath,
  isOrgScopeBypassPath,
  resolveTenantCoreByOrgId,
  stripOrgPathPrefix,
} from './org-scope';
import { applyProjectEntryFlow, createProjectListLoadGate, ensureProjectListLoaded } from './project-guard';
/**
 * 通用守卫配置
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行

    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 系统是否初始化完成检测
 */
function setupSystemInitGuard(router: Router) {
  router.beforeEach(async (to, _from) => {
    if (to.path === '/init') {
      return true;
    }

    const systemConfigStore = useSystemConfigStore();
    const systemConfig = await systemConfigStore.getSystemConfig();

    // undefined = API 故障且无缓存，状态未知，不应重定向 /init，直接放行
    // null      = 明确未初始化（后端 200+null），跳转 /init
    // object    = 已初始化，放行
    if (systemConfig === null) {
      return {
        path: '/init',
        replace: true,
      };
    }
    return true;
  });
}

/**
 * 组织作用域守卫。
 *
 * 每个业务和认证 URL 的第一层都必须是 org-id。守卫会先用公开租户核心接口校验，
 * 再把后续请求真正使用的 tenant-code 写入 sessionStore。
 */
function setupOrgScopeGuard(router: Router) {
  const tenantCodeCache = new Map<string, null | string>();

  async function resolveTenantCode(orgId: string) {
    if (tenantCodeCache.has(orgId)) {
      return tenantCodeCache.get(orgId);
    }

    const tenant = await resolveTenantCoreByOrgId(orgId, (payload) =>
      CoreApi.postApiV1SystemTenantCoreGetOne(payload, {
        skipReAuthenticate: true,
      }),
    );
    const tenantCode = tenant?.code || null;
    tenantCodeCache.set(orgId, tenantCode);
    return tenantCode;
  }

  router.beforeEach(async (to) => {
    if (isOrgScopeBypassPath(to.path)) {
      return true;
    }

    const orgId = extractOrgIdFromPath(to.path);
    if (!orgId) {
      return {
        path: APP_NOT_FOUND_PATH,
        replace: true,
      };
    }

    const tenantCode = await resolveTenantCode(orgId);
    if (!tenantCode) {
      return {
        path: APP_NOT_FOUND_PATH,
        replace: true,
      };
    }

    const sessionStore = useSessionStore();
    if (sessionStore.tenantCode !== tenantCode) {
      sessionStore.setTenant(tenantCode);

      const accessStore = useAccessStore();
      accessStore.setAccessMenus([]);
      accessStore.setAccessRoutes([]);
      accessStore.setIsAccessChecked(false);
    }

    return true;
  });
}

/**
 * 权限访问守卫配置
 * @param router
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();
    const orgId = extractOrgIdFromPath(to.path);
    const orgLoginPath = buildOrgAuthPath(orgId, 'login');
    const orgDefaultHomePath = buildOrgPath(orgId, DEFAULT_ORG_HOME_PATH);

    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name as string)) {
      if (stripOrgPathPrefix(to.path) === '/auth/login' && accessStore.accessToken) {
        return normalizeRedirectPath(to.query?.redirect as string, orgDefaultHomePath);
      }
      return true;
    }

    // 自动登录
    if (!accessStore.accessToken && to.path !== orgLoginPath) {
      const cookies = useCookies([ACCESS_TOKEN_KEY]);
      const accessToken = cookies.get(ACCESS_TOKEN_KEY) || '';

      accessStore.setAccessToken(accessToken);
    }

    if (!accessStore.accessToken) {
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.path !== orgLoginPath) {
        return {
          path: orgLoginPath,
          // 如不需要，直接删除 query
          query: { redirect: encodeURIComponent(to.fullPath) },
          // 携带当前跳转的页面，登录后重新跳转该页面
          replace: true,
        };
      }
      return to;
    }

    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked) {
      return true;
    }
    // 生成路由表
    // 当前登录用户拥有的角色标识列表
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    const userRoles = userInfo.roles ?? [];

    // 生成菜单和路由
    const { accessibleMenus, accessibleRoutes } = await generateAccess(
      {
        roles: userRoles,
        router,
        // 则会在菜单中显示，但是访问会被重定向到403
        routes: accessRoutes,
      },
      orgId,
    );

    if (accessibleMenus.length === 0) {
      return {
        path: '/app_not_found',
        replace: true,
      };
    }

    // 保存菜单信息和路由信息
    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);
    const userHomePath = buildOrgPath(orgId, userInfo.homePath || DEFAULT_ORG_HOME_PATH);
    const redirectPath = normalizeRedirectPath(
      (from.query.redirect ?? (stripOrgPathPrefix(to.path) === preferences.app.defaultHomePath ? userHomePath : to.fullPath)) as string,
      orgDefaultHomePath,
    );

    return {
      ...router.resolve(redirectPath),
      replace: true,
    };
  });
}

/**
 * 项目选择守卫配置
 *
 * 能源应用进入流程：
 *   1. 0 个项目           → 弹出「新建项目」模态框（强制创建）
 *   2. 1 个项目           → 自动选中进入
 *   3. 多个 + 未选         → 弹出「选择项目」模态框
 *   4. 多个 + 已选且有效   → 直接进入（currentProjectID 由 cookie 持久化）
 */
function setupProjectGuard(router: Router) {
  let projectListGate = createProjectListLoadGate();
  let projectScopeKey = '';

  router.beforeEach(async (to) => {
    // 无 token 或基础路由直接放行，交由 access 守卫处理
    const accessStore = useAccessStore();
    if (!accessStore.accessToken) return true;
    if (coreRouteNames.includes(to.name as string)) return true;

    const projectStore = useProjectStore();
    const sessionStore = useSessionStore();
    projectStore.syncCurrentProjectIDFromCookie();
    const nextScopeKey = `${accessStore.accessToken || ''}:${sessionStore.tenantCode || extractOrgIdFromPath(to.path)}`;
    if (nextScopeKey !== projectScopeKey) {
      projectScopeKey = nextScopeKey;
      projectListGate = createProjectListLoadGate();
    }

    // 首次进入鉴权后业务页时必须等待项目列表完成，避免把“加载中空数组”误判为“无项目”。
    const loaded = await ensureProjectListLoaded(projectStore, projectListGate);
    if (!loaded) {
      return true;
    }

    applyProjectEntryFlow(projectStore);

    return true;
  });
}

/**
 * 模块首页守卫配置
 * @param router
 */
function setupModuleHomeGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const appAccessMode = preferences.app.accessMode;
    if (appAccessMode === 'frontend') {
      return next();
    }

    if (to.path === '/moduleHomePath') {
      const accessStore = useAccessStore();
      const accessRoutes = accessStore.accessRoutes.filter((it) => (it as any).moduleInfo);
      const firstModuleInfo = accessRoutes[0] as any;
      const homeMenuID = firstModuleInfo?.moduleInfo?.homeMenuID;

      if (homeMenuID === 1 || !homeMenuID) {
        const firstMenu = firstModuleInfo?.moduleInfo?.menus[0];
        if (firstMenu) {
          return next({
            path: firstMenu.path,
            replace: true,
          });
        } else {
          console.warn('模块无菜单:', firstModuleInfo?.moduleInfo?.name, firstModuleInfo?.moduleInfo?.path);

          return next({
            path: '/no-module?errorMessage=' + encodeURIComponent($t('orgIotClient.guard.noMenuModule')) + '&moduleName=' + firstModuleInfo?.moduleInfo?.name + '&modulePath=' + firstModuleInfo?.moduleInfo?.path,
            replace: true,
          });
        }

        // return true;
      } else {
        let path = firstModuleInfo?.moduleInfo?.menus.find((it: any) => it.templateID === homeMenuID)?.path;

        // 再尝试找第二层
        firstModuleInfo?.moduleInfo?.menus?.forEach((item: any) => {
          item.children?.forEach((child: any) => {
            if (child.templateID === homeMenuID) {
              path = child.path;
            }
          });
        });

        if (path) {
          return next({
            path,
            replace: true,
          });
        } else {
          return next({
            path:
              '/no-module?errorMessage=' + encodeURIComponent($t('orgIotClient.guard.dashboardRouteMissing')) + '&moduleName=' +
              firstModuleInfo?.moduleInfo?.name +
              '&modulePath=' +
              firstModuleInfo?.moduleInfo?.path,
            replace: true,
          });
        }
      }
    }

    return next();
  });
}

/**
 * 字典守卫配置
 * @param router
 * 只有在用户登录后才初始化字典
 */
function setupDictGuard(router: Router) {
  router.beforeEach(async (_to, _from, next) => {
    const accessStore = useAccessStore();

    // 只有在已登录的情况下才初始化字典
    if (accessStore.accessToken) {
      const dictStore = useDictStore();
      void dictStore.initDict().catch(() => {});
    }

    return next();
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 系统是否初始化完成检测 */
  setupSystemInitGuard(router);
  /** 组织 URL 作用域和公开租户校验 */
  setupOrgScopeGuard(router);

  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
  /** 项目选择（0/1/多项目 进入流程 + cookie 持久化） */
  setupProjectGuard(router);
  /** 模块首页 */
  // setupModuleHomeGuard(router);

  /** 字典 */
  setupDictGuard(router);
}

export { createRouterGuard, setupModuleHomeGuard, setupProjectGuard };
