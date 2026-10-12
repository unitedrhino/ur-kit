/**
 * CloneGroup 仓储实现
 */

import { request } from '../../utils/request';
import type { CloneGroupEntity } from '../../domain/entities/clone-group.entity';
import type {
  ICloneGroupRepository,
  CloneGroupFilter,
  CloneGroupListResult,
} from '../../domain/interfaces/clone-group.repository';

/**
 * DTO 转实体
 */
function toEntity(dto: Record<string, unknown>): CloneGroupEntity {
  return {
    id: Number(dto.id || 0),
    tenantCode: String(dto.tenantCode || ''),
    agentGroupID: Number(dto.agentGroupID || 0),
    thirdID: String(dto.thirdID || ''),
    code: String(dto.code || ''),
    name: String(dto.name || ''),
    description: String(dto.description || ''),
    ttsConfigID: String(dto.ttsConfigID || ''),
    isDefault: Number(dto.isDefault || 2),
    status: Number(dto.status || 1),
    createdTime: Number(dto.createdTime || 0),
    updatedTime: Number(dto.updatedTime || 0),
  };
}

/**
 * CloneGroup 仓储实现
 */
export class CloneGroupRepositoryImpl implements ICloneGroupRepository {
  async getList(
    filter: CloneGroupFilter,
    page = 1,
    pageSize = 20,
  ): Promise<CloneGroupListResult> {
    const data: Record<string, unknown> = {
      page: { page, size: pageSize },
    };

    if (filter.agentGroupID) {
      data.agentGroupID = filter.agentGroupID;
    }
    if (filter.thirdID) {
      data.thirdID = filter.thirdID;
    }
    if (filter.name) {
      data.name = filter.name;
    }
    if (filter.status !== undefined) {
      data.status = filter.status;
    }

    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/ai/clone-group/get-list',
      data,
    });

    const list = ((resp.list || []) as Record<string, unknown>[]).map(toEntity);
    return {
      list,
      total: Number(resp.total || 0),
    };
  }
}
