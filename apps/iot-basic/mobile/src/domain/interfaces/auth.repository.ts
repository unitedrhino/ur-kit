import type { UserEntity } from '../entities/user.entity';

export interface WxLoginParams {
  code: string;
}

export interface WxQuickLoginParams {
  code: string;
  phoneCode: string;
}

export interface PwdLoginParams {
  account: string;
  password: string;
}

/** 手机号验证码登录参数 */
export interface PhoneLoginParams {
  /** 登录手机号 */
  phone: string;
  /** 用户输入的短信验证码 */
  code: string;
  /** 验证码发送接口返回的验证码 ID */
  codeID: string;
}

export interface PhoneCaptchaParams {
  phone: string;
  use: 'bindAccount' | 'login' | 'register' | 'changePwd' | 'forgetPwd';
}

export type CaptchaUse = 'bindAccount' | 'login' | 'register' | 'changePwd' | 'forgetPwd';

export interface EmailCaptchaParams {
  email: string;
  use: CaptchaUse;
}

export interface PhoneCaptchaResult {
  codeID: string;
  expire: number;
  url?: string;
}

export interface BindPhoneParams {
  phone: string;
  code: string;
  codeID: string;
}

export interface BindEmailParams {
  email: string;
  code: string;
  codeID: string;
}

/** 微信小程序手机号授权绑定参数 */
export interface BindPhoneByWxPhoneParams {
  /** 微信 getPhoneNumber 返回的一次性手机号授权 code */
  phoneCode: string;
}

export interface UpdateUserProfileParams {
  nickName?: string;
  sex?: number;
  avatar?: string;
}

export interface UploadUserAvatarResult {
  filePath: string;
  fileUri: string;
}

export interface ChangePwdParams {
  /** 验证方式: 'pwd' | 'phone' | 'email' */
  type: string;
  /** 新密码 (sha256) */
  password: string;
  /** 旧密码 (sha256)，首次设置密码时可省略 */
  oldPassword?: string;
  /** 验证码 */
  code?: string;
  /** 验证码 ID */
  codeID?: string;
}

export interface ForgetPwdParams {
  type: 'phone' | 'email';
  account: string;
  password: string;
  code: string;
  codeID: string;
}

export interface IAuthRepository {
  loginByWx(params: WxLoginParams): Promise<UserEntity>;
  registerByWxPhone(params: WxQuickLoginParams): Promise<UserEntity>;
  loginByPassword(params: PwdLoginParams): Promise<UserEntity>;
  loginByPhone(params: PhoneLoginParams): Promise<UserEntity>;
  sendPhoneCaptcha(params: PhoneCaptchaParams): Promise<PhoneCaptchaResult>;
  sendEmailCaptcha(params: EmailCaptchaParams): Promise<PhoneCaptchaResult>;
  bindPhoneBySms(params: BindPhoneParams): Promise<void>;
  bindPhoneByWxPhone(params: BindPhoneByWxPhoneParams): Promise<void>;
  bindEmailByCode(params: BindEmailParams): Promise<void>;
  updateUserProfile(params: UpdateUserProfileParams): Promise<void>;
  uploadUserAvatar(filePath: string): Promise<UploadUserAvatarResult>;
  refreshToken(): Promise<string>;
  getUserInfo(): Promise<UserEntity>;
  changePwd(params: ChangePwdParams): Promise<void>;
  forgetPwd(params: ForgetPwdParams): Promise<void>;
  logout(): Promise<void>;
}
