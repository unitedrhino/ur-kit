import { alarmService } from '../services/alarm.service';
import type { AlarmRecordEntity } from '../domain/entities/alarm.entity';
import type { AlarmFilterModel } from '../domain/models/alarm-filter.model';
import { createPageState, type PageState } from '../domain/models/page-state.model';
import { eventBus } from '../utils/event-bus';

export interface AlarmState {
  records: AlarmRecordEntity[];
  pageState: PageState;
  unreadCount: number;
  filter: AlarmFilterModel;
}

class AlarmProvider {
  private state: AlarmState = {
    records: [],
    pageState: createPageState(),
    unreadCount: 0,
    filter: {},
  };
  private listeners: Set<(s: AlarmState) => void> = new Set();

  getState(): AlarmState { return this.state; }

  subscribe(listener: (s: AlarmState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void { this.listeners.forEach((fn) => fn(this.state)); }

  private update(partial: Partial<AlarmState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  setFilter(filter: AlarmFilterModel): void {
    this.update({ filter });
  }

  async loadFirst(): Promise<void> {
    const ps = createPageState();
    this.update({ pageState: { ...ps, loading: true } });
    try {
      const result = await alarmService.getRecordList(1, ps.size, this.state.filter);
      this.update({
        records: result.list,
        pageState: { ...ps, loading: false, total: result.total, hasMore: result.list.length >= ps.size },
      });
    } catch {
      this.update({ pageState: { ...ps, loading: false } });
    }
  }

  async loadMore(): Promise<void> {
    const { pageState, records } = this.state;
    if (pageState.loading || !pageState.hasMore) return;
    const next = pageState.page + 1;
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await alarmService.getRecordList(next, pageState.size, this.state.filter);
      this.update({
        records: [...records, ...result.list],
        pageState: { ...pageState, loading: false, page: next, total: result.total, hasMore: result.list.length >= pageState.size },
      });
    } catch {
      this.update({ pageState: { ...pageState, loading: false } });
    }
  }

  init(): void {
    eventBus.on('ws:alarm.trigger', () => {
      this.update({ unreadCount: this.state.unreadCount + 1 });
    });
    eventBus.on('auth:logout', () => this.reset());
  }

  /** 退出登录时清空告警内存缓存 */
  reset(): void {
    this.state = {
      records: [],
      pageState: createPageState(),
      unreadCount: 0,
      filter: {},
    };
    this.notify();
  }

  clearUnread(): void {
    this.update({ unreadCount: 0 });
  }
}

export const alarmProvider = new AlarmProvider();
