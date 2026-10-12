import type { ComponentRecordType, GenerateMenuAndRoutesOptions } from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';
import { $t } from '@vben/saas/locales';
import { message } from '@vben/saas/naive';
import { applyTenantMenuOverrides, fetchUserMenuMap } from '@vben/saas/utils';

import { BasicLayout, IFrameView } from '#/layouts';

import { extractOrgIdFromPath, materializeOrgRoutes, materializeTenantMenuMap } from './org-scope';

// const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');
const ForbiddenComponent = () => import('@vben/saas/fallback').then((module) => ({ default: module.Forbidden }));

async function generateAccess(options: GenerateMenuAndRoutesOptions, orgIdOverride = '') {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');
  const orgId = orgIdOverride || extractOrgIdFromPath(options.router.currentRoute.value.path);
  const scopedRoutes = materializeOrgRoutes(options.routes, orgId);

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  const result = await generateAccessible(preferences.app.accessMode, {
    ...options,
    routes: scopedRoutes,
    fetchMenuListAsync: async () => {
      message.loading(`${$t('common.loadingMenu')}...`, {
        duration: 1.5,
      });
      return [];
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent: ForbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });

  // 用当前用户菜单覆盖静态菜单的名称/排序/显隐，并按应用过滤菜单模板
  const tenantMenuMap = materializeTenantMenuMap(await fetchUserMenuMap(import.meta.env.VITE_GLOB_APPID), orgId);
  if (tenantMenuMap.size > 0) {
    result.accessibleMenus = applyTenantMenuOverrides(result.accessibleMenus, tenantMenuMap);
  }

  return result;
}

export { generateAccess };
