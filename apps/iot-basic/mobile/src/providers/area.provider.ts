/** 区域列表状态，按当前项目及父级管理，并在变更前核验资格。 */
import { areaService } from '../services/area.service';
import type { AreaEntity } from '../domain/entities/area.entity';
import { createPageState, type PageState } from '../domain/models/page-state.model';

/** AreaListState 保存当前层级的列表、管理资格与加载结果。 */
export interface AreaListState {
  list: AreaEntity[];
  pageState: PageState;
  projectID: string;
  filterName: string;
  /** 当前父级、操作资格与错误状态。 */
  parentAreaID: string;
  canManage: boolean;
  error: string;
}

class AreaProvider {
  private state: AreaListState = {
    list: [],
    pageState: createPageState(),
    projectID: '',
    filterName: '', parentAreaID: '', canManage: false, error: '',
  };
  /** revision 使旧项目或旧账号的查询响应失效。 */
  private revision = 0;
  private listeners: Set<(s: AreaListState) => void> = new Set();

  getState(): AreaListState {
    return this.state;
  }

  subscribe(listener: (s: AreaListState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private update(partial: Partial<AreaListState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /** setProjectID 更换区域上下文时清除上个项目数据和变更资格。 */
  setProjectID(projectID: string, parentAreaID = ''): void {
    this.revision++;
    this.update({ projectID, parentAreaID, list: [], canManage: false, filterName: '', error: '', pageState: createPageState() });
  }
  /** initialize 区域管理页先核验管理资格，再加载指定层级。 */
  async initialize(projectID: string, userID: string, parentAreaID = '1'): Promise<void> {
    this.setProjectID(projectID, parentAreaID);
    const revision = this.revision;
    try {
      const canManage = await areaService.canManage(projectID, userID);
      if (revision !== this.revision) return;
      this.update({ canManage });
    } catch (error) {
      if (revision !== this.revision) return;
      this.update({ error: (error as Error).message || '权限核验失败' });
      return;
    }
    await this.loadFirst();
  }

  setFilter(name: string): void {
    this.update({ filterName: name });
  }

  async loadFirst(): Promise<void> {
    // 搜索或刷新开启新批次，忽略较慢的旧筛选结果。
    const revision = ++this.revision;
    const { projectID, filterName } = this.state;
    if (!projectID) return;
    const ps = createPageState();
    this.update({ error: '', pageState: { ...ps, loading: true } });
    try {
      const result = await areaService.getList(projectID, 1, ps.size, filterName || undefined, this.state.parentAreaID || undefined);
      if (revision !== this.revision) return;
      this.update({
        list: result.list,
        pageState: { ...ps, loading: false, total: result.total, hasMore: result.list.length >= ps.size },
      });
    } catch (error) {
      if (revision !== this.revision) return;
      this.update({ error: (error as Error).message || '区域加载失败', pageState: { ...ps, loading: false } });
    }
  }

  async loadMore(): Promise<void> {
    const revision = this.revision;
    const { pageState, list, projectID, filterName } = this.state;
    if (pageState.loading || !pageState.hasMore || !projectID) return;
    const next = pageState.page + 1;
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await areaService.getList(projectID, next, pageState.size, filterName || undefined, this.state.parentAreaID || undefined);
      if (revision !== this.revision) return;
      this.update({
        list: [...list, ...result.list],
        pageState: { ...pageState, loading: false, page: next, total: result.total, hasMore: result.list.length >= pageState.size },
      });
    } catch (error) {
      if (revision !== this.revision) return;
      this.update({ error: (error as Error).message || '区域加载失败', pageState: { ...pageState, loading: false } });
    }
  }

  /** createArea 核验资格后创建区域并等待列表刷新。 */
  async createArea(data: { projectID: string; parentAreaID?: string; areaName: string; areaImg?: string; desc?: string }): Promise<string> {
    if (!this.state.canManage) throw new Error('没有区域管理权限');
    const id = await areaService.create(data);
    await this.loadFirst();
    return id;
  }

  /** updateArea 核验资格后更新区域并等待列表刷新。 */
  async updateArea(data: { areaID: string; areaName?: string; areaImg?: string; desc?: string }): Promise<void> {
    if (!this.state.canManage) throw new Error('没有区域管理权限');
    await areaService.update(data);
    await this.loadFirst();
  }

  /** deleteArea 核验资格后删除空区域并等待列表刷新。 */
  async deleteArea(areaID: string): Promise<void> {
    if (!this.state.canManage) throw new Error('没有区域管理权限');
    await areaService.delete(areaID);
    await this.loadFirst();
  }
}

export const areaProvider = new AreaProvider();
