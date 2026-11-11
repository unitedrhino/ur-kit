// 应用上下文 Provider：登录态 / 企业 / 家庭的路由守卫与启动参数编排。
// 归属 Providers 层 —— 它协调多个 Provider 状态并执行 uni 页面导航，
// 依赖方向为 Provider -> Provider / Provider -> Service，符合 Clean Architecture 单向依赖。
import { authProvider } from './auth.provider';
import { tenantProvider } from './tenant.provider';
import { currentFamilyProvider } from './current-family.provider';
import { config } from '../config';
import type { TenantEntity } from '../domain/entities/tenant.entity';
import { projectService } from '../services/project.service';
import { tenantService } from '../services/tenant.service';
import { suggestFamilyName } from '../utils/family-name';
import {
  clearPendingInviteCode,
  clearPendingLaunchTenantCode,
  getPendingInviteCode,
  getPendingLaunchTenantCode,
  parseInviteFromLaunchOptions,
  parseInviteTenantCode,
  parseLaunchTenantCode,
  savePendingInviteCode,
  savePendingLaunchTenantCode,
} from '../utils/tenant-source';
import { setRequestTenantCode } from '../utils/request-context';
import { eventBus } from '../utils/event-bus';

const TENANT_SELECT_URL = '/packageUser/pages/tenant-manage/index?mode=select';
const LOGIN_URL = '/packageUser/pages/login/index';
const HOME_URL = '/pages/home/index';
/** ORG_ID_NOT_FOUND_URL 是公开 org-id 校验失败后的提示页地址。 */
const ORG_ID_NOT_FOUND_URL = '/packageUser/pages/org-id-not-found/index';
/** ORG_ID_NOT_FOUND_PATH 用于识别当前页面，避免重复重启页面栈。 */
const ORG_ID_NOT_FOUND_PATH = 'packageUser/pages/org-id-not-found/index';
/** HOME_PATH 用于单组织异常兜底时避免重复切换首页。 */
const HOME_PATH = 'pages/home/index';

const TAB_PAGES = new Set([
  '/pages/home/index',
  '/pages/device/index',
  '/pages/scene/index',
  '/pages/mine/index',
]);

/**
 * 公开页面：未登录也允许直接展示空态。
 * 当前仅首页是访客可浏览的入口；其他 Tab/业务页仍走登录守卫。
 */
const PUBLIC_PAGES = new Set([
  '/pages/home/index',
]);

class AppContextProvider {
  /** constructor 在退出登录时撤销本轮导航缓存；后续账号必须重新核验。 */
  constructor() {
    eventBus.on('auth:logout', () => { this.readyContext = null; });
  }

  private pendingRoute = '';
  /** readyContext 是最近通过平台核验的导航上下文，仅保留内存60秒，不作为业务接口授权。 */
  private readyContext: { key: string; expiresAt: number } | null = null;

  /** contextKey 按账号、令牌、企业和项目隔离导航复用，不持久化或记录令牌。 */
  private contextKey(): string {
    const auth = authProvider.getState();
    const tenant = tenantProvider.getState().current;
    const family = currentFamilyProvider.getState();
    return JSON.stringify([auth.user?.userID, auth.user?.token, tenant?.code, family.projectID]);
  }

  /** rememberReadyContext 仅记住完整成功的守卫；失败立即撤销旧结果。 */
  private rememberReadyContext(ready: boolean): boolean {
    this.readyContext = ready ? { key: this.contextKey(), expiresAt: Date.now() + 60_000 } : null;
    return ready;
  }


  getPendingRoute(): string {
    return this.pendingRoute;
  }

  setPendingRoute(url: string): void {
    this.pendingRoute = url;
  }

  clearPendingRoute(): void {
    this.pendingRoute = '';
  }

