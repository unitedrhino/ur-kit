import type { CloneMemoryRecord, CloneMemoryProfile } from '../entities/clone-memory.entity';

export interface ICloneMemoryRepository {
  getMemoryRecords(
    cloneID: number,
    page?: number,
    pageSize?: number,
    startTime?: number,
    endTime?: number,
  ): Promise<{ list: CloneMemoryRecord[]; total: number }>;
  getMemoryProfile(cloneID: number): Promise<CloneMemoryProfile | null>;
}
