/** 密码登录凭证生成：只在提交边界对用户输入做一次摘要。 */
import type { LoginPasswordMode } from './mode';

import { CoreApi } from '@vben/api';
import CryptoJS from 'crypto-js';

/** PwdLoginFormValues 保留登录表单中的账号、验证码及其他既有字段。 */
type PwdLoginFormValues = Record<string, any>;

/** buildPwdLoginPayload 根据模式生成登录请求；values.password 必须是原始输入，codeID 为验证码标识。 */
export function buildPwdLoginPayload(values: PwdLoginFormValues, codeID: string, mode: LoginPasswordMode = 'sha256') {
  // 不按输入长度猜测摘要格式，避免把恰好为十六进制的用户密码当成已处理凭证。
  const rawPassword = (values.password as string) || '';
  const digest = mode === 'md5' ? CryptoJS.MD5 : CryptoJS.SHA256;
  return {
    ...values,
    password: rawPassword ? digest(rawPassword).toString(CryptoJS.enc.Hex) : '',
    loginType: CoreApi.UserLoginReqLoginTypeEnum.PWD,
    pwdType: mode === 'md5' ? 2 : 1,
    codeID,
  };
}
