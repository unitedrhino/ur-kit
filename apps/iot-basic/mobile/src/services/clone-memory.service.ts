import { CloneMemoryRepositoryImpl } from '../data/repositories/clone-memory.repository.impl';
import { CloneSessionRepositoryImpl } from '../data/repositories/clone-session.repository.impl';
import type { ICloneMemoryRepository } from '../domain/interfaces/clone-memory.repository';
import type { ICloneSessionRepository } from '../domain/interfaces/clone-session.repository';
import type { CloneMemoryRecord, CloneMemoryProfile } from '../domain/entities/clone-memory.entity';
import type { CloneSession } from '../domain/entities/clone-session.entity';
import type { CloneSessionMessage } from '../domain/entities/clone-session-message.entity';

export interface CloneMemoryResult {
  records: CloneMemoryRecord[];
  profile: CloneMemoryProfile | null;
  total: number;
}

export class CloneMemoryService {
  constructor(
    private readonly cloneMemoryRepo: ICloneMemoryRepository = new CloneMemoryRepositoryImpl(),
    private readonly cloneSessionRepo: ICloneSessionRepository = new CloneSessionRepositoryImpl(),
  ) {}

  async getMemoryByCloneID(
    cloneID: number,
    startTime?: number,
    endTime?: number,
  ): Promise<CloneMemoryResult> {
    const [recordsRes, profile] = await Promise.all([
      this.cloneMemoryRepo.getMemoryRecords(cloneID, 1, 10, startTime, endTime),
      this.cloneMemoryRepo.getMemoryProfile(cloneID),
    ]);
    return {
      records: recordsRes.list,
      profile,
      total: recordsRes.total,
    };
  }

  async getSessionsByCloneID(
    cloneID: number,
    page = 1,
    pageSize = 20,
    startTime?: number,
    endTime?: number,
  ): Promise<{ list: CloneSession[]; total: number }> {
    return this.cloneSessionRepo.getSessions(cloneID, page, pageSize, startTime, endTime);
  }

  async getMemoryRecordsPaginated(
    cloneID: number,
    page = 1,
    pageSize = 20,
    startTime?: number,
    endTime?: number,
  ): Promise<{ list: CloneMemoryRecord[]; total: number }> {
    return this.cloneMemoryRepo.getMemoryRecords(cloneID, page, pageSize, startTime, endTime);
  }

  async getSessionMessages(
    sessionID: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ list: CloneSessionMessage[]; total: number }> {
    return this.cloneSessionRepo.getMessages(sessionID, page, pageSize);
  }
}

export const cloneMemoryService = new CloneMemoryService();
