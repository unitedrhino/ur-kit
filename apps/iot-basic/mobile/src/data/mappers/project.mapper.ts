import type { ProjectEntity } from '../../domain/entities/project.entity';
import type { GeoPoint } from '../../domain/models/location.model';

function toPoint(value: unknown): GeoPoint | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const latitude = Number(raw.latitude || 0);
  const longitude = Number(raw.longitude || 0);
  if (!latitude && !longitude) return undefined;
  return { latitude, longitude };
}

export class ProjectMapper {
  static toEntity(dto: Record<string, unknown>): ProjectEntity {
    return {
      projectID: String(dto.projectID || ''),
      projectName: String(dto.projectName || ''),
      tenantCode: String(dto.tenantCode || ''),
      adminUserID: String(dto.adminUserID || ''),
      address: String(dto.address || ''),
      position: toPoint(dto.position),
      projectImg: String(dto.projectImg || ''),
      desc: String(dto.desc || ''),
      status: Number(dto.status || 1),
      type: String(dto.type || ''),
      areaCount: Number(dto.areaCount || 0),
      userCount: Number(dto.userCount || 0),
      deviceCount: Number(dto.deviceCount || 0),
      deviceOnlineCount: Number(dto.deviceOnlineCount || 0),
      sort: Number(dto.sort || 0),
      createdTime: Number(dto.createdTime || 0),
    };
  }
}
