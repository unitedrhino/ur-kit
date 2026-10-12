import { CoreApi, requestClient } from '@vben/api';

export const Api = {
  /**
   * 无需登录获取应用信息
   * /api/v1/system/app/core/get-one
   */
  async read(appID: string, withAgreementCodes: string[] = []) {
    return await CoreApi.postApiV1SystemAppCoreGetOne({
      id: appID,
      withAgreementCodes: withAgreementCodes.length > 0 ? withAgreementCodes : undefined,
    });
  },
  /**
   * 公开预览渲染协议（无需登录）
   * /api/v1/system/agreement/public-preview-render
   */
  async publicPreviewRender(data: { appID?: string; content?: string; id?: string }) {
    return requestClient.post<{ content: string }>('/api/v1/system/agreement/public-preview-render', data);
  },
  /**
   * 获取图片验证码
   * 用于登录、注册、找回密码等
   * /api/v1/system/user/self/captcha
   */
  async getImageCaptcha(account: string = '', useType: CoreApi.UserCaptchaReqUseEnum = CoreApi.UserCaptchaReqUseEnum.LOGIN) {
    return await CoreApi.postApiV1SystemUserSelfCaptcha({
      account,
      type: CoreApi.UserCaptchaReqTypeEnum.IMAGE,
      use: useType,
    });
  },

  /**
   * 发送手机验证码
   * /api/v1/system/user/self/captcha
   */
  async sendPhoneCode(phoneNumber: string, code?: string, codeID?: string, useType: CoreApi.UserCaptchaReqUseEnum = CoreApi.UserCaptchaReqUseEnum.LOGIN) {
    return await CoreApi.postApiV1SystemUserSelfCaptcha({
      account: phoneNumber,
      code,
      codeID,
      type: CoreApi.UserCaptchaReqTypeEnum.PHONE,
      use: useType,
    });
  },

  /**
   * 发送邮箱验证码
   * /api/v1/system/user/self/captcha
   */
  async sendEmailCode(email: string, code?: string, codeID?: string, useType: CoreApi.UserCaptchaReqUseEnum = CoreApi.UserCaptchaReqUseEnum.LOGIN) {
    return await CoreApi.postApiV1SystemUserSelfCaptcha({
      account: email,
      code,
      codeID,
      type: CoreApi.UserCaptchaReqTypeEnum.EMAIL,
      use: useType,
    });
  },
  async thirdAuthStart(provider: CoreApi.UserThirdAuthStartReqProviderEnum, platform: string = 'web') {
    return await CoreApi.postApiV1SystemUserSelfThirdAuthStart({
      provider,
      platform,
    });
  },
  async thirdLogin(provider: CoreApi.UserThirdLoginReqProviderEnum, code: string, state: string, platform: string = 'web') {
    return await CoreApi.postApiV1SystemUserSelfThirdLogin({
      provider,
      code,
      state,
      platform,
    });
  },
  async thirdRegister(payload: CoreApi.UserThirdRegisterReq) {
    return await CoreApi.postApiV1SystemUserSelfThirdRegister(payload);
  },
};
