/**
 * wechat-login-relay.test 验证微信扫码登录只允许回跳到明确配置的环境。
 */
import { describe, expect, it } from 'vitest';

import {
  createWxLoginState,
  resolveWxLoginTargetKey,
  wxOpenCallbackUri,
} from './wechat-login-relay';

describe('wechat login relay', () => {
  it('始终使用微信开放平台已登记的 bak 回调入口', () => {
    expect(wxOpenCallbackUri).toBe('https://bak.ykhl.vip/wx-open/callback');
  });

  it('为生产和本地环境生成受控目标 state', () => {
    expect(createWxLoginState('iot-client.ykhl.vip', 'nonce')).toBe('prod.nonce');
    expect(createWxLoginState('localhost', 'nonce')).toBe('local.nonce');
    expect(createWxLoginState('127.0.0.1', 'nonce')).toBe('local.nonce');
  });

  it('拒绝未配置域名，避免形成任意地址回跳', () => {
    expect(() => resolveWxLoginTargetKey('evil.example.com')).toThrow(
      '当前域名未配置微信登录回调',
    );
  });
});
