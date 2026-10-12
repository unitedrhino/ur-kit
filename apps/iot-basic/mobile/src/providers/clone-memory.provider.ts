import { cloneMemoryService } from '../services/clone-memory.service';
import type { CloneSession } from '../domain/entities/clone-session.entity';
import type { CloneMemoryRecord, CloneMemoryProfile } from '../domain/entities/clone-memory.entity';
import type { CloneSessionMessage } from '../domain/entities/clone-session-message.entity';

export interface CloneMemoryState {
  activeTab: 'session' | 'memory';
  cloneID: number;
  sessions: CloneSession[];
  sessionsLoading: boolean;
  sessionsTotal: number;
  sessionsPage: number;
  sessionStartTime: number | null;
  sessionEndTime: number | null;
  memoryProfile: CloneMemoryProfile | null;
  memoryRecords: CloneMemoryRecord[];
  memoryLoading: boolean;
  memoryTotal: number;
  memoryPage: number;
  memoryStartTime: number | null;
  memoryEndTime: number | null;
  sessionMessages: CloneSessionMessage[];
  sessionMessagesLoading: boolean;
  sessionMessagesTotal: number;
  sessionMessagesPage: number;
  currentSessionID: string | null;
}

function initialState(): CloneMemoryState {
  return {
    activeTab: 'session',
    cloneID: 0,
    sessions: [],
    sessionsLoading: false,
    sessionsTotal: 0,
    sessionsPage: 0,
    sessionStartTime: null,
    sessionEndTime: null,
    memoryProfile: null,
    memoryRecords: [],
    memoryLoading: false,
    memoryTotal: 0,
    memoryPage: 0,
    memoryStartTime: null,
    memoryEndTime: null,
    sessionMessages: [],
    sessionMessagesLoading: false,
    sessionMessagesTotal: 0,
    sessionMessagesPage: 0,
    currentSessionID: null,
  };
}

class CloneMemoryProvider {
  private state: CloneMemoryState = initialState();
  private listeners: Set<(s: CloneMemoryState) => void> = new Set();

  getState(): CloneMemoryState {
    return this.state;
  }

  subscribe(listener: (s: CloneMemoryState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private update(partial: Partial<CloneMemoryState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  init(cloneID: number): void {
    this.state = {
      ...initialState(),
      cloneID,
    };
    this.notify();
    void this.loadSessions(1);
  }

  switchTab(tab: 'session' | 'memory'): void {
    if (tab === this.state.activeTab) return;
    this.update({ activeTab: tab });
    if (tab === 'session' && this.state.sessionsPage === 0) {
      void this.loadSessions(1);
    } else if (tab === 'memory' && this.state.memoryPage === 0) {
      void this.loadMemory(1);
    }
  }

  setSessionDateRange(startTime: number | null, endTime: number | null): void {
    this.update({ sessionStartTime: startTime, sessionEndTime: endTime, sessionsPage: 0 });
    void this.loadSessions(1);
  }

  clearSessionDateRange(): void {
    this.update({ sessionStartTime: null, sessionEndTime: null, sessionsPage: 0 });
    void this.loadSessions(1);
  }

  async loadSessions(page: number): Promise<void> {
    this.update({ sessionsLoading: true });
    try {
      const result = await cloneMemoryService.getSessionsByCloneID(
        this.state.cloneID,
        page,
        20,
        this.state.sessionStartTime ?? undefined,
        this.state.sessionEndTime ?? undefined,
      );
      const sessions = page === 1 ? result.list : [...this.state.sessions, ...result.list];
      this.update({
        sessions,
        sessionsTotal: result.total,
        sessionsPage: page,
        sessionsLoading: false,
      });
    } catch {
      this.update({ sessionsLoading: false });
    }
  }

  loadMoreSessions(): void {
    const { sessionsLoading, sessionsTotal, sessions, sessionsPage } = this.state;
    if (sessionsLoading || sessions.length >= sessionsTotal) return;
    void this.loadSessions(sessionsPage + 1);
  }

  setMemoryDateRange(startTime: number | null, endTime: number | null): void {
    this.update({ memoryStartTime: startTime, memoryEndTime: endTime, memoryPage: 0 });
    void this.loadMemory(1);
  }

  clearMemoryDateRange(): void {
    this.update({ memoryStartTime: null, memoryEndTime: null, memoryPage: 0 });
    void this.loadMemory(1);
  }

  async loadMemory(page: number): Promise<void> {
    this.update({ memoryLoading: true });
    try {
      const [recordsRes, profile] = await Promise.all([
        cloneMemoryService.getMemoryRecordsPaginated(
          this.state.cloneID,
          page,
          20,
          this.state.memoryStartTime ?? undefined,
          this.state.memoryEndTime ?? undefined,
        ),
        page === 1
          ? cloneMemoryService.getMemoryByCloneID(
              this.state.cloneID,
              this.state.memoryStartTime ?? undefined,
              this.state.memoryEndTime ?? undefined,
            ).then((r) => r.profile)
          : Promise.resolve(this.state.memoryProfile),
      ]);
      const memoryRecords = page === 1 ? recordsRes.list : [...this.state.memoryRecords, ...recordsRes.list];
      this.update({
        memoryProfile: profile,
        memoryRecords,
        memoryTotal: recordsRes.total,
        memoryPage: page,
        memoryLoading: false,
      });
    } catch {
      this.update({ memoryLoading: false });
    }
  }

  loadMoreMemory(): void {
    const { memoryLoading, memoryTotal, memoryRecords, memoryPage } = this.state;
    if (memoryLoading || memoryRecords.length >= memoryTotal) return;
    void this.loadMemory(memoryPage + 1);
  }

  async loadSessionMessages(sessionID: string, page: number): Promise<void> {
    this.update({ sessionMessagesLoading: true, currentSessionID: sessionID });
    try {
      const result = await cloneMemoryService.getSessionMessages(sessionID, page, 20);
      const sessionMessages =
        page === 1 ? result.list : [...this.state.sessionMessages, ...result.list];
      this.update({
        sessionMessages,
        sessionMessagesTotal: result.total,
        sessionMessagesPage: page,
        sessionMessagesLoading: false,
      });
    } catch {
      this.update({ sessionMessagesLoading: false });
    }
  }

  loadMoreSessionMessages(): void {
    const {
      sessionMessagesLoading,
      sessionMessagesTotal,
      sessionMessages,
      sessionMessagesPage,
      currentSessionID,
    } = this.state;
    if (!currentSessionID || sessionMessagesLoading || sessionMessages.length >= sessionMessagesTotal) {
      return;
    }
    void this.loadSessionMessages(currentSessionID, sessionMessagesPage + 1);
  }

  clearSessionMessages(): void {
    this.update({
      sessionMessages: [],
      sessionMessagesLoading: false,
      sessionMessagesTotal: 0,
      sessionMessagesPage: 0,
      currentSessionID: null,
    });
  }

  clear(): void {
    this.state = initialState();
    this.notify();
  }
}

export const cloneMemoryProvider = new CloneMemoryProvider();
