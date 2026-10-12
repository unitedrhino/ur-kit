export interface RequestContext {
  tenantCode: string;
  projectID: string;
}

const context: RequestContext = {
  tenantCode: '',
  projectID: '',
};

// 旧版 common 只是前端占位组织，新版请求上下文不再向后端透传。
const LEGACY_COMMON_TENANT_CODE = 'common';

/** normalizeTenantCode 过滤旧版占位组织，确保登录注册等请求不会带 common 租户头。 */
function normalizeTenantCode(tenantCode: string): string {
  return tenantCode && tenantCode !== LEGACY_COMMON_TENANT_CODE ? tenantCode : '';
}

export function getRequestContext(): RequestContext {
  return { ...context };
}

export function setRequestTenantCode(tenantCode: string): void {
  const normalizedTenantCode = normalizeTenantCode(tenantCode);
  context.tenantCode = normalizedTenantCode;
  if (!normalizedTenantCode) {
    context.projectID = '';
  }
}

export function setRequestProjectContext(tenantCode: string, projectID: string): void {
  const normalizedTenantCode = normalizeTenantCode(tenantCode);
  context.tenantCode = normalizedTenantCode;
  context.projectID = normalizedTenantCode ? projectID : '';
}

export function clearRequestContext(): void {
  context.tenantCode = '';
  context.projectID = '';
}
