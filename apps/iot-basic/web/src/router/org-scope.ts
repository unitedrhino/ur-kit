/**
 * org-iot-client 组织级路由工具。
 *
 * 负责把前端内部菜单使用的 canonical 路径映射到真实的 /{org-id}/... 地址，
 * 并为路由守卫提供租户核心信息校验的最小公共逻辑。
 */
import type { RouteRecordRaw } from 'vue-router';

/** 应用未找到页面路径 */
export const APP_NOT_FOUND_PATH = '/app_not_found';
/** 系统初始化页面路径 */
export const INIT_PATH = '/init';
/** 组织作用域下默认首页 */
export const DEFAULT_ORG_HOME_PATH = '/dashboard';
/** 组织作用域登录页路径模板 */
export const ORG_AUTH_LOGIN_ROUTE_PATH = '/:orgId/auth/login';
/** 组织作用域认证根路径模板 */
export const ORG_AUTH_ROOT_ROUTE_PATH = '/:orgId/auth';

const NUMERIC_ORG_ID_RE = /^\d+$/;
const AUTH_ROOT_PATH = '/auth';

type TenantCoreLike = {
  code?: string;
  id?: string;
};

type TenantCoreGetter = (payload: { code?: string; id?: string }) => Promise<null | TenantCoreLike | undefined>;

function splitPathSuffix(value: string) {
  const queryIndex = value.search(/[?#]/);
  if (queryIndex === -1) {
    return {
      path: value || '/',
      suffix: '',
    };
  }

  return {
    path: value.slice(0, queryIndex) || '/',
    suffix: value.slice(queryIndex),
  };
}

function normalizePath(value: string | undefined) {
  const path = value?.trim() || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function decodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function encodePathSegment(segment: string) {
  return encodeURIComponent(segment).replaceAll('%2F', '');
}

/** extractOrgIdFromPath 从路径第一段读取 org-id；公开页返回空字符串。 */
export function extractOrgIdFromPath(value: string | undefined) {
  const { path } = splitPathSuffix(normalizePath(value));
  const firstSegment = path.split('/').find(Boolean) || '';
  if (!firstSegment || path === APP_NOT_FOUND_PATH || path === INIT_PATH) {
    return '';
  }
  return decodePathSegment(firstSegment);
}

/** isOrgScopeBypassPath 判断路径是否不需要 org-id 校验。 */
export function isOrgScopeBypassPath(value: string | undefined) {
  const { path } = splitPathSuffix(normalizePath(value));
  return path === APP_NOT_FOUND_PATH || path === INIT_PATH;
}

/** stripOrgPathPrefix 去掉第一层 org-id，得到菜单和内部逻辑使用的 canonical 路径。 */
export function stripOrgPathPrefix(value: string | undefined) {
  const normalized = normalizePath(value);
  const { path, suffix } = splitPathSuffix(normalized);
  const segments = path.split('/').filter(Boolean);
  if (segments.length <= 1) {
    return `/${suffix}`.replace(/^\/(?=[?#])/, '/') || '/';
  }
  return `/${segments.slice(1).join('/')}${suffix}`;
}

/** buildOrgPath 把 canonical 业务路径转换成 /{org-id}/... 真实路由。 */
export function buildOrgPath(orgId: string | undefined, targetPath = DEFAULT_ORG_HOME_PATH) {
  const normalizedOrgId = orgId?.trim();
  const safeOrgId = normalizedOrgId ? encodePathSegment(normalizedOrgId) : '';
  if (!safeOrgId) return normalizePath(targetPath || DEFAULT_ORG_HOME_PATH);

  const { path, suffix } = splitPathSuffix(normalizePath(targetPath || DEFAULT_ORG_HOME_PATH));
  const canonicalPath = path === '/' ? DEFAULT_ORG_HOME_PATH : path;
  if (canonicalPath === APP_NOT_FOUND_PATH || canonicalPath === INIT_PATH) {
    return `${canonicalPath}${suffix}`;
  }
  if (canonicalPath.startsWith(`/${safeOrgId}/`)) {
    return `${canonicalPath}${suffix}`;
  }
  return `/${safeOrgId}${canonicalPath}${suffix}`;
}

/** buildOrgAuthPath 构造当前组织作用域下的认证页路径。 */
export function buildOrgAuthPath(orgId: string | undefined, authPath = 'login') {
  const normalized = normalizePath(authPath);
  const authSubPath = normalized.startsWith(AUTH_ROOT_PATH) ? normalized.slice(AUTH_ROOT_PATH.length) || '/login' : normalized;
  return buildOrgPath(orgId, `${AUTH_ROOT_PATH}${authSubPath}`);
}

function materializePath(path: unknown, orgId: string) {
  if (typeof path !== 'string' || !path.startsWith('/')) return path;
  return buildOrgPath(orgId, path);
}

function materializeRedirect(redirect: RouteRecordRaw['redirect'], orgId: string) {
  if (typeof redirect !== 'string') return redirect;
  return materializePath(redirect, orgId) as string;
}

/** materializeOrgRoutes 将 canonical 路由树转换成当前 org-id 的真实路由树。 */
export function materializeOrgRoutes(routes: RouteRecordRaw[], orgId: string) {
  if (!orgId) return routes.map((route) => ({ ...route }));

  return routes.map((route) => {
    const meta = route.meta ? { ...route.meta } : undefined;
    if (typeof meta?.activePath === 'string') {
      meta.activePath = buildOrgPath(orgId, meta.activePath);
    }

    const result = {
      ...route,
      ...(meta ? { meta } : {}),
      path: materializePath(route.path, orgId) as string,
      redirect: materializeRedirect(route.redirect, orgId),
    } as RouteRecordRaw;

    if (route.children?.length) {
      result.children = materializeOrgRoutes(route.children as RouteRecordRaw[], orgId);
    }
    return result;
  });
}

/** materializeTenantMenuMap 将后端 canonical 菜单路径转换成当前 org-id 下的菜单路径。 */
export function materializeTenantMenuMap<T extends { menu?: { path?: string } }>(source: Map<string, T>, orgId: string) {
  if (!orgId) return new Map(source);

  const result = new Map<string, T>();
  for (const [path, item] of source.entries()) {
    const scopedPath = buildOrgPath(orgId, path);
    result.set(scopedPath, {
      ...item,
      menu: item.menu ? { ...item.menu, path: scopedPath } : item.menu,
    });
  }
  return result;
}

/**
 * resolveTenantCoreByOrgId 按 code 优先校验组织，纯数字 org-id 在 code 未命中时再按 id 兜底。
 */
export async function resolveTenantCoreByOrgId(orgId: string, getTenant: TenantCoreGetter) {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) return null;

  try {
    const tenant = await getTenant({ code: normalizedOrgId });
    if (tenant?.code) return tenant;
  } catch {
    // code 未命中时允许继续尝试数字 id 兜底。
  }

  if (!NUMERIC_ORG_ID_RE.test(normalizedOrgId)) return null;

  try {
    const tenant = await getTenant({ id: normalizedOrgId });
    return tenant?.code ? tenant : null;
  } catch {
    return null;
  }
}
