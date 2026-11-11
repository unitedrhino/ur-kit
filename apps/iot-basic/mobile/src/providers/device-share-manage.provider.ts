/** 全局分享管理状态：跨项目查看本人发出的关系与收到的设备，异步结果绑定账号及企业。 */
import { deviceShareService } from '../services/device-share.service';
import { deviceService } from '../services/device.service';
import type { DeviceShareEntity } from '../domain/entities/device-share.entity';
import type { DeviceEntity } from '../domain/entities/device.entity';
import { createPageState, type PageState } from '../domain/models/page-state.model';
import { authProvider } from './auth.provider';
import { tenantProvider } from './tenant.provider';

/** ShareManageMode 区分本人发出的分享关系和收到的共享设备。 */
export type ShareManageMode = 'sent' | 'received';
/** ShareManageState 保存当前分页、错误提示和两个方向的独立数据。 */
interface ShareManageState {
  mode: ShareManageMode;
  sent: DeviceShareEntity[];
  received: DeviceEntity[];
  pageState: PageState;
  error: string;
}

/** DeviceShareManageProvider 编排全局列表和撤销，禁止旧账号或旧企业响应覆盖新列表。 */
export class DeviceShareManageProvider {
  /** state 是当前列表和分页状态。 */
  private state: ShareManageState = { mode: 'sent', sent: [], received: [], pageState: createPageState(), error: '' };
  /** listeners 是页面订阅集合。 */
  private listeners = new Set<(state: ShareManageState) => void>();
  /** sequence 标记列表请求代次。 */
  private sequence = 0;
  /** constructor 注入两个业务服务，测试可替换服务边界。 */
  constructor(private readonly shares = deviceShareService, private readonly devices = deviceService) {}
  /** getState 返回当前状态。 */
  getState(): ShareManageState { return this.state; }
  /** subscribe 返回当前页面的取消订阅函数。 */
  subscribe(listener: (state: ShareManageState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /** update 合并状态并通知页面。 */
  private update(partial: Partial<ShareManageState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }
  /** contextKey 将请求绑定当前账号和企业。 */
  private contextKey(): string {
    return JSON.stringify([authProvider.getState().user?.userID, tenantProvider.getState().current?.code]);
  }
  /** reset 页面离开或账号切换时清空数据并使旧响应失效。 */
  reset(): void {
    this.sequence++;
    this.update({ sent: [], received: [], pageState: createPageState(), error: '' });
  }
  /** loadFirst 切换方向或刷新后重新查询第一页。 */
  async loadFirst(mode = this.state.mode): Promise<void> {
    this.reset();
    this.update({ mode });
    await this.loadPage(1);
  }
  /** loadMore 只在当前分页允许时追加下一页。 */
  async loadMore(): Promise<void> {
    if (this.state.pageState.loading || !this.state.pageState.hasMore) return;
    await this.loadPage(this.state.pageState.page + 1);
  }
  /** loadPage 读取指定页，错误保留重试入口，过期上下文响应直接丢弃。 */
  private async loadPage(page: number): Promise<void> {
    const sequence = this.sequence;
    const context = this.contextKey();
    const { mode, pageState } = this.state;
    this.update({ pageState: { ...pageState, loading: true }, error: '' });
    try {
      const result = mode === 'sent'
        ? await this.shares.getList(page, pageState.size)
        : await this.devices.getList({ page, size: pageState.size, sharedOnly: true });
      if (sequence !== this.sequence || context !== this.contextKey()) return;
      const items = page === 1 ? result.list : [...(mode === 'sent' ? this.state.sent : this.state.received), ...result.list];
      this.update({
        ...(mode === 'sent' ? { sent: items as DeviceShareEntity[] } : { received: items as DeviceEntity[] }),
        pageState: { ...pageState, page, loading: false, total: result.total, hasMore: page * pageState.size < result.total },
      });
    } catch (error) {
      if (sequence !== this.sequence || context !== this.contextKey()) return;
      this.update({ error: (error as Error).message || '加载分享失败', pageState: { ...pageState, loading: false } });
    }
  }
  /** remove 撤销本人发出的分享，并等待全局列表刷新。 */
  async remove(id: string): Promise<void> {
    await this.shares.remove(id);
    await this.loadFirst();
  }
}

/** deviceShareManageProvider 是全局分享页面使用的单例。 */
export const deviceShareManageProvider = new DeviceShareManageProvider();
