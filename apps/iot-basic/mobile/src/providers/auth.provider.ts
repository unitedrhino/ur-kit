import { authService } from '../services/auth.service';
import type { UserEntity } from '../domain/entities/user.entity';
import { eventBus } from '../utils/event-bus';
import { tenantProvider } from './tenant.provider';
import { currentFamilyProvider } from './current-family.provider';
import { webSocketProvider } from './websocket.provider';
import { ApiError, isApiError } from '../utils/request';
import type { CaptchaUse, UpdateUserProfileParams } from '../domain/interfaces/auth.repository';

const WX_LOGIN_PROBE_EXPECTED_CODES = [1000003, 1000033];

/** isExpectedWxLoginProbeError 判断微信登录探测返回的正常分支错误。 */
function isExpectedWxLoginProbeError(error: unknown): error is ApiError {
  return isApiError(error) && WX_LOGIN_PROBE_EXPECTED_CODES.includes(error.code);
}

export interface AuthState {
  user: UserEntity | null;
  loading: boolean;
  loggedIn: boolean;
  /** sessionConfirmed 表示本轮运行中 token 已通过登录或鉴权接口确认有效。 */
  sessionConfirmed: boolean;
  postLoginStep: 'home' | 'bindPhone';
  /** 登录后检测到用户未设置密码，需要弹出设置密码界面 */
  needSetPassword: boolean;
}

class AuthProvider {
  private state: AuthState = {
    user: null,
    loading: false,
    loggedIn: false,
    sessionConfirmed: false,
    postLoginStep: 'home',
    needSetPassword: false,
  };

  private listeners: Set<(state: AuthState) => void> = new Set();
  private authEventsReady = false;

