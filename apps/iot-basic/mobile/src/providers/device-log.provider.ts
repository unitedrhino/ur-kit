/**
 * 设备日志 Provider：维护日志页 tab、时间范围、分页、日期展开和条目详情状态。
 */

import { deviceLogService } from '../services/device-log.service';
import type {
  DeviceLogDateGroup,
  DeviceLogTabKey,
  DeviceLogTimelineItem,
  DeviceLogTimePreset,
  DeviceLogTimeRange,
} from '../domain/models/device-log.model';
import {
  createDeviceLogTimeRangeFromDates,
  createDeviceLogTimeRangeFromPreset,
  groupDeviceLogTimelineItems,
  mergeAndSortDeviceLogItems,
} from '../domain/models/device-log.model';

const PAGE_SIZE = 20;

/** DeviceLogState 是设备日志页订阅的完整状态。 */
export interface DeviceLogState {
  /** 当前页签。 */
  activeTab: DeviceLogTabKey;
  /** 当前错误信息。 */
  errorMessage: string;
  /** 当前日期分组展开状态。 */
  expandedDates: Record<DeviceLogTabKey, Record<string, boolean>>;
  /** 按日期聚合后的日志组。 */
  groups: DeviceLogDateGroup[];
  /** 是否还有下一页。 */
  hasMore: boolean;
  /** 首屏加载状态。 */
  loading: boolean;
  /** 加载更多状态。 */
  loadingMore: boolean;
  /** 原始归一日志列表。 */
  logs: DeviceLogTimelineItem[];
  /** 当前页码。 */
  page: number;
  /** 当前查询的设备名。 */
  deviceName: string;
  /** 当前查询的产品 ID。 */
  productID: string;
  /** 当前展开详情的条目 ID。 */
  selectedLogId: string;
  /** 当前时间范围。 */
  timeRange: DeviceLogTimeRange;
}

/** createInitialState 创建设备日志页默认状态。 */
function createInitialState(): DeviceLogState {
  const timeRange = createDeviceLogTimeRangeFromPreset('last30m');
  return {
    activeTab: 'status',
    errorMessage: '',
    expandedDates: { debug: {}, operation: {}, status: {} },
    groups: [],
    hasMore: false,
    loading: false,
    loadingMore: false,
    logs: [],
    page: 1,
    deviceName: '',
    productID: '',
    selectedLogId: '',
    timeRange,
  };
}

class DeviceLogProvider {
  private state: DeviceLogState = createInitialState();
  private listeners: Set<(s: DeviceLogState) => void> = new Set();

  /** getState 返回当前设备日志状态。 */
  getState(): DeviceLogState {
    return this.state;
  }

  /** subscribe 订阅设备日志状态变化。 */
  subscribe(listener: (s: DeviceLogState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** update 合并局部状态并刷新日期分组。 */
  private update(partial: Partial<DeviceLogState>): void {
    const next = { ...this.state, ...partial };
    next.groups = groupDeviceLogTimelineItems(
      next.logs.map((item) => ({ ...item, expanded: item.id === next.selectedLogId })),
      next.expandedDates[next.activeTab] || {},
    );
    this.state = next;
    this.listeners.forEach((fn) => fn(this.state));
  }

  /** clear 重置 Provider 状态。 */
  clear(): void {
    this.update(createInitialState());
  }

  /** init 初始化当前设备上下文并加载第一页日志。 */
  async init(productID: string, deviceName: string): Promise<void> {
    const timeRange = createDeviceLogTimeRangeFromPreset('last30m');
    this.update({
      ...createInitialState(),
      deviceName,
      productID,
      timeRange,
    });
    await this.loadFirst();
  }

  /** loadFirst 重新加载当前页签第一页。 */
  async loadFirst(): Promise<void> {
    await this.loadLogs(false);
  }

  /** refresh 刷新当前页签第一页。 */
  async refresh(): Promise<void> {
    await this.loadFirst();
  }

  /** loadMore 触底加载下一页日志。 */
  async loadMore(): Promise<void> {
    if (!this.state.hasMore || this.state.loading || this.state.loadingMore) return;
    await this.loadLogs(true);
  }

  /** switchTab 切换日志页签并重新加载第一页。 */
  async switchTab(tab: DeviceLogTabKey): Promise<void> {
    if (tab === this.state.activeTab) return;
    this.update({
      activeTab: tab,
      errorMessage: '',
      hasMore: false,
      logs: [],
      page: 1,
      selectedLogId: '',
    });
    await this.loadFirst();
  }

  /** selectPresetRange 应用快捷时间范围并重新加载第一页。 */
  async selectPresetRange(preset: DeviceLogTimePreset): Promise<void> {
    this.update({
      errorMessage: '',
      logs: [],
      page: 1,
      selectedLogId: '',
      timeRange: createDeviceLogTimeRangeFromPreset(preset),
    });
    await this.loadFirst();
  }

  /** applyCustomDateRange 应用自定义日期范围并重新加载第一页。 */
  async applyCustomDateRange(startDate: string, endDate: string): Promise<void> {
    try {
      this.update({
        errorMessage: '',
        logs: [],
        page: 1,
        selectedLogId: '',
        timeRange: createDeviceLogTimeRangeFromDates(startDate, endDate),
      });
      await this.loadFirst();
    } catch (error) {
      this.update({ errorMessage: error instanceof Error ? error.message : '自定义时间范围无效' });
    }
  }

  /** toggleDateGroup 展开或收起指定日期分组。 */
  toggleDateGroup(dateLabel: string): void {
    const current = this.state.expandedDates[this.state.activeTab] || {};
    this.update({
      expandedDates: {
        ...this.state.expandedDates,
        [this.state.activeTab]: {
          ...current,
          [dateLabel]: !current[dateLabel],
        },
      },
    });
  }

  /** toggleItemDetail 展开或收起指定日志条目的详情。 */
  toggleItemDetail(itemId: string): void {
    this.update({ selectedLogId: this.state.selectedLogId === itemId ? '' : itemId });
  }

  /** loadLogs 执行实际分页加载。 */
  private async loadLogs(append: boolean): Promise<void> {
    if (!this.state.productID || !this.state.deviceName) return;
    const nextPage = append ? this.state.page + 1 : 1;
    this.update(append ? { loadingMore: true } : { errorMessage: '', loading: true, selectedLogId: '' });
    try {
      const result = await deviceLogService.loadLogs(this.state.productID, this.state.deviceName, {
        page: nextPage,
        size: PAGE_SIZE,
        tab: this.state.activeTab,
        timeEnd: this.state.timeRange.timeEnd,
        timeStart: this.state.timeRange.timeStart,
      });
      this.update({
        hasMore: result.hasMore,
        logs: append ? mergeAndSortDeviceLogItems([...this.state.logs, ...result.list]) : result.list,
        page: nextPage,
      });
    } catch (error) {
      this.update({ errorMessage: error instanceof Error ? error.message : '日志接口返回异常' });
    } finally {
      this.update({ loading: false, loadingMore: false });
    }
  }
}

export const deviceLogProvider = new DeviceLogProvider();
