import { deviceService } from '../services/device.service';
import type { DeviceEntity } from '../domain/entities/device.entity';
import type { DeviceListParams } from '../domain/interfaces/device.repository';
import { createPageState, type PageState } from '../domain/models/page-state.model';
import { eventBus } from '../utils/event-bus';
import { realtimeService } from '../services/realtime.service';
import { currentFamilyProvider, type CurrentFamilyState } from './current-family.provider';

export interface DeviceListState {
  list: DeviceEntity[];
  pageState: PageState;
}

class DeviceListProvider {
  private state: DeviceListState = {
    list: [],
    pageState: createPageState(),
  };
  private listeners: Set<(s: DeviceListState) => void> = new Set();
  private filter: Partial<DeviceListParams> = {};
  /** initialized 防止登录恢复与登录成功回调重复注册监听。 */
  private initialized = false;
  /** 当前设备列表对应的组织与家庭上下文。 */
  private currentContextKey = '';
  /** loadedContextKey 记录已完成加载的上下文，避免同一家庭重复自动刷新。 */
  private loadedContextKey = '';
  /** 当前已订阅的 device.conn.* 频道，用于 loadFirst 时清理旧订阅 */
  private connChannels = new Set<string>();

  getState(): DeviceListState {
    return this.state;
  }

  subscribe(listener: (s: DeviceListState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private update(partial: Partial<DeviceListState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  setFilter(filter: Partial<DeviceListParams>): void {
    this.filter = filter;
  }

  /** getFamilyContextKey 生成设备列表缓存所属的组织/家庭标识。 */
  private getFamilyContextKey(state = currentFamilyProvider.getState()): string {
    if (!state.currentTenantCode || !state.projectID) return '';
    return `${state.currentTenantCode}:${state.projectID}`;
  }

  /** resetForContext 切换设备列表所属上下文并清空旧列表与实时订阅。 */
  private resetForContext(contextKey: string): void {
    this.unsubscribeAllConn();
    this.currentContextKey = contextKey;
    this.loadedContextKey = '';
    this.filter = {};
    this.state = { list: [], pageState: createPageState() };
    this.notify();
  }

  /** handleFamilyChange 在家庭上下文变化后由 Provider 统一刷新设备列表。 */
  private handleFamilyChange(state: CurrentFamilyState): void {
    const contextKey = this.getFamilyContextKey(state);
    if (!contextKey) {
      if (this.currentContextKey || this.state.list.length > 0) {
        this.resetForContext('');
      }
      return;
    }
    if (contextKey !== this.currentContextKey) {
      this.resetForContext(contextKey);
    }
    if (this.loadedContextKey !== contextKey && !this.state.pageState.loading) {
      void this.loadFirst();
    }
  }

  /** 取消所有已订阅的 device.conn.* 频道 */
  private unsubscribeAllConn(): void {
    for (const ch of this.connChannels) {
      realtimeService.unsubscribe(ch);
    }
    this.connChannels.clear();
  }

  /** 为指定设备列表订阅 device.conn.* 频道（跳过已订阅的） */
  private subscribeConnChannels(devices: DeviceEntity[]): void {
    for (const d of devices) {
      const ch = `device.conn.${d.productID}.${d.deviceName}`;
      if (!this.connChannels.has(ch)) {
        this.connChannels.add(ch);
        realtimeService.subscribe(ch);
      }
    }
  }

  async loadFirst(): Promise<void> {
    const contextKey = this.getFamilyContextKey();
    if (!contextKey) {
      this.resetForContext('');
      return;
    }
    if (contextKey !== this.currentContextKey) {
      this.resetForContext(contextKey);
    }
    if (this.state.pageState.loading) return;
    const ps = createPageState();
    this.update({ pageState: { ...ps, loading: true } });
    try {
      const result = await deviceService.getList({ page: 1, size: ps.size, ...this.filter });
      this.loadedContextKey = contextKey;
      this.update({
        list: result.list,
        pageState: { ...ps, loading: false, total: result.total, hasMore: result.list.length >= ps.size },
      });
      // 重置订阅：取消旧列表所有 conn 频道，订阅新列表
      this.unsubscribeAllConn();
      this.subscribeConnChannels(result.list);
    } catch {
      this.update({ pageState: { ...ps, loading: false } });
    }
  }

  async loadMore(): Promise<void> {
    const contextKey = this.getFamilyContextKey();
    if (!contextKey) return;
    if (contextKey !== this.currentContextKey) {
      await this.loadFirst();
      return;
    }
    const { pageState, list } = this.state;
    if (pageState.loading || !pageState.hasMore) return;
    const nextPage = pageState.page + 1;
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await deviceService.getList({ page: nextPage, size: pageState.size, ...this.filter });
      this.update({
        list: [...list, ...result.list],
        pageState: { ...pageState, loading: false, page: nextPage, total: result.total, hasMore: result.list.length >= pageState.size },
      });
      // 追加订阅新加载的设备
      this.subscribeConnChannels(result.list);
    } catch {
      this.update({ pageState: { ...pageState, loading: false } });
    }
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    eventBus.on('ws:device.status', (data: unknown) => {
      const d = data as { productID: string; deviceName: string; status: number };
      this.update({
        list: this.state.list.map((item) =>
          item.productID === d.productID && item.deviceName === d.deviceName
            ? { ...item, status: d.status }
            : item,
        ),
      });
    });
    eventBus.on('auth:logout', () => this.reset());
    currentFamilyProvider.subscribe((state) => this.handleFamilyChange(state));
    this.handleFamilyChange(currentFamilyProvider.getState());
  }

  /** 退出登录时清空内存中的设备列表与订阅，避免泄漏到下一个用户 */
  reset(): void {
    this.unsubscribeAllConn();
    this.filter = {};
    this.currentContextKey = '';
    this.loadedContextKey = '';
    this.state = { list: [], pageState: createPageState() };
    this.notify();
  }
}

export const deviceListProvider = new DeviceListProvider();
