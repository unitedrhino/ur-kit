import { request } from '../../utils/request';
import type {
  IAuthRepository,
  WxLoginParams,
  WxQuickLoginParams,
  PwdLoginParams,
  PhoneLoginParams,
  PhoneCaptchaParams,
  PhoneCaptchaResult,
  EmailCaptchaParams,
  BindPhoneParams,
  BindEmailParams,
  BindPhoneByWxPhoneParams,
  UpdateUserProfileParams,
  UploadUserAvatarResult,
  ChangePwdParams,
  ForgetPwdParams,
} from '../../domain/interfaces/auth.repository';
import type { UserEntity } from '../../domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { sha256 } from '../../utils/crypto';
import { uploadFile } from '../../utils/upload';

/** 微信小程序手机号授权绑定时传给后端的 codeID 标记 */
const WX_MINI_PHONE_CODE_ID = 'wxMiniPPhoneCode';

export class AuthRepositoryImpl implements IAuthRepository {
  private persistLoginResponse(resp: Record<string, unknown>): UserEntity {
    const tokenObj = resp.token as Record<string, string> | undefined;
    const token = tokenObj?.accessToken || '';
    uni.setStorageSync('token', token);
    const info = (resp.info || resp) as Record<string, unknown>;
    return UserMapper.toEntity(info, token);
  }

  async loginByWx(params: WxLoginParams): Promise<UserEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/login',
      data: { loginType: 'wxMiniP', code: params.code },
      expectedApiCodes: [1000003, 1000033],
    });
    return this.persistLoginResponse(resp);
  }

  async registerByWxPhone(params: WxQuickLoginParams): Promise<UserEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/register',
      data: {
        regType: 'wxMiniP',
        code: params.code,
        expand: {
          phoneCode: params.phoneCode,
        },
        isWithLogin: true,
      },
    });
    return this.persistLoginResponse(resp);
  }

  async loginByPassword(params: PwdLoginParams): Promise<UserEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/login',
      data: {
        loginType: 'pwd',
        account: params.account,
        password: sha256(params.password),
        pwdType: 1,
      },
    });
    return this.persistLoginResponse(resp);
  }

  /** 使用手机号验证码登录，未注册手机号由后端 client 登录逻辑处理 */
  async loginByPhone(params: PhoneLoginParams): Promise<UserEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/login',
      data: {
        loginType: 'phone',
        account: params.phone,
        code: params.code,
        codeID: params.codeID,
      },
    });
    return this.persistLoginResponse(resp);
  }

  async sendPhoneCaptcha(params: PhoneCaptchaParams): Promise<PhoneCaptchaResult> {
    return request<PhoneCaptchaResult>({
      url: '/api/v1/system/user/self/captcha',
      data: {
        account: params.phone,
        type: 'phone',
        use: params.use,
      },
    });
  }

  async sendEmailCaptcha(params: EmailCaptchaParams): Promise<PhoneCaptchaResult> {
    return request<PhoneCaptchaResult>({
      url: '/api/v1/system/user/self/captcha',
      data: {
        account: params.email,
        type: 'email',
        use: params.use,
      },
    });
  }

  async bindPhoneBySms(params: BindPhoneParams): Promise<void> {
    await request({
      url: '/api/v1/system/user/self/bind-account',
      data: {
        type: 'phone',
        account: params.phone,
        code: params.code,
        codeID: params.codeID,
      },
    });
  }

  async bindEmailByCode(params: BindEmailParams): Promise<void> {
    await request({
      url: '/api/v1/system/user/self/bind-account',
      data: {
        type: 'email',
        account: params.email,
        code: params.code,
        codeID: params.codeID,
      },
    });
  }

  /** 使用微信小程序 getPhoneNumber code 给当前登录账号绑定手机号 */
  async bindPhoneByWxPhone(params: BindPhoneByWxPhoneParams): Promise<void> {
    await request({
      url: '/api/v1/system/user/self/bind-account',
      data: {
        type: 'phone',
        code: params.phoneCode,
        codeID: WX_MINI_PHONE_CODE_ID,
      },
    });
  }

  async updateUserProfile(params: UpdateUserProfileParams): Promise<void> {
    await request({
      url: '/api/v1/system/user/self/update',
      data: {
        ...(params.nickName !== undefined ? { nickName: params.nickName } : {}),
        ...(params.sex !== undefined ? { sex: params.sex } : {}),
        ...(params.avatar !== undefined ? { avatar: params.avatar } : {}),
      },
    });
  }

  async uploadUserAvatar(filePath: string): Promise<UploadUserAvatarResult> {
    return uploadFile(filePath);
  }

  async refreshToken(): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/refresh-token',
    });
    const tokenObj = resp.token as Record<string, string> | undefined;
    const token = tokenObj?.accessToken || String(resp.token || '');
    uni.setStorageSync('token', token);
    return token;
  }

  async getUserInfo(): Promise<UserEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/get-one',
    });
    return UserMapper.toEntity(resp, uni.getStorageSync('token'));
  }

  async changePwd(params: ChangePwdParams): Promise<void> {
    await request({
      url: '/api/v1/system/user/self/change-pwd',
      data: {
        type: params.type,
        password: sha256(params.password),
        ...(params.oldPassword ? { oldPassword: sha256(params.oldPassword) } : {}),
        ...(params.code ? { code: params.code } : {}),
        ...(params.codeID ? { codeID: params.codeID } : {}),
      },
    });
  }

  async forgetPwd(params: ForgetPwdParams): Promise<void> {
    await request({
      url: '/api/v1/system/user/self/forget-pwd',
      data: {
        type: params.type,
        account: params.account,
        password: sha256(params.password),
        code: params.code,
        codeID: params.codeID,
      },
    });
  }

  async logout(): Promise<void> {
    uni.removeStorageSync('token');
  }
}
