/**
 * qrcode-login-visibility.test 验证扫码页返回入口只指向真实存在的其他登录方式。
 */
import { describe, expect, it } from 'vitest';

import { canShowQrCodeBack, isWxOpenOnlyLogin } from './qrcode-login-visibility';

describe('qrcode login visibility', () => {
  it('只有微信开放平台登录时隐藏返回按钮', () => {
    expect(isWxOpenOnlyLogin(['wxOpen'])).toBe(true);
    expect(canShowQrCodeBack(true, ['wxOpen'])).toBe(false);
  });

  it('存在账号密码等其他登录方式时显示返回按钮', () => {
    expect(isWxOpenOnlyLogin(['pwd', 'wxOpen'])).toBe(false);
    expect(canShowQrCodeBack(true, ['pwd', 'wxOpen'])).toBe(true);
  });

  it('配置加载完成前不闪现返回按钮', () => {
    expect(canShowQrCodeBack(true, null)).toBe(false);
  });

  it('调用方关闭返回能力时始终隐藏按钮', () => {
    expect(canShowQrCodeBack(false, ['pwd', 'wxOpen'])).toBe(false);
  });
});
