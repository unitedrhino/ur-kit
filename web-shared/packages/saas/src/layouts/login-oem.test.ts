/** 登录页 OEM 缺省文案的当前语言回退及自定义内容保留测试。 */
import { describe, expect, it, vi } from 'vitest';

import { LOGIN_OEM_DEFAULTS, LOGIN_SLOGAN_TEMPLATES, resolveLoginOemConfig, resolveSloganImage } from './login-oem';

vi.mock('../locales', () => ({
  $t: (key: string) => {
    const messages: Record<string, string> = {
      'authOem.loginFormDescription': 'Enter your account details to manage your projects.',
      'authOem.loginFormTitle': 'Welcome back 👋🏻',
      'authOem.loginPageDescription': 'An IoT platform ready to use out of the box',
      'authOem.loginPageTitle': 'IoT Platform',
    };
    return messages[key] ?? key;
  },
}));

describe('login OEM config', () => {
  it('falls back to the current locale and default slogan template', () => {
    const config = resolveLoginOemConfig({});

    expect(config.loginPageTitle).toBe('IoT Platform');
    expect(config.loginPageDescription).toBe('An IoT platform ready to use out of the box');
    expect(config.loginFormTitle).toBe('Welcome back 👋🏻');
    expect(config.loginFormDescription).toBe('Enter your account details to manage your projects.');
    expect(config.sloganImageType).toBe('template');
    expect(config.sloganImageTemplate).toBe('iot-platform');
  });

  it('preserves administrator-provided copy', () => {
    const config = resolveLoginOemConfig({ loginFormTitle: 'Custom greeting', loginPageTitle: 'Custom product' });

    expect(config.loginFormTitle).toBe('Custom greeting');
    expect(config.loginPageTitle).toBe('Custom product');
  });

  it('resolves built-in templates and uploaded slogans', () => {
    expect(LOGIN_SLOGAN_TEMPLATES.map((item) => item.value)).toEqual(['iot-platform', 'device-cloud', 'data-dashboard']);

    expect(resolveSloganImage(LOGIN_OEM_DEFAULTS)).toContain('default-slogan');
    expect(
      resolveSloganImage({
        ...LOGIN_OEM_DEFAULTS,
        sloganImage: 'https://cdn.example.com/custom.webp',
        sloganImageType: 'upload',
      }),
    ).toBe('https://cdn.example.com/custom.webp');
  });
});