  getState(): AuthState {
    return this.state;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private update(partial: Partial<AuthState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /** applyAuthenticatedUser 写入刚通过登录/鉴权流程确认的用户态。 */
  private applyAuthenticatedUser(user: UserEntity): void {
    this.update({
      user,
      loggedIn: true,
      sessionConfirmed: !!user.token,
      loading: false,
      postLoginStep: authService.resolvePostLoginStep(user),
    });
  }

  /** clearSessionState 清空所有和当前账号绑定的前端运行态。 */
  private clearSessionState(): void {
    webSocketProvider.disconnect();
    currentFamilyProvider.clear('');
    tenantProvider.clear();
    eventBus.emit('auth:logout');
    this.update({ user: null, loggedIn: false, sessionConfirmed: false, postLoginStep: 'home', needSetPassword: false });
  }

  /** 初始化认证失效监听，统一处理 HTTP 401 触发的被动登出。 */
  private initAuthEvents(): void {
    if (this.authEventsReady) return;
    this.authEventsReady = true;
    eventBus.on('auth:token-expired', () => {
      this.clearSessionState();
    });
    eventBus.on('auth:token-confirmed', (token) => {
      const confirmedToken = String(token || '');
      if (!confirmedToken || !this.state.user) return;
      this.update({
        user: { ...this.state.user, token: confirmedToken },
        loggedIn: true,
        sessionConfirmed: true,
      });
    });
  }

  init(): void {
    this.initAuthEvents();
    const loggedIn = authService.isLoggedIn();
    const user = loggedIn ? authService.getCachedUser() : null;
    this.update({
      user,
      loggedIn,
      sessionConfirmed: false,
      postLoginStep: user ? authService.resolvePostLoginStep(user) : 'home',
    });
  }

  isLoggedIn(): boolean {
    return this.state.loggedIn && this.state.sessionConfirmed;
  }

  /** restoreSession 启动时统一确认缓存 token 是否仍有效。 */
  async restoreSession(): Promise<boolean> {
    if (!this.state.loggedIn) return false;
    this.update({ loading: true });
    try {
      const user = await authService.getUserInfo();
      this.applyAuthenticatedUser(user);
      return true;
    } catch {
      await authService.logout();
      this.clearSessionState();
      return false;
    } finally {
      this.update({ loading: false });
    }
  }

  async loginByWx(): Promise<void> {
    this.update({ loading: true });
    try {
      const user = await authService.loginByWx();
      this.applyAuthenticatedUser(user);
    } catch (e) {
      if (isExpectedWxLoginProbeError(e)) {
        this.update({ loading: false });
        throw e;
      }
      console.error('[AuthProvider] loginByWx error', e);
      this.update({ loading: false });
      throw new Error((e as Error)?.message || '微信登录失败');
    }
  }

  async quickLoginByWxPhone(phoneCode: string): Promise<void> {
    this.update({ loading: true });
    try {
      const user = await authService.quickLoginByWxPhone(phoneCode);
      this.applyAuthenticatedUser(user);
    } catch (e) {
      console.error('[AuthProvider] quickLoginByWxPhone error', e);
      this.update({ loading: false });
      throw new Error((e as Error)?.message || '微信手机号快捷登录失败');
    }
  }

  async loginByPassword(account: string, password: string): Promise<void> {
    this.update({ loading: true });
    try {
      const user = await authService.loginByPassword(account, password);
      this.applyAuthenticatedUser(user);
    } catch (e) {
      console.error('[AuthProvider] loginByPassword error', e);
      this.update({ loading: false });
      throw new Error((e as Error)?.message || '登录失败');
    }
  }

  /** 使用手机号验证码登录并刷新全局认证状态 */
  async loginByPhone(phone: string, code: string, codeID: string): Promise<void> {
    this.update({ loading: true });
    try {
      const user = await authService.loginByPhone(phone, code, codeID);
      this.applyAuthenticatedUser(user);
    } catch (e) {
      console.error('[AuthProvider] loginByPhone error', e);
      this.update({ loading: false });
      throw new Error((e as Error)?.message || '手机号登录失败');
    }
  }

  /** 发送 App 登录页使用的手机号验证码 */
  async sendPhoneLoginCaptcha(phone: string): Promise<{ codeID: string; expire: number; url?: string }> {
    return authService.sendPhoneLoginCaptcha(phone);
  }

  async sendPhoneCaptcha(phone: string): Promise<{ codeID: string; expire: number; url?: string }> {
    return authService.sendPhoneCaptcha(phone, 'bindAccount');
  }

  async sendPhoneCaptchaForUse(phone: string, use: CaptchaUse): Promise<{ codeID: string; expire: number; url?: string }> {
    return authService.sendPhoneCaptchaForUse(phone, use);
  }

  async sendEmailCaptcha(email: string, use: CaptchaUse): Promise<{ codeID: string; expire: number; url?: string }> {
    return authService.sendEmailCaptcha(email, use);
  }

  async bindPhoneBySms(phone: string, code: string, codeID: string): Promise<void> {
    this.update({ loading: true });
    try {
      const user = await authService.bindPhoneBySms(phone, code, codeID);
      this.applyAuthenticatedUser(user);
    } catch (e) {
      console.error('[AuthProvider] bindPhoneBySms error', e);
      this.update({ loading: false });
      throw new Error((e as Error)?.message || '绑定手机号失败');
    }
  }

  async bindEmailByCode(email: string, code: string, codeID: string): Promise<void> {
    this.update({ loading: true });
    try {
      const user = await authService.bindEmailByCode(email, code, codeID);
      this.applyAuthenticatedUser(user);
    } catch (e) {
      console.error('[AuthProvider] bindEmailByCode error', e);
      this.update({ loading: false });
      throw new Error((e as Error)?.message || '绑定邮箱失败');
    }
  }

  async updateUserProfile(params: UpdateUserProfileParams): Promise<void> {
    this.update({ loading: true });
    try {
      const user = await authService.updateUserProfile(params);
      this.applyAuthenticatedUser(user);
    } catch (e) {
      console.error('[AuthProvider] updateUserProfile error', e);
      this.update({ loading: false });
      throw new Error((e as Error)?.message || '保存个人资料失败');
    }
  }

  async uploadUserAvatar(filePath: string): Promise<{ filePath: string; fileUri: string }> {
    return authService.uploadUserAvatar(filePath);
  }

  /** 使用微信小程序手机号授权 code 绑定当前账号并刷新全局认证状态 */
  async bindPhoneByWxPhone(phoneCode: string): Promise<void> {
    this.update({ loading: true });
    try {
      const user = await authService.bindPhoneByWxPhone(phoneCode);
      this.applyAuthenticatedUser(user);
    } catch (e) {
      console.error('[AuthProvider] bindPhoneByWxPhone error', e);
      this.update({ loading: false });
      throw new Error((e as Error)?.message || '绑定手机号失败');
    }
  }

  /** 检查用户是否需要设置密码，返回 true 表示需要弹出设置密码界面 */
  async checkNeedSetPassword(): Promise<boolean> {
    try {
      const need = await authService.checkNeedSetPassword();
      this.update({ needSetPassword: need });
      return need;
    } catch {
      return false;
    }
  }

  /** 设置密码（首次设置，type='pwd'，无需 oldPassword） */
  async setPassword(password: string): Promise<void> {
    await authService.changePwd({ type: 'pwd', password });
    this.update({ needSetPassword: false });
  }

  async changePasswordByOldPassword(oldPassword: string | undefined, password: string): Promise<void> {
    await authService.changePwd({ type: 'pwd', oldPassword, password });
    if (this.state.user) {
      this.update({ user: { ...this.state.user, password } });
    }
    await this.checkNeedSetPassword();
  }

  async changePasswordByPhoneOrEmail(type: 'phone' | 'email', code: string, codeID: string, password: string): Promise<void> {
    await authService.changePwd({ type, code, codeID, password });
  }

  async forgetPassword(params: { type: 'phone' | 'email'; account: string; code: string; codeID: string; password: string }): Promise<void> {
    await authService.forgetPwd(params);
  }

  async logout(): Promise<void> {
    await authService.logout();
    this.clearSessionState();
  }
}

export const authProvider = new AuthProvider();
