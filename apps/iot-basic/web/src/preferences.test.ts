import { describe, expect, it } from 'vitest';

import { overridesPreferences } from './preferences';

describe('org iot client preferences', () => {
  // 客户端形态与 edge-self 取值一致：关闭全局页签栏、开放偏好设置面板
  // （期望值对齐实际客户端配置，区别于 SaaS 管理端应用模板的开启页签/关闭偏好）
  it('客户端形态关闭全局页签栏', () => {
    expect(overridesPreferences.tabbar?.enable).toBe(false);
    expect(overridesPreferences.tabbar?.persist).toBe(false);
  });

  it('uses auto theme mode by default across SaaS apps', () => {
    expect(overridesPreferences.theme?.mode).toBe('auto');
  });

  it('客户端开放偏好设置面板和语言切换', () => {
    expect(overridesPreferences.app?.enablePreferences).toBe(true);
    expect(overridesPreferences.widget?.languageToggle).toBe(true);
  });
});
