/**
 * org-iot-client 认证页路径工具。
 *
 * 本地认证页都挂在 /{org-id}/auth/* 下，页面内部跳转统一走这里，
 * 避免残留裸 /auth/* 路径绕过组织校验。
 */
import type { RouteLocationNormalizedLoaded } from 'vue-router';

import { buildOrgAuthPath, buildOrgPath, DEFAULT_ORG_HOME_PATH, extractOrgIdFromPath } from '#/router/org-scope';

function getRouteOrgId(route: RouteLocationNormalizedLoaded) {
  return extractOrgIdFromPath(route.path);
}

/** resolveAuthPath 根据当前路由中的 org-id 构造认证页路径。 */
export function resolveAuthPath(route: RouteLocationNormalizedLoaded, authPath = 'login') {
  return buildOrgAuthPath(getRouteOrgId(route), authPath);
}

/** resolveHomePath 根据当前路由中的 org-id 构造默认业务首页。 */
export function resolveHomePath(route: RouteLocationNormalizedLoaded) {
  return buildOrgPath(getRouteOrgId(route), DEFAULT_ORG_HOME_PATH);
}
