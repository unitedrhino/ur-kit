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

export class ProjectProvider {
  private state: ProjectListState = {
    list: [],
    pageState: createPageState(),
    filterName: '',
    filterStatus: 0,
  };
  private listeners: Set<(s: ProjectListState) => void> = new Set();
  /** ownershipCache 按账号和项目缓存负责人判断，避免每次切换列表重复读取项目详情。 */
  private ownershipCache = new Map<string, boolean>();

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
    this.ownershipCache.clear();
    await this.loadFirst();
    return id;
  }

  async updateProject(data: ProjectUpdateData): Promise<void> {
    await projectService.update(data);
    this.ownershipCache.clear();
    await this.loadFirst();
  }

  async deleteProject(projectID: string): Promise<void> {
    await projectService.delete(projectID);
    this.ownershipCache.clear();
    await this.loadFirst();
  }

  /** isOwnerProject 判断项目负责人，项目列表未包含目标时回读详情避免分页误判。 */
  async isOwnerProject(projectID: string, userID: string): Promise<boolean> {
    if (!projectID || !userID) return false;
    const key = `${userID}:${projectID}`;
    const cached = this.ownershipCache.get(key);
    if (cached !== undefined) return cached;
    const listed = this.state.list.find((item) => item.projectID === projectID);
    if (listed) {
      const owner = String(listed.adminUserID) === String(userID) && listed.status === 1;
      this.ownershipCache.set(key, owner);
      return owner;
    }
    try {
      const project = await projectService.getOne(projectID);
      const owner = String(project.adminUserID) === String(userID) && project.status === 1;
      this.ownershipCache.set(key, owner);
      return owner;
    } catch {
      this.ownershipCache.set(key, false);
      return false;
    }
  }

  /** getOwnedProjects 分页读取当前账号负责的正常项目，供分享接收前置检查使用。 */
  async getOwnedProjects(userID: string): Promise<ProjectEntity[]> {
    if (!userID) return [];
    const owned: ProjectEntity[] = [];
    for (let page = 1; page <= 200; page += 1) {
      const result = await projectService.getList(page, 100, undefined, 1);
      owned.push(...result.list.filter((item) => item.status === 1 && item.adminUserID === userID));
      if (!result.list.length || page * 100 >= result.total) break;
    }
    return owned;
  }
}

export const projectProvider = new ProjectProvider();
