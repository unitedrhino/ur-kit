import { setRequestProjectContext } from '../utils/request-context';

const STORAGE_KEY = 'current_family_map';
/** 按账号和企业保存最近选择，退出登录仅清理运行态。 */
const HISTORY_KEY = 'current_family_history_by_user';

export interface CurrentFamilySelection {
  projectID: string;
  projectName: string;
}

export interface CurrentFamilyState extends CurrentFamilySelection {
  currentTenantCode: string;
}

type FamilySelectionMap = Record<string, CurrentFamilySelection>;

class CurrentFamilyProvider {
  private state: CurrentFamilyState = {
    currentTenantCode: '',
    projectID: '',
    projectName: '',
  };

  private selectionMap: FamilySelectionMap = {};
  private userID = '';

  private listeners: Set<(s: CurrentFamilyState) => void> = new Set();

  constructor() {
    this.restore();
  }

  getState(): CurrentFamilyState {
    return this.state;
  }

  getSelection(tenantCode: string): CurrentFamilySelection {
    return this.selectionMap[tenantCode] || { projectID: '', projectName: '' };
  }

  /** setUser 切换账号时只加载该账号的历史项目，避免跨账号串用。 */
  setUser(userID: string): void {
    if (this.userID === userID) return;
    this.userID = userID;
    this.selectionMap = {};
    if (userID) {
      try {
        const history = JSON.parse(uni.getStorageSync(HISTORY_KEY) || '{}');
        this.selectionMap = history[userID] || {};
      } catch { /* 损坏的历史记录按首次访问处理。 */ }
    }
    this.syncCurrentState();
  }

  subscribe(listener: (s: CurrentFamilyState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private syncCurrentState(): void {
    const current = this.getSelection(this.state.currentTenantCode);
    this.state = {
      currentTenantCode: this.state.currentTenantCode,
      projectID: current.projectID,
      projectName: current.projectName,
    };
    setRequestProjectContext(this.state.currentTenantCode, current.projectID);
    this.notify();
  }

  setCurrentTenant(tenantCode: string): void {
    this.state = {
      currentTenantCode: tenantCode,
      projectID: '',
      projectName: '',
    };
    this.syncCurrentState();
  }

  switchFamily(projectID: string, projectName: string, tenantCode = this.state.currentTenantCode): void {
    if (!tenantCode) {
      this.state = {
        ...this.state,
        projectID,
        projectName,
      };
      setRequestProjectContext(this.state.currentTenantCode, projectID);
      this.notify();
      return;
    }
    this.selectionMap[tenantCode] = { projectID, projectName };
    this.persist();
    if (this.userID && projectID) {
      try {
        const history = JSON.parse(uni.getStorageSync(HISTORY_KEY) || '{}');
        history[this.userID] = { ...history[this.userID], [tenantCode]: { projectID, projectName } };
        uni.setStorageSync(HISTORY_KEY, JSON.stringify(history));
      } catch { /* 本地存储不可用时保留当前运行态。 */ }
    }
    if (tenantCode === this.state.currentTenantCode) {
      this.syncCurrentState();
    }
  }

  clear(tenantCode = this.state.currentTenantCode): void {
    if (!tenantCode) {
      this.selectionMap = {};
      this.persist();
      this.state = {
        currentTenantCode: '',
        projectID: '',
        projectName: '',
      };
      setRequestProjectContext('', '');
      this.notify();
      return;
    }
    delete this.selectionMap[tenantCode];
    this.persist();
    if (tenantCode === this.state.currentTenantCode) {
      this.syncCurrentState();
    }
  }

  private persist(): void {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(this.selectionMap));
    } catch { /* ignore */ }
  }

  private restore(): void {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as FamilySelectionMap;
      if (parsed && typeof parsed === 'object') {
        this.selectionMap = parsed;
      }
    } catch { /* ignore */ }
  }
}

export const currentFamilyProvider = new CurrentFamilyProvider();
