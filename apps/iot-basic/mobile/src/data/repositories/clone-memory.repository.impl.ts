import { request } from '../../utils/request';
import type {
  CloneMemoryRecord,
  CloneMemoryProfile,
} from '../../domain/entities/clone-memory.entity';
import type { ICloneMemoryRepository } from '../../domain/interfaces/clone-memory.repository';

function toRecord(dto: Record<string, unknown>): CloneMemoryRecord {
  return {
    id: Number(dto.id || 0),
    memoryLevel: String(dto.memoryLevel || ''),
    memoryKind: String(dto.memoryKind || ''),
    summary: dto.summary ? String(dto.summary) : undefined,
    content: dto.content ? String(dto.content) : undefined,
    importance: Number(dto.importance || 0),
    updatedTime: dto.updatedTime ? Number(dto.updatedTime) : undefined,
  };
}

function toProfile(dto: Record<string, unknown>): CloneMemoryProfile {
  return {
    profileText: dto.profileText ? String(dto.profileText) : undefined,
    updatedTime: dto.updatedTime ? Number(dto.updatedTime) : undefined,
  };
}

export class CloneMemoryRepositoryImpl implements ICloneMemoryRepository {
  async getMemoryRecords(
    cloneID: number,
    page = 1,
    pageSize = 10,
    startTime?: number,
    endTime?: number,
  ): Promise<{ list: CloneMemoryRecord[]; total: number }> {
    const data: Record<string, unknown> = {
      cloneID,
      page: { page, size: pageSize },
    };
    if (startTime !== undefined && startTime > 0) {
      data.startTime = startTime;
    }
    if (endTime !== undefined && endTime > 0) {
      data.endTime = endTime;
    }
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/ai/clone/memory/records/get-list',
      data,
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(toRecord);
    return { list, total: Number(resp.total || 0) };
  }

  async getMemoryProfile(cloneID: number): Promise<CloneMemoryProfile | null> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/ai/clone/memory/profile/get-one',
      data: { cloneID },
    });
    if (!resp || Object.keys(resp).length === 0) {
      return null;
    }
    return toProfile(resp);
  }
}
