import type { TenantEntity } from '../../domain/entities/tenant.entity';

export class TenantMapper {
  static toEntity(dto: Record<string, unknown>): TenantEntity {
    return {
      id: String(dto.id || ''),
      code: String(dto.code || ''),
      name: String(dto.name || ''),
      avatar: String(dto.avatar || ''),
      status: Number(dto.status || 1),
      desc: String(dto.desc || ''),
      isOwner: Number(dto.isTenantOwner || 0) === 1,
    };
  }

  /** 从 UserTenant 响应结构映射为 TenantEntity */
  static fromUserTenant(dto: Record<string, unknown>): TenantEntity {
    const tenant = (dto.tenant || {}) as Record<string, unknown>;
    return {
      id: String(tenant.id || ''),
      code: String(dto.tenantCode || tenant.code || ''),
      name: String(tenant.name || ''),
      avatar: String(tenant.avatar || ''),
      status: Number(dto.status || 1),
      desc: String(tenant.desc || ''),
      isOwner: Number(dto.isTenantOwner || 0) === 1,
    };
  }
}
