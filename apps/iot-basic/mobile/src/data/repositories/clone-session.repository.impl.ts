import { request } from '../../utils/request';
import type { CloneSession } from '../../domain/entities/clone-session.entity';
import type { CloneSessionMessage } from '../../domain/entities/clone-session-message.entity';
import type { ICloneSessionRepository } from '../../domain/interfaces/clone-session.repository';

function toSession(dto: Record<string, unknown>): CloneSession {
  return {
    sessionID: String(dto.sessionID || ''),
    title: dto.title ? String(dto.title) : undefined,
    channel: dto.channel ? String(dto.channel) : undefined,
    turnCount: dto.turnCount ? Number(dto.turnCount) : undefined,
    lastActiveAt: dto.lastActiveAt ? Number(dto.lastActiveAt) : undefined,
    status: dto.status ? Number(dto.status) : undefined,
    createdTime: dto.createdTime ? Number(dto.createdTime) : undefined,
  };
}

function toMessage(dto: Record<string, unknown>): CloneSessionMessage {
  return {
    turnIndex: dto.turnIndex !== undefined ? Number(dto.turnIndex) : undefined,
    userInput: dto.userInput ? String(dto.userInput) : undefined,
    aiResponse: dto.aiResponse ? String(dto.aiResponse) : undefined,
    summary: dto.summary ? String(dto.summary) : undefined,
    keyTopics: dto.keyTopics ? String(dto.keyTopics) : undefined,
  };
}

export class CloneSessionRepositoryImpl implements ICloneSessionRepository {
  async getSessions(
    cloneID: number,
    page = 1,
    pageSize = 20,
    startTime?: number,
    endTime?: number,
  ): Promise<{ list: CloneSession[]; total: number }> {
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
      url: '/api/v1/ai/session/get-list',
      data,
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(toSession);
    return { list, total: Number(resp.total || 0) };
  }

  async getMessages(
    sessionID: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ list: CloneSessionMessage[]; total: number }> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/ai/session/messages',
      data: {
        sessionID,
        page: { page, size: pageSize },
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(toMessage);
    return { list, total: Number(resp.total || 0) };
  }
}
