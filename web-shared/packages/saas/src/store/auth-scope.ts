/**
 * 组织作用域认证路径工具。
 *
 * 共享 auth store 会被多个应用复用，本文件只在 org-iot-client 场景启用
 * /{org-id}/auth/* 与 /{org-id}/* 的跳转规则。
 */
const ORG_SCOPED_APP_DEFAULT_HOME_PATH: Record<string, string> = {
  'org-iot-client': '/dashboard',
};
const APP_NOT_FOUND_PATH = '/app_not_found';
const DEFAULT_ORG_HOME_PATH = '/dashboard';
const AUTH_ROOT_PATH = '/auth';

function splitPathSuffix(value: string) {
  const suffixIndex = value.search(/[?#]/);
  if (suffixIndex < 0) {
    return {
      path: value || '/',
      suffix: '',
    };
  }

  return {
    path: value.slice(0, suffixIndex) || '/',
    suffix: value.slice(suffixIndex),
  };
}

function normalizePath(value: string | undefined) {
  const path = value?.trim() || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function extractOrgIdFromPath(value: string | undefined) {
  const { path } = splitPathSuffix(normalizePath(value));
  const firstSegment = path.split('/').find(Boolean) || '';
  if (!firstSegment || path === '/' || path === APP_NOT_FOUND_PATH || path === '/init') {
    return '';
  }
  try {
    return decodeURIComponent(firstSegment);
  } catch {
    return firstSegment;
  }
}

function stripOrgPathPrefix(value: string | undefined) {
  const { path, suffix } = splitPathSuffix(normalizePath(value));
  const segments = path.split('/').filter(Boolean);
  if (segments.length <= 1) return '/';
  return `/${segments.slice(1).join('/')}${suffix}`;
}

function encodeOrgId(orgId: string) {
  return encodeURIComponent(orgId).replaceAll('%2F', '');
}

function isOrgScopedApp(appName = import.meta.env.VITE_GLOB_APPNAME) {
  return !!ORG_SCOPED_APP_DEFAULT_HOME_PATH[appName || ''];
}

function getDefaultOrgHomePath(appName = import.meta.env.VITE_GLOB_APPNAME) {
  return ORG_SCOPED_APP_DEFAULT_HOME_PATH[appName || ''] || DEFAULT_ORG_HOME_PATH;
}

function buildOrgPath(orgId: string, targetPath = DEFAULT_ORG_HOME_PATH, appName = import.meta.env.VITE_GLOB_APPNAME) {
  const safeOrgId = encodeOrgId(orgId);
  const defaultHomePath = getDefaultOrgHomePath(appName);
  const { path, suffix } = splitPathSuffix(normalizePath(targetPath || defaultHomePath));
  const canonicalPath = path === '/' ? defaultHomePath : path;
  if (canonicalPath === APP_NOT_FOUND_PATH) return `${canonicalPath}${suffix}`;
  if (canonicalPath.startsWith(`/${safeOrgId}/`)) return `${canonicalPath}${suffix}`;
  return `/${safeOrgId}${canonicalPath}${suffix}`;
}

/** shouldUseOrgScopedTenantContext 判断登录后是否应复用 URL 已确定的组织上下文。 */
export function shouldUseOrgScopedTenantContext(options: { appName?: string; currentPath?: string; tenantCode?: string }) {
  if (!isOrgScopedApp(options.appName)) return false;
  if (!options.tenantCode?.trim()) return false;
  return !!extractOrgIdFromPath(options.currentPath);
}

/** resolveOrgScopedLoginSuccessPath 计算 org-iot-client 登录成功后的目标页。 */
export function resolveOrgScopedLoginSuccessPath(currentPath: string | undefined, targetPath: string, appName = import.meta.env.VITE_GLOB_APPNAME) {
  if (!isOrgScopedApp(appName)) return targetPath;
  const orgId = extractOrgIdFromPath(currentPath);
  if (!orgId) return targetPath;

  const canonicalTargetPath = stripOrgPathPrefix(targetPath);
  if (canonicalTargetPath.startsWith(AUTH_ROOT_PATH)) {
    return buildOrgPath(orgId, getDefaultOrgHomePath(appName), appName);
  }

  return buildOrgPath(orgId, targetPath || getDefaultOrgHomePath(appName), appName);
}

/** resolveOrgScopedAuthPath 计算 org-iot-client 认证页跳转路径。 */
export function resolveOrgScopedAuthPath(currentPath: string | undefined, authPath = '/auth/login', appName = import.meta.env.VITE_GLOB_APPNAME) {
  if (!isOrgScopedApp(appName)) return authPath;
  const orgId = extractOrgIdFromPath(currentPath);
  if (!orgId) return authPath;

  const normalized = normalizePath(authPath);
  const authSubPath = normalized.startsWith(AUTH_ROOT_PATH) ? normalized.slice(AUTH_ROOT_PATH.length) || '/login' : normalized;
  return buildOrgPath(orgId, `${AUTH_ROOT_PATH}${authSubPath}`, appName);
}

/** resolveOrgScopedUnauthorizedPath 计算 org-iot-client 未授权应用的落点。 */
export function resolveOrgScopedUnauthorizedPath(
  currentPath: string | undefined,
  fallbackPath = '/auth/app-unauthorized',
  appName = import.meta.env.VITE_GLOB_APPNAME,
) {
  if (!isOrgScopedApp(appName)) return fallbackPath;
  return extractOrgIdFromPath(currentPath) ? APP_NOT_FOUND_PATH : fallbackPath;
}
