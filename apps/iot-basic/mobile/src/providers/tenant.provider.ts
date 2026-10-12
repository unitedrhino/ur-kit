import { tenantService } from '../services/tenant.service';
import { currentFamilyProvider } from './current-family.provider';
import type { TenantEntity } from '../domain/entities/tenant.entity';
import { setRequestTenantCode } from '../utils/request-context';

const STORAGE_KEY = 'current_tenant';
// 旧版前端曾用 common 作为占位组织；新版不再把它当作可用组织或请求头。
const LEGACY_COMMON_TENANT_CODE = 'common';

export interface TenantState {
  list: TenantEntity[];
  current: TenantEntity | null;
  loading: boolean;
}

class TenantProvider {
  private state: TenantState = {
    list: [],
    current: null,
    loading: false,
  };

  private listeners: Set<(s: TenantState) => void> = new Set();

  constructor() {
    this.restore();
  }

  getState(): TenantState {
    return this.state;
  }

  getAvailableTenants(): TenantEntity[] {
    return this.state.list;
  }

  subscribe(listener: (s: TenantState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  /** 加载用户可访问的租户列表 */
  async loadTenants(): Promise<void> {
    this.state = { ...this.state, loading: true };
    this.notify();
    try {
      const remoteList = await tenantService.getMyTenants();
      const list = remoteList.filter((item) => !!item.code && item.code !== LEGACY_COMMON_TENANT_CODE);
      const currentCode = this.normalizeTenantCode(this.state.current?.code || '');
      const current = currentCode
        ? (list.find((item) => item.code === currentCode) ?? (list.length === 1 ? list[0] : null))
        : null;
      this.state = { ...this.state, list, current, loading: false };
      setRequestTenantCode(current?.code || '');
      currentFamilyProvider.setCurrentTenant(current?.code || '');
      this.notify();
    } catch (err) {
      console.error('[TenantProvider] loadTenants failed:', err);
      this.state = { ...this.state, loading: false };
      this.notify();
    }
  }

  /** 切换租户，级联清空下游状态 */
  switchTenant(code: string): boolean {
    const normalizedCode = this.normalizeTenantCode(code);
    if (!normalizedCode) return false;
    const tenant = this.state.list.find((t) => t.code === normalizedCode);
    if (!tenant) return false;

    this.state = { ...this.state, current: tenant };
    setRequestTenantCode(tenant.code);
    this.persist();
    currentFamilyProvider.setCurrentTenant(tenant.code);
    this.notify();
    return true;
  }

  /** 使用 Modal 提示用户是否切换到新租户 */
  promptSwitch(tenantCode: string): void {
    const tenant = this.state.list.find((t) => t.code === tenantCode);
    if (!tenant) return;

    uni.showModal({
      title: '切换组织',
      content: `是否切换到「${tenant.name}」？`,
      success: (res) => {
        if (res.confirm) {
          this.switchTenant(tenantCode);
        }
      },
    });
  }

  /** 从本地存储恢复上次选择的租户 */
  restore(): void {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { code: string; name: string };
        const code = this.normalizeTenantCode(parsed.code);
        if (code) {
          this.state = {
            ...this.state,
            current: {
              id: '',
              code,
              name: parsed.name,
              avatar: '',
              status: 1,
              desc: '',
              isOwner: false,
            },
          };
          setRequestTenantCode(code);
          currentFamilyProvider.setCurrentTenant(code);
        } else {
          uni.removeStorageSync(STORAGE_KEY);
        }
      }
    } catch { /* ignore */ }
    setRequestTenantCode(this.state.current?.code || '');
    currentFamilyProvider.setCurrentTenant(this.state.current?.code || '');
  }

  /** 清空状态并移除持久化数据 */
  clear(): void {
    this.state = { list: [], current: null, loading: false };
    try {
      uni.removeStorageSync(STORAGE_KEY);
    } catch { /* ignore */ }
    setRequestTenantCode('');
    currentFamilyProvider.setCurrentTenant('');
    this.notify();
  }

  async createTenant(data: { name: string; desc?: string; avatar?: string }): Promise<string> {
    const code = await tenantService.createTenant(data);
    await this.loadTenants();
    return code;
  }

  async joinTenantByInviteCode(code: string): Promise<void> {
    await tenantService.joinTenantByCode(code);
    await this.loadTenants();
  }

  async joinTenantByCode(code: string): Promise<void> {
    await this.joinTenantByInviteCode(code);
  }

  async deleteTenantByCode(code: string): Promise<void> {
    await tenantService.deleteTenant(code);
    if (this.state.current?.code === code) {
      this.clear();
      return;
    }
    await this.loadTenants();
  }

  async getTenantDetail(code?: string): Promise<TenantEntity> {
    return tenantService.getTenantDetail(code);
  }

  async updateTenant(data: { code?: string; name?: string; desc?: string; avatar?: string }): Promise<void> {
    await tenantService.updateTenant(data);
    await this.loadTenants();
    const currentCode = data.code || this.state.current?.code || '';
    if (currentCode) {
      this.switchTenant(currentCode);
    }
  }

  private persist(): void {
    try {
      if (this.state.current) {
        uni.setStorageSync(
          STORAGE_KEY,
          JSON.stringify({
            code: this.state.current.code,
            name: this.state.current.name,
          }),
        );
      }
    } catch { /* ignore */ }
  }

  /** normalizeTenantCode 过滤旧版 common 占位组织，避免继续透传到后端。 */
  private normalizeTenantCode(code: string): string {
    return code && code !== LEGACY_COMMON_TENANT_CODE ? code : '';
  }
}

export const tenantProvider = new TenantProvider();
