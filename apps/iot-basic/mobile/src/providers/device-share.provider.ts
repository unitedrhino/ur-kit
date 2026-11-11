import { deviceShareService } from '../services/device-share.service';
import type { DeviceShareEntity, DeviceShareUser } from '../domain/entities/device-share.entity';
import { createPageState, type PageState } from '../domain/models/page-state.model';

export interface DeviceShareState {
  /** 当前设备的分享记录。 */
  list: DeviceShareEntity[];
  /** 列表分页状态。 */
  pageState: PageState;
  /** 当前设备标识。 */
  productID: string;
  deviceName: string;
  /** 用户搜索结果。 */
  searchedUser: DeviceShareUser | null;
  /** 用户搜索是否正在进行。 */
  searchingUser: boolean;
}

class DeviceShareProvider {
  private state: DeviceShareState = {
    list: [],
    pageState: createPageState(),
    productID: '',
    deviceName: '',
    searchedUser: null,
    searchingUser: false,
  };

  private listeners: Set<(state: DeviceShareState) => void> = new Set();

  /** 获取当前分享状态。 */
  getState(): DeviceShareState {
    return this.state;
  }

  /** 订阅状态变化并返回取消订阅函数。 */
  subscribe(listener: (state: DeviceShareState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private update(partial: Partial<DeviceShareState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /** 设置当前设备并清除上一个设备的分页数据。 */
  setDevice(productID: string, deviceName: string): void {
    this.update({ productID, deviceName, list: [], pageState: createPageState(), searchedUser: null });
  }

  /** 加载第一页分享记录。 */
  async loadFirst(): Promise<void> {
    const pageState = createPageState();
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await deviceShareService.getList(
        1,
        pageState.size,
        this.state.productID,
        this.state.deviceName,
      );
      this.update({
        list: result.list,
        pageState: {
          ...pageState,
          loading: false,
          total: result.total,
          hasMore: result.list.length >= pageState.size,
        },
      });
    } catch {
      this.update({ pageState: { ...pageState, loading: false } });
    }
  }

  /** 加载下一页分享记录。 */
  async loadMore(): Promise<void> {
    const { pageState, list } = this.state;
    if (pageState.loading || !pageState.hasMore) return;
    const nextPage = pageState.page + 1;
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await deviceShareService.getList(nextPage, pageState.size, this.state.productID, this.state.deviceName);
      this.update({
        list: [...list, ...result.list],
        pageState: {
          ...pageState,
          loading: false,
          page: nextPage,
          total: result.total,
          hasMore: result.list.length >= pageState.size,
        },
      });
    } catch {
      this.update({ pageState: { ...pageState, loading: false } });
    }
  }

  /** 搜索分享对象，空账号会清空上一次结果。 */
  async searchUser(account: string): Promise<DeviceShareUser | null> {
    if (!account.trim()) {
      this.update({ searchedUser: null, searchingUser: false });
      return null;
    }
    this.update({ searchingUser: true });
    try {
      const user = await deviceShareService.searchUser(account, this.state.productID, this.state.deviceName);
      this.update({ searchedUser: user, searchingUser: false });
      return user;
    } catch {
      this.update({ searchedUser: null, searchingUser: false });
      return null;
    }
  }

  /** 创建分享并等待列表回刷。 */
  async create(data: {
    sharedUserID: string;
    authType: number;
    schemaPerm?: Record<string, { perm: number }>;
    accessPerm?: Record<string, { perm: number }>;
    expTime?: string;
  }): Promise<void> {
    await deviceShareService.create({ ...data, productID: this.state.productID, deviceName: this.state.deviceName });
    await this.loadFirst();
  }

  /** 删除分享并等待列表回刷。 */
  async remove(id: string): Promise<void> {
    await deviceShareService.remove(id);
    await this.loadFirst();
  }
}

export const deviceShareProvider = new DeviceShareProvider();
