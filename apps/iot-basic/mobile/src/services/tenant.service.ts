import { TenantRepositoryImpl } from '../data/repositories/tenant.repository.impl';
import type { ITenantRepository } from '../domain/interfaces/tenant.repository';
import type { TenantEntity } from '../domain/entities/tenant.entity';

export class TenantService {
  constructor(private readonly tenantRepo: ITenantRepository = new TenantRepositoryImpl()) {}

  /** 获取用户可访问的租户列表 */
  async getMyTenants(): Promise<TenantEntity[]> {
    return this.tenantRepo.getMyTenants();
  }

  /** hasTenantForApp 校验组织是否存在且已开通指定应用，用于登录前处理公开 org-id。 */
  async hasTenantForApp(code: string, appID: string): Promise<boolean> {
    return this.tenantRepo.hasTenantForApp(code, appID);
  }

  /** getTenantByCode 读取组织的基础公开信息，用于单组织场景初始化 logo 与组织上下文。 */
  async getTenantByCode(code: string): Promise<TenantEntity | null> {
    return this.tenantRepo.getTenantByCode(code);
  }

  /** getTenantForApp 读取已开通指定应用的公开组织信息，用于单组织品牌头像。 */
  async getTenantForApp(code: string, appID: string): Promise<TenantEntity | null> {
    return this.tenantRepo.getTenantForApp(code, appID);
  }

  async createTenant(data: { name: string; desc?: string; avatar?: string }): Promise<string> {
    return this.tenantRepo.createTenant(data);
  } 

  async joinTenantByCode(code: string): Promise<void> {
    return this.tenantRepo.joinTenantByCode(code);
  }

  async deleteTenant(code: string): Promise<void> {
    return this.tenantRepo.deleteTenant(code);
  }

  async getTenantDetail(code?: string): Promise<TenantEntity> {
    return this.tenantRepo.getTenantDetail(code);
  }

  async updateTenant(data: { code?: string; name?: string; desc?: string; avatar?: string }): Promise<void> {
    return this.tenantRepo.updateTenant(data);
  }

  /**
   * 切换租户 — 业务编排说明
   *
   * 实际的切换编排在 Provider 层完成，流程为：
   * 1. 调用后端接口切换租户上下文（若需要）
   * 2. 清空本地缓存 / 重置各 Provider 状态
   * 3. 重新拉取首页数据
   *
   * Service 层仅提供数据获取能力，不涉及状态管理。
   */
}

export const tenantService = new TenantService();
