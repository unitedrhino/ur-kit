const TENANT_CODE_SKIP_PATHS = [
  '/api/v1/system/user/self/login',
  '/api/v1/system/user/self/third-auth/start',
  '/api/v1/system/user/self/third-login',
  '/api/v1/system/user/self/third-register',
];

export function shouldSkipTenantCode(url?: string) {
  return !!url && TENANT_CODE_SKIP_PATHS.some((path) => url.includes(path));
}
