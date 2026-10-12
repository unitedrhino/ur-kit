import type { AreaEntity } from '../../domain/entities/area.entity';

export class AreaMapper {
  static toEntity(dto: Record<string, unknown>): AreaEntity {
    return {
      areaID: String(dto.areaID || ''),
      projectID: String(dto.projectID || ''),
      parentAreaID: String(dto.parentAreaID || ''),
      areaName: String(dto.areaName || ''),
      areaImg: String(dto.areaImg || ''),
      desc: String(dto.desc || ''),
      deviceCount: Number(dto.deviceCount || 0),
      lowerLevelCount: Number(dto.lowerLevelCount || 0),
      isLeaf: Number(dto.isLeaf || 0),
      sort: Number(dto.sort || 0),
      createdTime: Number(dto.createdTime || 0),
    };
  }
}
