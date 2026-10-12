const BIGSCREEN_SECTION_PATTERN = /\/(screen|template|datasource|component|dataset|asset|editor|component-editor|published|preview|view)(?:\/.*)?$/;

export const BIGSCREEN_STANDALONE_IOT_APP_BASE = '/app/iot/';

export interface BigscreenRouteUrlOptions {
  appBase?: string;
}

function getAppBasePath() {
  const rawBase = (import.meta.env.VITE_BASE || import.meta.env.BASE_URL || '/').trim();
  if (rawBase === './' || rawBase === '/') {
    const pathname = window.location.pathname || '/';
    const dirPath = pathname.endsWith('/') ? pathname : pathname.replace(/\/[^/]*$/, '/');
    return dirPath.startsWith('/') ? dirPath : `/${dirPath}`;
  }
  const normalizedBase = rawBase;
  const withLeadingSlash = normalizedBase.startsWith('/') ? normalizedBase : `/${normalizedBase}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function normalizeAppBasePath(appBase?: string) {
  if (!appBase) return getAppBasePath();

  const trimmed = appBase.trim();
  if (!trimmed) return getAppBasePath();

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export function resolveBigscreenBasePath(currentPath: string) {
  const normalizedPath = currentPath.split('?')[0] || currentPath;
  const resolvedPath = normalizedPath.replace(BIGSCREEN_SECTION_PATTERN, '');
  if (resolvedPath) {
    return resolvedPath;
  }

  if (BIGSCREEN_SECTION_PATTERN.test(normalizedPath)) {
    return '/';
  }

  return normalizedPath;
}

export function buildBigscreenPath(currentPath: string, targetPath: string) {
  const basePath = resolveBigscreenBasePath(currentPath);
  const normalizedTarget = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  if (!basePath || basePath === '/') {
    return normalizedTarget;
  }
  return `${basePath.replace(/\/+$/, '')}${normalizedTarget}`;
}

export function getCurrentAppRoutePath() {
  if (import.meta.env.VITE_ROUTER_HISTORY === 'hash') {
    return window.location.hash.replace(/^#/, '') || '/';
  }
  return `${window.location.pathname}${window.location.search}`;
}

export function buildBigscreenRouteUrl(
  currentPath: string,
  targetPath: string,
  query?: Record<string, boolean | number | string | undefined>,
  options?: BigscreenRouteUrlOptions,
) {
  const routePath = buildBigscreenPath(currentPath, targetPath);
  const queryString = query
    ? Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')
    : '';
  const routeWithQuery = queryString ? `${routePath}?${queryString}` : routePath;

  if (import.meta.env.VITE_ROUTER_HISTORY === 'hash') {
    const basePath = normalizeAppBasePath(options?.appBase);
    return `${window.location.origin}${basePath}#${routeWithQuery}`;
  }

  return `${window.location.origin}${routeWithQuery}`;
}

export function buildStandaloneBigscreenUrl(
  targetPath: string,
  query?: Record<string, boolean | number | string | undefined>,
  options?: BigscreenRouteUrlOptions,
) {
  return buildBigscreenRouteUrl(getCurrentAppRoutePath(), targetPath, query, options);
}
