/**
 * 单组织品牌工具。
 * 单组织模式下，导航栏优先使用配置组织名称，导航栏和登录页优先使用配置组织头像。
 */
import { BRAND } from '../config/brand';
import { config } from '../config';
import type { TenantEntity } from '../domain/entities/tenant.entity';
import { tenantProvider } from '../providers/tenant.provider';
import { tenantService } from '../services/tenant.service';

let cachedSingleTenant: TenantEntity | null = null;
let pendingSingleTenant: Promise<TenantEntity | null> | null = null;

/** isSingleTenantBrandMode 判断当前是否需要使用单组织头像。 */
export function isSingleTenantBrandMode(): boolean {
  return config.tenantMode === 'single' && !!config.singleTenantCode;
}

/** getSingleTenantBrandLogoPath 返回当前可用的单组织头像，没有头像时回退默认品牌图。 */
export function getSingleTenantBrandLogoPath(): string {
  if (!isSingleTenantBrandMode()) return BRAND.logoPath;
  const current = tenantProvider.getState().current;
  if (isConfiguredSingleTenant(current) && current?.avatar) {
    return current.avatar;
  }
  return cachedSingleTenant?.avatar || BRAND.logoPath;
}

/** getNavigationBrandName 返回一级页导航栏品牌名：多组织固定平台名，单组织优先使用组织名。 */
export function getNavigationBrandName(): string {
  const fallback = config.brandName || BRAND.brandName || BRAND.appName;
  if (!isSingleTenantBrandMode()) return fallback;
  const current = tenantProvider.getState().current;
  if (isConfiguredSingleTenant(current) && current?.name) {
    return current.name;
  }
  return cachedSingleTenant?.name || fallback;
}

/** loadSingleTenantBrand 从公开组织应用信息读取单组织头像，并缓存结果。 */
export async function loadSingleTenantBrand(): Promise<TenantEntity | null> {
  if (!isSingleTenantBrandMode()) return null;
  const current = tenantProvider.getState().current;
  if (isConfiguredSingleTenant(current) && current?.avatar) {
    cachedSingleTenant = current;
    return current;
  }
  if (isConfiguredSingleTenant(cachedSingleTenant)) {
    return cachedSingleTenant;
  }
  if (!pendingSingleTenant) {
    pendingSingleTenant = tenantService
      .getTenantByCode(config.singleTenantCode)
      .then((tenant) => {
        cachedSingleTenant = tenant;
        return tenant;
      })
      .finally(() => {
        pendingSingleTenant = null;
      });
  }
  return pendingSingleTenant;
}

/** isConfiguredSingleTenant 判断组织是否匹配单组织配置；配置值兼容 code 或 id。 */
function isConfiguredSingleTenant(tenant?: TenantEntity | null): boolean {
  if (!tenant) return false;
  return tenant.code === config.singleTenantCode || tenant.id === config.singleTenantCode;
}
