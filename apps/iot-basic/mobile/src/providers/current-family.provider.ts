import { setRequestProjectContext } from '../utils/request-context';

const STORAGE_KEY = 'current_family_map';

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
