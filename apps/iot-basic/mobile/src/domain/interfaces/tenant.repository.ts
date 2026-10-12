import type { TenantEntity } from '../entities/tenant.entity';

export interface ITenantRepository {
  getMyTenants(): Promise<TenantEntity[]>;
  /** hasTenantForApp 校验组织是否存在且已开通指定应用。 */
  hasTenantForApp(code: string, appID: string): Promise<boolean>;
  /** getTenantByCode 读取组织的基础公开信息，用于单组织场景和租户头像。 */
  getTenantByCode(code: string): Promise<TenantEntity | null>;
  /** getTenantForApp 读取已开通指定应用的公开组织信息。 */
  getTenantForApp(code: string, appID: string): Promise<TenantEntity | null>;
  createTenant(data: { name: string; desc?: string; avatar?: string }): Promise<string>;
  joinTenantByCode(code: string): Promise<void>;
  deleteTenant(code: string): Promise<void>;
  getTenantDetail(code?: string): Promise<TenantEntity>;
  updateTenant(data: { code?: string; name?: string; desc?: string; avatar?: string }): Promise<void>;
}