  captureLaunchOptions(options?: Record<string, string | undefined>): boolean {
    if (!options) {
      return false;
    }
    const normalizedOptions = Object.entries(options).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string' && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    // 微信开发者工具调试启动参数时，直接在 Console 输出归一化后的公开 query。
    console.info('[launch-options] query', { ...normalizedOptions, ...(normalizedOptions.ticket ? { ticket: '[REDACTED]' } : {}) });

    if (this.isSingleTenantMode()) {
      const ignoredTenantContext = !!parseInviteFromLaunchOptions(normalizedOptions) || !!parseLaunchTenantCode(normalizedOptions);
      if (ignoredTenantContext) {
        this.clearIgnoredTenantContext();
      }
      return ignoredTenantContext;
    }

    const source = parseInviteFromLaunchOptions(normalizedOptions);
    if (source?.inviteCode) {
      savePendingInviteCode(source.inviteCode);
      return true;
    }
    const tenantCode = parseLaunchTenantCode(normalizedOptions);
    if (tenantCode) {
      savePendingLaunchTenantCode(tenantCode);
      return true;
    }
    return false;
  }

  /** openWebLoginFromLaunch 将首页收到的合法票据转到固定确认页，冷启动和后台重新扫码均适用。 */
  openWebLoginFromLaunch(options?: Record<string, unknown>, launchPath?: string): boolean {
    // 只接受扫码首页或固定确认页；设置/面板等页面的恢复参数不具备扫码用途。
    if (!['pages/home/index', 'packageUser/pages/web-login/index'].includes(String(launchPath || '').replace(/^\//, ''))) return false;
    // 仅接受后端生成的票据，禁止启动参数提供任意重定向地址。
    const binding = options?.bindTicket;
    const isBinding = typeof binding === 'string' && /^[a-f0-9]{64}$/.test(binding);
    const ticket = isBinding ? binding : options?.ticket;
    if (typeof ticket !== 'string' || !/^[a-f0-9]{64}$/.test(ticket)) return false;
    /** key 区分微信绑定授权与电脑登录，绑定不能进入平台登录或自动注册。 */
    const key = isBinding ? 'bindTicket' : 'ticket';
    const target = `/packageUser/pages/web-login/index?${key}=${encodeURIComponent(ticket)}`;
    const pages = getCurrentPages();
    const current = pages[pages.length - 1] as { route?: string; options?: Record<string, string> } | undefined;
    if (current?.route === 'packageUser/pages/web-login/index' && current.options?.[key] === ticket) return true;
    uni.reLaunch({ url: target });
    return true;
  }

  /** prepareTenantContextBeforeAuth 在认证请求前准备组织上下文。 */
  async prepareTenantContextBeforeAuth(): Promise<boolean> {
    if (this.isSingleTenantMode()) {
      return this.ensureSingleTenantAvailable();
    }
    return this.ensurePendingLaunchTenantAvailable();
  }

  /** ensurePendingLaunchTenantAvailable 校验公开 org-id 合法后才允许写入请求租户头。 */
  async ensurePendingLaunchTenantAvailable(): Promise<boolean> {
    const pendingTenantCode = getPendingLaunchTenantCode();
    if (!pendingTenantCode) return true;

    try {
      const exists = await tenantService.hasTenantForApp(pendingTenantCode, config.appId);
      if (exists) {
        setRequestTenantCode(pendingTenantCode);
        return true;
      }
      this.clearInvalidLaunchTenant();
      return false;
    } catch (error) {
      setRequestTenantCode(tenantProvider.getState().current?.code || '');
      uni.showToast({ title: (error as Error)?.message || '组织校验失败，请稍后重试', icon: 'none' });
      return false;
    }
  }

  /** ensureReady 校验导航上下文；tenantsAlreadyLoaded仅用于同次交接已完成的企业查询，项目权限仍核验。 */
  async ensureReady(targetUrl: string, tenantsAlreadyLoaded = false): Promise<boolean> {
    const targetPath = targetUrl.split('?')[0];
    // 缓存会话先验证；电脑登录确认只需要有效身份。
    if (!authProvider.isLoggedIn() && authProvider.getState().loggedIn) {
      await authProvider.restoreSession();
    }
    if (['/packageUser/pages/web-login/index', '/packageDevice/pages/share-accept/index', '/packageUser/pages/project-invite/index'].includes(targetPath) && authProvider.isLoggedIn()) {
      this.pendingRoute = targetUrl;
      return true;
    }

    if (!authProvider.isLoggedIn()) {
      // 公开页面（Tab 入口）允许未登录浏览，业务点上再用 ensureLoggedIn 做按钮级守卫
      if (PUBLIC_PAGES.has(targetPath)) {
        return true;
      }
      this.pendingRoute = targetUrl;
      uni.redirectTo({ url: LOGIN_URL });
      return false;
    }

    this.pendingRoute = targetUrl;

    // 首页、设备详情和设置往返复用刚完成的上下文，管理、选择及邀请流程仍完整刷新。
    if ([HOME_URL, '/packageDevice/pages/detail/index', '/packageDevice/pages/settings/index'].includes(targetPath)
      && !getPendingInviteCode() && !getPendingLaunchTenantCode()
      && this.readyContext?.key === this.contextKey() && Date.now() < this.readyContext.expiresAt) {
      return true;
    }
    this.readyContext = null;

    if (this.isSingleTenantMode()) {
      if (!(await this.ensureSingleTenantAvailable())) {
        return false;
      }
      if (!tenantsAlreadyLoaded) await tenantProvider.loadTenants();
      if (!authProvider.isLoggedIn()) return false;
      if (!this.ensureSingleTenant()) return false;
      const ready = await this.ensureFamily(targetPath);
      return ['/packageDevice/pages/share-manage/index', '/pages/mine/index'].includes(targetPath) ? ready : this.rememberReadyContext(ready);
    }

    if (!tenantsAlreadyLoaded) await tenantProvider.loadTenants();
    // 组织请求期间收到 401 后不能重新打开组织选择页。
    if (!authProvider.isLoggedIn()) return false;

    if (!(await this.handlePendingInvite())) return false;
    if (!authProvider.isLoggedIn()) return false;

    if (!(await this.handlePendingLaunchTenant())) return false;
    if (!authProvider.isLoggedIn()) return false;

    if (!this.ensureTenant()) {
      return false;
    }

    const ready = await this.ensureFamily(targetPath);
    return ['/packageDevice/pages/share-manage/index', '/pages/mine/index'].includes(targetPath) ? ready : this.rememberReadyContext(ready);
  }

  /**
   * 业务点（如"添加设备"、"切换家庭"按钮）的登录守卫。
   * 未登录时记录 pendingRoute 并跳登录页，登录成功后由 continueAfterLogin 续跳。
   */
  ensureLoggedIn(targetUrl?: string): boolean {
    if (authProvider.isLoggedIn()) return true;
    if (targetUrl) {
      this.pendingRoute = targetUrl;
    }
    uni.navigateTo({ url: LOGIN_URL });
    return false;
  }

  resumePendingRoute(fallbackUrl = '/pages/home/index'): void {
    const targetUrl = this.pendingRoute || fallbackUrl;
    this.pendingRoute = '';
    if (TAB_PAGES.has(targetUrl)) {
      uni.switchTab({ url: targetUrl });
      return;
    }
    uni.reLaunch({ url: targetUrl });
  }

  async continueAfterLogin(fallbackUrl = '/pages/home/index'): Promise<void> {
    const targetUrl = this.pendingRoute || fallbackUrl;
    const ready = await this.ensureReady(targetUrl);
    if (ready) {
      this.resumePendingRoute(fallbackUrl);
    }
  }

  private isSingleTenantMode(): boolean {
    return config.tenantMode === 'single';
  }

  private getSingleTenantCode(): string {
    return (config.singleTenantCode || '').trim();
  }

  /** clearIgnoredTenantContext 清理单组织模式下不再消费的邀请与启动组织参数。 */
  private clearIgnoredTenantContext(): void {
    clearPendingInviteCode();
    clearPendingLaunchTenantCode();
  }

  /** ensureSingleTenantAvailable 校验固定组织可用于当前 app，成功后写入请求头。 */
  private async ensureSingleTenantAvailable(): Promise<boolean> {
    const singleTenantCode = this.getSingleTenantCode();
    this.clearIgnoredTenantContext();
    setRequestTenantCode('');

    if (!singleTenantCode) {
      uni.showToast({ title: '单组织配置缺少组织编码', icon: 'none' });
      this.openHomeFallback();
      return false;
    }

    try {
      const tenant = await this.getConfiguredSingleTenant();
      if (tenant?.code) {
        setRequestTenantCode(tenant.code);
        return true;
      }
      this.redirectToOrgIdNotFound();
      return false;
    } catch (error) {
      uni.showToast({ title: (error as Error)?.message || '组织校验失败，请稍后重试', icon: 'none' });
      this.openHomeFallback();
      return false;
    }
  }

  private ensureSingleTenant(): boolean {
    const singleTenantCode = this.getSingleTenantCode();
    if (!singleTenantCode) {
      this.openHomeFallback();
      return false;
    }

    const target = tenantProvider
      .getAvailableTenants()
      .find((item) => item.status === 1 && this.isConfiguredSingleTenant(item));
    if (target) {
      tenantProvider.switchTenant(target.code);
      return true;
    }

    uni.showToast({ title: '当前账号暂未加入该组织', icon: 'none' });
    this.openHomeFallback();
    return false;
  }

  /** getConfiguredSingleTenant 读取配置指定的真实组织，配置值允许填 code 或 id。 */
  private async getConfiguredSingleTenant(): Promise<TenantEntity | null> {
    return tenantService.getTenantByCode(this.getSingleTenantCode());
  }

  private isConfiguredSingleTenant(tenant: TenantEntity): boolean {
    const singleTenantCode = this.getSingleTenantCode();
    return tenant.code === singleTenantCode || tenant.id === singleTenantCode;
  }

  private ensureTenant(): boolean {
    const tenantState = tenantProvider.getState();
    const list = tenantProvider.getAvailableTenants().filter((item) => item.status === 1);

    if (tenantState.current?.code) {
      const current = list.find((item) => item.code === tenantState.current?.code);
      if (current) {
        if (current.name !== tenantState.current.name || current.id !== tenantState.current.id) {
          tenantProvider.switchTenant(current.code);
        }
        return true;
      }
    }

    if (list.length === 1) {
      tenantProvider.switchTenant(list[0].code);
      return true;
    }

    this.openTenantSelectGate();
    return false;
  }

  private async handlePendingInvite(): Promise<boolean> {
    const inviteCode = getPendingInviteCode();
    if (!inviteCode) return true;

    const tenantCode = parseInviteTenantCode(inviteCode);
    const existing = tenantCode
      ? tenantProvider.getAvailableTenants().find((item) => item.code === tenantCode)
      : null;
    if (existing) {
      tenantProvider.switchTenant(existing.code);
      clearPendingInviteCode();
      return true;
    }

    try {
      await tenantProvider.joinTenantByInviteCode(inviteCode);
      clearPendingInviteCode();
      const joined = tenantCode
        ? tenantProvider.getAvailableTenants().find((item) => item.code === tenantCode)
        : null;
      if (joined) {
        tenantProvider.switchTenant(joined.code);
      }
      return true;
    } catch (error) {
      uni.showToast({ title: (error as Error).message || '邀请已失效或无法加入', icon: 'none' });
      this.openTenantSelectGate();
      return false;
    }
  }

  /** 处理控制台二维码直传的企业号，登录后优先切换到该企业。 */
  private async handlePendingLaunchTenant(): Promise<boolean> {
    const pendingTenantCode = getPendingLaunchTenantCode();
    if (!pendingTenantCode) return true;

    if (!(await this.ensurePendingLaunchTenantAvailable())) {
      return false;
    }
    const target = tenantProvider
      .getAvailableTenants()
      .find((item) => item.status === 1 && item.code === pendingTenantCode);
    if (target) {
      tenantProvider.switchTenant(pendingTenantCode);
      clearPendingLaunchTenantCode();
      return true;
    }

    clearPendingLaunchTenantCode();
    setRequestTenantCode(tenantProvider.getState().current?.code || '');
    uni.showToast({ title: '当前账号暂未加入该企业', icon: 'none' });
    this.openTenantSelectGate();
    return false;
  }

  /** openTenantSelectGate 进入强制组织选择页，清空页面栈避免未选组织时返回业务页。 */
  private openTenantSelectGate(): void {
    if (!authProvider.isLoggedIn()) return;
    if (this.isSingleTenantMode()) {
      this.openHomeFallback();
      return;
    }
    uni.reLaunch({ url: TENANT_SELECT_URL });
  }

  /** openHomeFallback 静默回到首页，避免单组织模式暴露组织选择入口。 */
  private openHomeFallback(): void {
    this.pendingRoute = '';
    try {
      const pages = getCurrentPages();
      const top = pages[pages.length - 1] as { route?: string } | undefined;
      if (top?.route === HOME_PATH) return;
    } catch {
      /* 部分运行时拿不到页面栈，继续使用 tab 首页兜底。 */
    }
    uni.switchTab({ url: HOME_URL });
  }

  /** clearInvalidLaunchTenant 清理无效 org-id 并进入专用提示页。 */
  private clearInvalidLaunchTenant(): void {
    clearPendingLaunchTenantCode();
    setRequestTenantCode(tenantProvider.getState().current?.code || '');
    this.redirectToOrgIdNotFound();
  }

  /** redirectToOrgIdNotFound 跳转到公开的组织不可用提示页，避免继续发起登录。 */
  private redirectToOrgIdNotFound(): void {
    try {
      const pages = getCurrentPages();
      const top = pages[pages.length - 1] as { route?: string } | undefined;
      if (top?.route === ORG_ID_NOT_FOUND_PATH) return;
    } catch {
      /* 低版本运行时可能没有页面栈，直接重启到兜底页。 */
    }
    uni.reLaunch({ url: ORG_ID_NOT_FOUND_URL });
  }

  private async ensureFamily(targetPath: string): Promise<boolean> {
    const currentTenant = tenantProvider.getState().current;
    if (!currentTenant?.code) {
      this.openTenantSelectGate();
      return false;
    }

    // 全局分享和个人页只依赖企业身份，不要求先加入或创建项目。
    if (['/packageDevice/pages/share-manage/index', '/pages/mine/index'].includes(targetPath)) return true;

    // 不复用列表页的搜索筛选；分页核验历史项目仍可访问且处于正常状态。
    const currentFamily = currentFamilyProvider.getSelection(currentTenant.code);
    const firstPage = await projectService.getList(1, 100, undefined, 1);
    const list = [...(firstPage.list || [])];
    let restored = list.find((item) => item.projectID === currentFamily.projectID);
    for (let page = 2; currentFamily.projectID && !restored && list.length < firstPage.total; page++) {
      const result = await projectService.getList(page, 100, undefined, 1);
      if (!result.list.length) throw new Error('项目列表未完整加载');
      list.push(...result.list);
      restored = result.list.find((item) => item.projectID === currentFamily.projectID);
    }
    if (list.length === 0) {
      const authState = authProvider.getState();
      const suggestedName = suggestFamilyName({
        nickName: authState.user?.nickName,
        userName: authState.user?.userName,
        tenantName: currentTenant.name,
        existingNames: [],
      });
      // #ifdef MP-WEIXIN
      uni.redirectTo({
        url: `/packageUser/pages/project-entry/index?suggestedName=${encodeURIComponent(suggestedName)}`,
      });
      // #endif
      // #ifndef MP-WEIXIN
      uni.redirectTo({
        url: `/packageUser/pages/family-edit/index?mode=create&source=guard&suggestedName=${encodeURIComponent(suggestedName)}`,
      });
      // #endif
      return false;
    }

    const selected = restored || list[0];
    currentFamilyProvider.switchFamily(selected.projectID, selected.projectName, currentTenant.code);
    return true;
  }
}

export const appContextProvider = new AppContextProvider();
