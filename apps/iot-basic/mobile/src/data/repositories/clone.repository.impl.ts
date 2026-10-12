/**
 * Clone 仓储实现
 */

import { request } from '../../utils/request';
import type { CloneEntity } from '../../domain/entities/clone.entity';
import type {
  ICloneRepository,
  CloneFilter,
  CloneListResult,
} from '../../domain/interfaces/clone.repository';

/**
 * DTO 转实体
 */
function toEntity(dto: Record<string, unknown>): CloneEntity {
  return {
    id: Number(dto.id || 0),
    tenantCode: String(dto.tenantCode || ''),
    agentID: Number(dto.agentID || 0),
    cloneGroupID: Number(dto.cloneGroupID || 0),
    code: String(dto.code || ''),
    name: String(dto.name || ''),
    desc: String(dto.desc || ''),
    personaPrompt: String(dto.personaPrompt || ''),
    metadata: String(dto.metadata || ''),
    status: Number(dto.status || 1),
    createdTime: Number(dto.createdTime || 0),
    updatedTime: Number(dto.updatedTime || 0),
  };
}

/**
 * Clone 仓储实现
 */
export class CloneRepositoryImpl implements ICloneRepository {
  async getList(
    filter: CloneFilter,
    page = 1,
    pageSize = 20,
  ): Promise<CloneListResult> {
    const data: Record<string, unknown> = {
      page: { page, size: pageSize },
    };

    if (filter.cloneGroupID) {
      data.cloneGroupID = filter.cloneGroupID;
    }
    if (filter.agentID) {
      data.agentID = filter.agentID;
    }
    if (filter.name) {
      data.name = filter.name;
    }
    if (filter.status !== undefined) {
      data.status = filter.status;
    }
    if (filter.code) {
      data.code = filter.code;
    }

    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/ai/clone/get-list',
      data,
    });

    const list = ((resp.list || []) as Record<string, unknown>[]).map(toEntity);
    return {
      list,
      total: Number(resp.total || 0),
    };
  }
}
