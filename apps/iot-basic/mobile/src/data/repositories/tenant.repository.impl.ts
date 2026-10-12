import { request } from '../../utils/request';
import { config } from '../../config';
import type { ITenantRepository } from '../../domain/interfaces/tenant.repository';
import type { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantMapper } from '../mappers/tenant.mapper';

export class TenantRepositoryImpl implements ITenantRepository {
  /**
   * 获取当前用户所属的租户列表
   * API: POST /api/v1/system/user/self/tenant/get-list
   */
  async getMyTenants(): Promise<TenantEntity[]> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/tenant/get-list',
      data: { page: { page: 1, size: 100 } },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(
      TenantMapper.fromUserTenant,
    );
    return list;
  }

  /** hasTenantForApp 通过公开租户核心接口校验组织是否已开通当前应用。 */
  async hasTenantForApp(code: string, appID: string): Promise<boolean> {
    return !!(await this.getTenantForApp(code, appID));
  }

  /** getTenantByCode 通过组织 code 或 id 查询租户基础公开信息，不依赖 appID。 */
  async getTenantByCode(code: string): Promise<TenantEntity | null> {
    const resp = await request<{ list?: Record<string, unknown>[] }>({
      baseUrl: config.tenantApiBaseUrl,
      url: '/api/v1/system/tenant/core/get-list',
      data: {
        code,
        page: { page: 1, size: 1 },
      },
    });

    const list = Array.isArray(resp.list) ? resp.list : [];
    const normalized = code.trim();
    const target = list.find((item) => String(item.code || item.id || '').trim() === normalized);
    return this.mapPublicTenant(target);
  }

  /** getTenantForApp 通过公开租户核心接口读取已开通当前应用的组织信息。 */
  async getTenantForApp(code: string, appID: string): Promise<TenantEntity | null> {
    const directResp = await request<{ list?: Record<string, unknown>[] }>({
      url: '/api/v1/system/tenant/core/get-list',
      data: {
        code,
        appID,
        page: { page: 1, size: 1 },
      },
    });
    const direct = this.mapPublicTenant(Array.isArray(directResp.list) ? directResp.list[0] : undefined);
    if (direct) return direct;

    const listResp = await request<{ list?: Record<string, unknown>[] }>({
      url: '/api/v1/system/tenant/core/get-list',
      data: {
        appID,
        page: { page: 1, size: 200 },
      },
    });
    const matched = (listResp.list || []).find((item) => String(item.id || '') === code || String(item.code || '') === code);
    return this.mapPublicTenant(matched);
  }

  /** mapPublicTenant 映射公开组织接口返回，兼容单组织配置填 code 或 id。 */
  private mapPublicTenant(item?: Record<string, unknown>): TenantEntity | null {
    if (!item) return null;
    const tenant = (item.tenant || item) as Record<string, unknown>;
    return TenantMapper.toEntity({
      ...tenant,
      code: item.code || tenant.code,
    });
  }

  async createTenant(data: { name: string; desc?: string; avatar?: string }): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/tenant/info/create',
      data: {
        name: data.name,
        desc: data.desc || undefined,
        avatar: data.avatar || undefined,
      },
    });
    return String(resp.code || '');
  }

  async joinTenantByCode(code: string): Promise<void> {
    await request({
      url: '/api/v1/system/user/self/tenant/join',
      data: {
        code,
        method: 'code',
      },
    });
  }

  async deleteTenant(code: string): Promise<void> {
    await request({
      url: '/api/v1/system/tenant/info/delete',
      data: { code },
    });
  }

  async getTenantDetail(code?: string): Promise<TenantEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/tenant/info/get-one',
      data: code ? { code } : {},
    });
    return TenantMapper.toEntity(resp);
  }

  async updateTenant(data: { code?: string; name?: string; desc?: string; avatar?: string }): Promise<void> {
    await request({
      url: '/api/v1/system/tenant/info/update',
      data: {
        code: data.code || undefined,
        name: data.name || undefined,
        desc: data.desc || undefined,
        avatar: data.avatar || undefined,
      },
    });
  }
}
