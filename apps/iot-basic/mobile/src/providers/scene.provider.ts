import { sceneService } from '../services/scene.service';
import type { SceneEntity } from '../domain/entities/scene.entity';
import { createPageState, type PageState } from '../domain/models/page-state.model';

export interface SceneListState {
  list: SceneEntity[];
  pageState: PageState;
  filter: {
    type?: 'auto' | 'manual';
    status?: number;
    keyword?: string;
  };
}

class SceneProvider {
  private state: SceneListState = {
    list: [],
    pageState: createPageState(),
    filter: {},
  };
  private listeners: Set<(s: SceneListState) => void> = new Set();

  getState(): SceneListState { return this.state; }

  subscribe(listener: (s: SceneListState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify(): void { this.listeners.forEach((fn) => fn(this.state)); }

  private update(partial: Partial<SceneListState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  setFilter(filter: Partial<SceneListState['filter']>): void {
    this.update({ filter: { ...this.state.filter, ...filter } });
    this.loadFirst();
  }

  async loadFirst(): Promise<void> {
    const ps = createPageState();
    this.update({ pageState: { ...ps, loading: true } });
    try {
      const result = await sceneService.getList(1, ps.size, this.state.filter.status);
      let list = result.list;
      if (this.state.filter.type) {
        list = list.filter((item) => item.type === this.state.filter.type);
      }
      if (this.state.filter.keyword) {
        const kw = this.state.filter.keyword.toLowerCase();
        list = list.filter((item) => item.name.toLowerCase().includes(kw));
      }
      this.update({
        list,
        pageState: { ...ps, loading: false, total: result.total, hasMore: result.list.length >= ps.size },
      });
    } catch {
      this.update({ pageState: { ...ps, loading: false } });
    }
  }

  async loadMore(): Promise<void> {
    const { pageState, list } = this.state;
    if (pageState.loading || !pageState.hasMore) return;
    const next = pageState.page + 1;
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await sceneService.getList(next, pageState.size, this.state.filter.status);
      let newList = result.list;
      if (this.state.filter.type) {
        newList = newList.filter((item) => item.type === this.state.filter.type);
      }
      if (this.state.filter.keyword) {
        const kw = this.state.filter.keyword.toLowerCase();
        newList = newList.filter((item) => item.name.toLowerCase().includes(kw));
      }
      this.update({
        list: [...list, ...newList],
        pageState: { ...pageState, loading: false, page: next, total: result.total, hasMore: result.list.length >= pageState.size },
      });
    } catch {
      this.update({ pageState: { ...pageState, loading: false } });
    }
  }

  async trigger(id: string): Promise<void> {
    await sceneService.manualTrigger(id);
  }

  async toggleStatus(id: string, currentStatus: number): Promise<void> {
    const newStatus = currentStatus === 1 ? 2 : 1;
    await sceneService.updateStatus(id, newStatus);
    const list = this.state.list.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item,
    );
    this.update({ list });
  }

  async deleteScene(id: string): Promise<void> {
    await sceneService.delete(id);
    const list = this.state.list.filter((item) => item.id !== id);
    this.update({ list });
  }
}

export const sceneProvider = new SceneProvider();
