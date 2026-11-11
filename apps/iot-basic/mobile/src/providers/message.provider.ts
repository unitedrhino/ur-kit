/** 消息中心状态：统一管理列表、未读数、加载状态和可重试错误。 */
import { messageService } from '../services/message.service';
import type { MessageRecordEntity } from '../domain/entities/message.entity';
import { createPageState, type PageState } from '../domain/models/page-state.model';
import { eventBus } from '../utils/event-bus';

export interface MessageState {
  records: MessageRecordEntity[];
  pageState: PageState;
  unreadCount: number;
  filter: MessageFilter;
  error: string;
}

/** 消息列表筛选范围。 */
export type MessageFilter = 'all' | 'unread' | 'read';

class MessageProvider {
  private state: MessageState = this.initialState();
  private listeners = new Set<(state: MessageState) => void>();
  private initialized = false;

  /** 获取当前消息中心状态。 */
  getState(): MessageState { return this.state; }

  /** 订阅消息中心状态变化。 */
  subscribe(listener: (state: MessageState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 初始化退出登录清理，避免账号切换残留消息。 */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    eventBus.on('auth:logout', () => this.reset());
  }

  /** 首次加载消息列表和未读统计。 */
  async loadFirst(): Promise<void> {
    const pageState = createPageState();
    this.update({ pageState: { ...pageState, loading: true }, error: '' });
    try {
      const [list, statistics] = await Promise.all([
        messageService.getList(1, pageState.size, this.state.filter === 'all' ? undefined : this.state.filter === 'unread' ? 2 : 1),
        messageService.getStatistics(),
      ]);
      this.update({
        records: list.list,
        unreadCount: statistics.totalUnread,
        error: '',
        pageState: { ...pageState, loading: false, total: list.total, hasMore: list.list.length >= pageState.size },
      });
    } catch (error) {
      this.update({ error: error instanceof Error ? error.message : '消息加载失败，请重试', pageState: { ...pageState, loading: false } });
    }
  }

  /** 加载下一页消息。 */
  async loadMore(): Promise<void> {
    const { pageState, records } = this.state;
    if (pageState.loading || !pageState.hasMore) return;
    const page = pageState.page + 1;
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await messageService.getList(page, pageState.size, this.state.filter === 'all' ? undefined : this.state.filter === 'unread' ? 2 : 1);
      this.update({
        records: [...records, ...result.list],
        pageState: { ...pageState, page, loading: false, total: result.total, hasMore: result.list.length >= pageState.size },
      });
    } catch (error) {
      this.update({ error: error instanceof Error ? error.message : '消息加载失败，请重试', pageState: { ...pageState, loading: false } });
    }
  }

  /** 切换已读状态筛选并重新读取第一页。 */
  async setFilter(filter: MessageFilter): Promise<void> {
    if (this.state.filter === filter && !this.state.error) return;
    this.update({ filter });
    await this.loadFirst();
  }

  /** 将单条消息标记为已读，完成后刷新当前筛选结果。 */
  async markRead(id: string): Promise<void> {
    if (!id || !this.state.records.some((item) => item.id === id && item.isRead === 2)) return;
    try {
      await messageService.markRead([id]);
      await this.loadFirst();
    } catch (error) {
      this.update({ error: error instanceof Error ? error.message : '标记已读失败，请重试' });
    }
  }

  /** 将消息标记为已读并同步未读数量。 */
  async markAllRead(): Promise<void> {
    try {
      await messageService.markAllRead();
      await this.loadFirst();
    } catch (error) {
      this.update({ error: error instanceof Error ? error.message : '标记已读失败，请重试' });
    }
  }

  /** 退出登录时清空缓存。 */
  reset(): void {
    this.state = this.initialState();
    this.notify();
  }

  private initialState(): MessageState {
    return { records: [], pageState: createPageState(), unreadCount: 0, filter: 'all', error: '' };
  }

  private update(partial: Partial<MessageState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify(): void { this.listeners.forEach((listener) => listener(this.state)); }
}

export const messageProvider = new MessageProvider();
