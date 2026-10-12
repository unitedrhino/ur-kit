import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';

import { CoreApi } from '@vben/api';

import { buildPwdLoginPayload } from './login.utils';

describe('buildPwdLoginPayload', () => {
  it.each(['中文密码！🌏', ' a+&?/% 密码 ', '0123456789abcdef0123456789abcdef', ''])('两种模式仅对原始密码处理一次：%s', (password) => {
    const values = { account: 'compat-user', password, code: '1234' };
    for (const mode of ['md5', 'sha256', 'md5'] as const) {
      const payload = buildPwdLoginPayload(values, 'captcha-compat', mode);
      expect(payload.password).toBe(password ? createHash(mode).update(password).digest('hex') : '');
      expect(payload.pwdType).toBe(mode === 'md5' ? 2 : 1);
      expect(payload.account).toBe(values.account);
      expect(payload.code).toBe(values.code);
      expect(payload.codeID).toBe('captcha-compat');
      expect(payload.loginType).toBe(CoreApi.UserLoginReqLoginTypeEnum.PWD);
    }
    expect(values.password).toBe(password);
  });
  it('SHA256 hashes the password before sending (pwdType=1)', () => {
    const payload = buildPwdLoginPayload(
      {
        account: 'godLei7',
        code: 'abcd',
        password: 'godLei6+',
      },
      'captcha-1',
    );

    expect(payload.account).toBe('godLei7');
    expect(payload.code).toBe('abcd');
    // SHA256("godLei6+") = c2f5b60b032d5024165067e1a995e36f0dcf46b1c31f63b81ec33847dc1e3c40
    expect(payload.password).toBe('c2f5b60b032d5024165067e1a995e36f0dcf46b1c31f63b81ec33847dc1e3c40');
    expect(payload.password).toHaveLength(64);
    expect(payload.codeID).toBe('captcha-1');
    expect(payload.loginType).toBe(CoreApi.UserLoginReqLoginTypeEnum.PWD);
    expect(payload.pwdType).toBe(1);
  });

  it('sends empty string when password is empty', () => {
    const payload = buildPwdLoginPayload(
      { account: 'test', password: '' },
      'captcha-1',
    );

    expect(payload.password).toBe('');
  });
});
