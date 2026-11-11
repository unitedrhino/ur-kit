/** 区域映射：优先读取客户端图标标签，兼容后端既有图片地址。 */
import type { AreaEntity } from '../../domain/entities/area.entity';

export class AreaMapper {
  /** toEntity 统一字符串ID，并保留系统区域标识和图标标签。 */
  static toEntity(dto: Record<string, unknown>): AreaEntity {
    return {
      isSysCreated: Number(dto.isSysCreated || 0),
      areaID: String(dto.areaID || ''),
      projectID: String(dto.projectID || ''),
      parentAreaID: String(dto.parentAreaID || ''),
      areaName: String(dto.areaName || ''),
      areaImg: String((dto.tags as Record<string, string> | undefined)?.clientIcon || dto.areaImg || ''),
      tags: (dto.tags || {}) as Record<string, string>,
      desc: String(dto.desc || ''),
      deviceCount: Number(dto.deviceCount || 0),
      lowerLevelCount: Number(dto.lowerLevelCount || 0),
      isLeaf: Number(dto.isLeaf || 0),
      sort: Number(dto.sort || 0),
      createdTime: Number(dto.createdTime || 0),
    };
  }
}
