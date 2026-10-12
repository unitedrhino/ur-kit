import type { CloneSession } from '../entities/clone-session.entity';
import type { CloneSessionMessage } from '../entities/clone-session-message.entity';

export interface ICloneSessionRepository {
  getSessions(
    cloneID: number,
    page?: number,
    pageSize?: number,
    startTime?: number,
    endTime?: number,
  ): Promise<{ list: CloneSession[]; total: number }>;

  getMessages(
    sessionID: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ list: CloneSessionMessage[]; total: number }>;
}
