import { projectService } from '../services/project.service';
import type { ProjectEntity } from '../domain/entities/project.entity';
import type { ProjectCreateData, ProjectUpdateData } from '../domain/interfaces/project.repository';
import { createPageState, type PageState } from '../domain/models/page-state.model';

export interface ProjectListState {
  list: ProjectEntity[];
  pageState: PageState;
  filterName: string;
  filterStatus: number; // 0=全部 1=正常 2=禁用
}

class ProjectProvider {
  private state: ProjectListState = {
    list: [],
    pageState: createPageState(),
    filterName: '',
    filterStatus: 0,
  };
  private listeners: Set<(s: ProjectListState) => void> = new Set();

  getState(): ProjectListState {
    return this.state;
  }

  subscribe(listener: (s: ProjectListState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private update(partial: Partial<ProjectListState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  setFilter(name: string, status: number): void {
    this.update({ filterName: name, filterStatus: status });
  }

  async loadFirst(): Promise<void> {
    const ps = createPageState();
    this.update({ pageState: { ...ps, loading: true } });
    try {
      const { filterName, filterStatus } = this.state;
      const result = await projectService.getList(
        1, ps.size,
        filterName || undefined,
        filterStatus || undefined,
      );
      this.update({
        list: result.list,
        pageState: { ...ps, loading: false, total: result.total, hasMore: result.list.length >= ps.size },
      });
    } catch {
      this.update({ pageState: { ...ps, loading: false } });
    }
  }

  async loadMore(): Promise<void> {
    const { pageState, list, filterName, filterStatus } = this.state;
    if (pageState.loading || !pageState.hasMore) return;
    const next = pageState.page + 1;
    this.update({ pageState: { ...pageState, loading: true } });
    try {
      const result = await projectService.getList(
        next, pageState.size,
        filterName || undefined,
        filterStatus || undefined,
      );
      this.update({
        list: [...list, ...result.list],
        pageState: { ...pageState, loading: false, page: next, total: result.total, hasMore: result.list.length >= pageState.size },
      });
    } catch {
      this.update({ pageState: { ...pageState, loading: false } });
    }
  }

  async createProject(data: ProjectCreateData): Promise<string> {
    const id = await projectService.create(data);
    await this.loadFirst();
    return id;
  }

  async updateProject(data: ProjectUpdateData): Promise<void> {
    await projectService.update(data);
    await this.loadFirst();
  }

  async deleteProject(projectID: string): Promise<void> {
    await projectService.delete(projectID);
    await this.loadFirst();
  }
}

export const projectProvider = new ProjectProvider();
