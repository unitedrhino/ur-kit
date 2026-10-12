import { areaService } from '../services/area.service';
import type { AreaEntity } from '../domain/entities/area.entity';
import { createPageState, type PageState } from '../domain/models/page-state.model';

export interface AreaListState {
  list: AreaEntity[];
  pageState: PageState;
  projectID: string;
  filterName: string;
}

class AreaProvider {
  private state: AreaListState = {
    list: [],
    pageState: createPageState(),
    projectID: '',
    filterName: '',
  };
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

  setProjectID(projectID: string): void {
    this.update({ projectID });
  }

  setFilter(name: string): void {
    this.update({ filterName: name });
  }

  async loadFirst(): Promise<void> {
    const { projectID, filterName } = this.state;
    if (!projectID) return;
    const ps = createPageState();
    this.update({ pageState: { ...ps, loading: true } });
    try {
      const result = await areaService.getList(projectID, 1, ps.size, filterName || undefined);
      this.update({
        list: result.list,
        pageState: { ...ps, loading: false, total: result.total, hasMore: result.list.length >= ps.size },
      });
    } catch {
      this.update({ pageState: { ...ps, loading: false } });
    }
  }

  async loadMore(): Promise<void> {
    const { pageState, list, projectID, filterName } = this.state;
    if (pageState.loading || !pageState.hasMore || !projectID) return;
    const next = pageState.page + 1;
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await areaService.getList(projectID, next, pageState.size, filterName || undefined);
      this.update({
        list: [...list, ...result.list],
        pageState: { ...pageState, loading: false, page: next, total: result.total, hasMore: result.list.length >= pageState.size },
      });
    } catch {
      this.update({ pageState: { ...pageState, loading: false } });
    }
  }

  async createArea(data: { projectID: string; areaName: string; areaImg?: string; desc?: string }): Promise<string> {
    const id = await areaService.create(data);
    await this.loadFirst();
    return id;
  }

  async updateArea(data: { areaID: string; areaName?: string; areaImg?: string; desc?: string }): Promise<void> {
    await areaService.update(data);
    await this.loadFirst();
  }

  async deleteArea(areaID: string): Promise<void> {
    await areaService.delete(areaID);
    await this.loadFirst();
  }
}

export const areaProvider = new AreaProvider();
