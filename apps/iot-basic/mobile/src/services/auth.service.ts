import { AuthRepositoryImpl } from '../data/repositories/auth.repository.impl';
import type { UserEntity } from '../domain/entities/user.entity';
import type {
  IAuthRepository,
  ChangePwdParams,
  PhoneCaptchaResult,
  CaptchaUse,
  UpdateUserProfileParams,
  UploadUserAvatarResult,
  ForgetPwdParams,
} from '../domain/interfaces/auth.repository';
import { localStorage } from '../data/datasources/local-storage.datasource';
import { base64Encode, base64Decode } from '../utils/crypto';

export class AuthService {
  constructor(private readonly authRepo: IAuthRepository = new AuthRepositoryImpl()) {}

  private async requestWxLoginCode(): Promise<string> {
    // #ifdef MP-WEIXIN
    return new Promise<string>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (res: any) => resolve(res.code),
        fail: (err: any) => reject(new Error(err.errMsg || '微信登录失败')),
      });
    });
    // #endif
    // #ifndef MP-WEIXIN
    throw new Error('当前平台不支持微信登录');
    // #endif
  }

  private persistUser(user: UserEntity): UserEntity {
    localStorage.set('user', user);
    return user;
  }

  async loginByWx(): Promise<UserEntity> {
    const code = await this.requestWxLoginCode();
    const user = await this.authRepo.loginByWx({ code });
    return this.persistUser(user);
  }

  async quickLoginByWxPhone(phoneCode: string): Promise<UserEntity> {
    const code = await this.requestWxLoginCode();
    try {
      const user = await this.authRepo.registerByWxPhone({ code, phoneCode });
      return this.persistUser(user);
    } catch (error) {
      const message = (error as Error)?.message || '';
      const canFallbackToWxLogin = message.includes('重复注册') || message.includes('已绑定');
      if (!canFallbackToWxLogin) {
        throw error;
      }
      return this.loginByWx();
    }
  }

  async loginByPassword(account: string, password: string): Promise<UserEntity> {
    const user = await this.authRepo.loginByPassword({ account, password });
    return this.persistUser(user);
  }

  /** 使用手机号验证码登录并持久化用户信息 */
  async loginByPhone(phone: string, code: string, codeID: string): Promise<UserEntity> {
    const user = await this.authRepo.loginByPhone({ phone, code, codeID });
    return this.persistUser(user);
  }

  /** 发送登录用途的手机号验证码，绑定手机号仍走 bindAccount 场景 */
  async sendPhoneLoginCaptcha(phone: string): Promise<PhoneCaptchaResult> {
    return this.authRepo.sendPhoneCaptcha({ phone, use: 'login' });
  }

  async sendPhoneCaptcha(phone: string, use: CaptchaUse = 'bindAccount'): Promise<PhoneCaptchaResult> {
    return this.authRepo.sendPhoneCaptcha({ phone, use });
  }

  async sendPhoneCaptchaForUse(phone: string, use: CaptchaUse): Promise<PhoneCaptchaResult> {
    return this.authRepo.sendPhoneCaptcha({ phone, use });
  }

  async sendEmailCaptcha(email: string, use: CaptchaUse): Promise<PhoneCaptchaResult> {
    return this.authRepo.sendEmailCaptcha({ email, use });
  }

  async bindPhoneBySms(phone: string, code: string, codeID: string): Promise<UserEntity> {
    await this.authRepo.bindPhoneBySms({ phone, code, codeID });
    const user = await this.authRepo.getUserInfo();
    return this.persistUser(user);
  }

  async bindEmailByCode(email: string, code: string, codeID: string): Promise<UserEntity> {
    await this.authRepo.bindEmailByCode({ email, code, codeID });
    const user = await this.authRepo.getUserInfo();
    return this.persistUser(user);
  }

  async updateUserProfile(params: UpdateUserProfileParams): Promise<UserEntity> {
    await this.authRepo.updateUserProfile(params);
    const user = await this.authRepo.getUserInfo();
    return this.persistUser(user);
  }

  async uploadUserAvatar(filePath: string): Promise<UploadUserAvatarResult> {
    return this.authRepo.uploadUserAvatar(filePath);
  }

  /** 使用微信小程序手机号授权 code 绑定当前账号并刷新用户信息 */
  async bindPhoneByWxPhone(phoneCode: string): Promise<UserEntity> {
    await this.authRepo.bindPhoneByWxPhone({ phoneCode });
    const user = await this.authRepo.getUserInfo();
    return this.persistUser(user);
  }

  async refreshToken(): Promise<string> {
    return this.authRepo.refreshToken();
  }

  async getUserInfo(): Promise<UserEntity> {
    const user = await this.authRepo.getUserInfo();
    return this.persistUser(user);
  }

  async logout(): Promise<void> {
    await this.authRepo.logout();
    localStorage.remove('user');
  }

  /** 检查当前用户是否需要设置密码（password 为空表示未设置） */
  async checkNeedSetPassword(): Promise<boolean> {
    const user = await this.authRepo.getUserInfo();
    localStorage.set('user', user);
    return !user.password;
  }

  /** 设置/修改密码 */
  async changePwd(params: ChangePwdParams): Promise<void> {
    await this.authRepo.changePwd(params);
  }

  async forgetPwd(params: ForgetPwdParams): Promise<void> {
    await this.authRepo.forgetPwd(params);
  }

  resolvePostLoginStep(user: UserEntity): 'home' | 'bindPhone' {
    return user.phone ? 'home' : 'bindPhone';
  }

  getCachedUser(): UserEntity | null {
    return localStorage.get<UserEntity>('user');
  }

  isLoggedIn(): boolean {
    return !!uni.getStorageSync('token');
  }

  /** 保存记住的账号 */
  saveRememberedAccount(account: string): void {
    if (!account) return;
    try {
      localStorage.set('saved_account', base64Encode(account));
      localStorage.set('remember_account', true);
    } catch { /* ignore */ }
  }

  /** 获取记住的账号 */
  getRememberedAccount(): string | null {
    try {
      const enabled = localStorage.get<boolean>('remember_account');
      if (!enabled) return null;
      const encoded = localStorage.get<string>('saved_account');
      if (!encoded) return null;
      return base64Decode(encoded);
    } catch {
      return null;
    }
  }

  /** 清除记住的账号 */
  clearRememberedAccount(): void {
    localStorage.remove('saved_account');
    localStorage.remove('remember_account');
  }

  /** 是否启用了记住账号 */
  isRememberEnabled(): boolean {
    return localStorage.get<boolean>('remember_account') ?? false;
  }
}

export const authService = new AuthService();
