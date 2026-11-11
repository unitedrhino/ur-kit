/** 家庭成员状态容器：核验负责人和直接授权后开放操作。 */
import { familyMemberService } from '../services/family-member.service';
import type { FamilyMemberAccess, FamilyMemberEntity, FamilyMemberUser } from '../domain/entities/family-member.entity';
import { createPageState, type PageState } from '../domain/models/page-state.model';

/** 当前家庭列表、搜索结果及服务端核验后的操作资格。 */
export interface FamilyMemberState {
  /** 当前家庭成员列表。 */
  list: FamilyMemberEntity[];
  /** 分页加载状态。 */
  pageState: PageState;
  /** 当前家庭标识。 */
  projectID: string;
  /** 搜索到的待添加用户。 */
  searchedUser: FamilyMemberUser | null;
  /** 用户搜索状态。 */
  searchingUser: boolean;
  /** 未完成资格核验时为 null，所有变更入口关闭。 */
  access: FamilyMemberAccess | null;
  /** 加载错误不能显示为普通空列表。 */
  error: string;
}

/** 按当前家庭管理成员，页面参数不能直接开启变更权限。 */
export class FamilyMemberProvider {
  /** 当前家庭的成员状态。 */
  private state: FamilyMemberState = {
    list: [], pageState: createPageState(), projectID: '',
    searchedUser: null, searchingUser: false, access: null, error: '',
  };
  /** 家庭或账号重新初始化时递增，过期响应不得恢复旧账号权限。 */
  private revision = 0;
  /** 搜索序号用于忽略旧账号关键词的迟到结果。 */
  private searchRevision = 0;
  /** 页面状态监听集合。 */
  private listeners = new Set<(state: FamilyMemberState) => void>();

  /** 返回当前状态快照。 */
  getState(): FamilyMemberState { return this.state; }

  /** 订阅变化并返回解除订阅函数。 */
  subscribe(listener: (state: FamilyMemberState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 合并状态并通知页面。 */
  private updateState(partial: Partial<FamilyMemberState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  /** 先清空旧资格，再核验负责人或本人的直接成员资格。 */
  async initialize(projectID: string, userID: string): Promise<void> {
    const revision = ++this.revision;
    ++this.searchRevision;
    this.updateState({ projectID, list: [], searchedUser: null, searchingUser: false,
      access: null, error: '', pageState: { ...createPageState(), loading: true } });
    try {
      const access = await familyMemberService.getAccess(projectID, userID);
      if (this.revision !== revision) return;
      if (!access.canManage && !access.canLeave) throw new Error('你尚未加入该家庭');
      this.updateState({ access });
    } catch (error) {
      if (this.revision === revision) this.updateState({
        error: (error as Error).message || '家庭权限加载失败',
        pageState: { ...this.state.pageState, loading: false },
      });
      return;
    }
    try { await this.loadFirst(); } catch { /* 列表错误已保存在状态，页面可重试。 */ }
  }

  /** 加载第一页并透传刷新失败，变更调用方不能提前显示成功。 */
  async loadFirst(): Promise<void> {
    const projectID = this.state.projectID;
    const revision = this.revision;
    if (!projectID || !this.state.access) return;
    const pageState = createPageState();
    this.updateState({ error: '', pageState: { ...pageState, loading: true } });
    try {
      const result = await familyMemberService.getList(projectID, 1, pageState.size);
      if (this.revision !== revision) return;
      this.updateState({ list: result.list, pageState: { ...pageState, loading: false,
        total: result.total, hasMore: result.list.length < result.total } });
    } catch (error) {
      if (this.revision === revision) this.updateState({
        error: (error as Error).message || '成员列表加载失败', pageState: { ...pageState, loading: false },
      });
      throw error;
    }
  }

  /** 读取下一页，失败时保留当前列表并显示错误。 */
  async loadMore(): Promise<void> {
    const { projectID, pageState, list } = this.state;
    const revision = this.revision;
    if (!this.state.access || pageState.loading || !pageState.hasMore) return;
    const nextPage = pageState.page + 1;
    this.updateState({ error: '', pageState: { ...pageState, loading: true } });
    try {
      const result = await familyMemberService.getList(projectID, nextPage, pageState.size);
      if (this.revision !== revision) return;
      const merged = [...list, ...result.list];
      this.updateState({ list: merged, pageState: { ...pageState, loading: false,
        page: nextPage, total: result.total, hasMore: merged.length < result.total && result.list.length > 0 } });
    } catch (error) {
      if (this.revision === revision) this.updateState({
        error: (error as Error).message || '加载更多失败', pageState: { ...pageState, loading: false },
      });
    }
  }

  /** 仅核验后的负责人可管理，负责人自身不能作为成员变更目标。 */
  private requireManager(targetID?: string): void {
    if (!this.state.access?.canManage) throw new Error('仅家庭负责人可以管理成员');
    if (targetID && targetID === this.state.access.ownerUserID) throw new Error('不能修改家庭负责人的成员授权');
  }

  /** 输入变化时清空旧候选，避免把新账号文本提交为旧用户。 */
  clearSearch(): void {
    ++this.searchRevision;
    this.updateState({ searchedUser: null, searchingUser: false });
  }

  /** 搜索添加对象，搜索失败或无结果时清空旧候选。 */
  async searchUser(account: string): Promise<FamilyMemberUser | null> {
    this.requireManager();
    const searchRevision = ++this.searchRevision;
    this.updateState({ searchedUser: null, searchingUser: !!account.trim() });
    if (!account.trim()) return null;
    const projectID = this.state.projectID;
    const revision = this.revision;
    try {
      const user = await familyMemberService.searchUser(account, projectID);
      if (this.revision !== revision || this.searchRevision !== searchRevision) return null;
      this.updateState({ searchedUser: user, searchingUser: false });
      return user;
    } catch (error) {
      if (this.revision === revision && this.searchRevision === searchRevision) this.updateState({ searchingUser: false });
      throw error;
    }
  }

  /** 添加成员并等待列表刷新。 */
  async create(targetID: string, authType: number, memberRemark?: string): Promise<void> {
    this.requireManager(targetID);
    if (![1, 2, 3].includes(authType)) throw new Error('请选择有效成员权限');
    await familyMemberService.create({ projectID: this.state.projectID, targetID, authType, memberRemark });
    await this.loadFirst();
    this.updateState({ searchedUser: null });
  }

  /** 更新成员称呼，空字符串用于清空。 */
  async updateRemark(targetID: string, memberRemark: string): Promise<void> {
    this.requireManager(targetID);
    await familyMemberService.update({ projectID: this.state.projectID, targetID, memberRemark });
    await this.loadFirst();
  }

  /** 删除其他成员的授权，禁止移除负责人自身。 */
  async remove(targetID: string): Promise<void> {
    this.requireManager(targetID);
    await familyMemberService.remove({ projectID: this.state.projectID, targetID });
    await this.loadFirst();
  }

  /** 退出只使用核验过的当前账号，并重新检查服务端资格。 */
  async leave(): Promise<void> {
    const { projectID, access } = this.state;
    const revision = this.revision;
    if (!access?.canLeave) throw new Error('仅共享家庭的直接成员可以退出');
    await familyMemberService.leaveSharedFamily(projectID, access.userID);
    if (this.revision !== revision) return;
    ++this.revision;
    ++this.searchRevision;
    this.updateState({ projectID: '', access: null, list: [], searchedUser: null,
      error: '', pageState: createPageState() });
  }
}

/** 当前家庭成员页共用的状态容器。 */
export const familyMemberProvider = new FamilyMemberProvider();
