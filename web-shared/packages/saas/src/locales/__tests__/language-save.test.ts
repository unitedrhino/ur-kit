/** 文件说明：验证头像菜单切换个人语言时，自动模式的存储语义与失败回滚。 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initializeEffectiveLanguage, savePersonalLanguage } from '../language';

const mocks = vi.hoisted(() => {
  const user = { language: 'zh-CN' };
  return {
    user,
    load: vi.fn(),
    update: vi.fn(),
    post: vi.fn(),
    config: vi.fn(),
    registerHook: vi.fn(),
    access: { accessToken: 'test-token' },
    preferences: { app: { locale: 'zh-CN' } },
  };
});

vi.mock('@vben/api', () => ({
  CoreApi: { postApiV1SystemUserSelfUpdate: mocks.post },
}));
vi.mock('@vben/locales', () => ({
  loadLocaleMessages: mocks.load,
  setLanguageSwitchHook: mocks.registerHook,
}));
vi.mock('@vben/preferences', () => ({
  preferences: mocks.preferences,
  updatePreferences: mocks.update,
}));
vi.mock('@vben/stores', () => ({
  useAccessStore: () => mocks.access,
  useUserStore: () => ({
    userInfo: mocks.user,
    $patch: (patch: (state: { userInfo: typeof mocks.user }) => void) => patch({ userInfo: mocks.user }),
  }),
  useSystemConfigStore: () => ({ getSystemConfig: mocks.config }),
}));

describe('个人语言快捷切换', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', { languages: ['en-US'] });
    mocks.user.language = 'zh-CN';
    mocks.preferences.app.locale = 'zh-CN';
    mocks.config.mockResolvedValue({ defaultLanguage: 'zh-CN' });
    mocks.load.mockResolvedValue(true);
    mocks.post.mockResolvedValue({});
    mocks.access.accessToken = 'test-token';
    mocks.update.mockImplementation(({ app }: { app: { locale: string } }) => {
      mocks.preferences.app.locale = app.locale;
    });
  });

  it('应用启动注册语言切换保存动作并更新菜单选中语言', async () => {
    await initializeEffectiveLanguage();
    const hook = mocks.registerHook.mock.lastCall?.[0];
    expect(typeof hook).toBe('function');
    await hook('pt-BR');
    expect(mocks.post).toHaveBeenCalledWith({ language: 'pt-BR' });
    expect(mocks.user.language).toBe('pt-BR');
    expect(mocks.preferences.app.locale).toBe('pt-BR');
  });

  it('自动模式清除个人设置，按浏览器语言显示', async () => {
    await savePersonalLanguage('');
    expect(mocks.load).toHaveBeenCalledWith('en-US');
    expect(mocks.post).toHaveBeenCalledWith({ language: '' });
    expect(mocks.user.language).toBe('');
    expect(mocks.preferences.app.locale).toBe('en-US');
  });

  it('保存失败时恢复原语言与个人勾选', async () => {
    mocks.post.mockRejectedValueOnce(new Error('network unavailable'));
    await expect(savePersonalLanguage('')).rejects.toThrow('network unavailable');
    expect(mocks.load.mock.calls.map(([language]) => language)).toEqual(['en-US', 'zh-CN']);
    expect(mocks.user.language).toBe('zh-CN');
    expect(mocks.preferences.app.locale).toBe('zh-CN');
  });

  it('目标语言包加载失败时不写入个人设置', async () => {
    mocks.load.mockRejectedValueOnce(new Error('locale unavailable'));
    await expect(savePersonalLanguage('')).rejects.toThrow('locale unavailable');
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.user.language).toBe('zh-CN');
  });
});
