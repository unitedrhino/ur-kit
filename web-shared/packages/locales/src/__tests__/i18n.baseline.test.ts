/**
 * 文件说明：vue-i18n 国际化装配回归基线测试（OWASP 依赖漏洞治理 · 阶段零）
 *
 * 覆盖依赖与调用点：
 * - `vue-i18n`（apps/web/packages/locales/src/i18n.ts）：
 *   createI18n（legacy:false 组合式 API）、loadLocalesMapFromDir 语言包按目录分组装载、
 *   loadLocaleMessages 动态加载语言包并切换 locale、global.t 翻译、语言切换。
 *
 * 目的：固化当前 vue-i18n 版本下 i18n 装配与消息装载行为，阶段三/四升级
 * vue-i18n（9.x/10.x → 11+）后重跑，确认翻译链路不回归。
 */
import type { App } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import {
  i18n,
  loadLocaleMessages,
  loadLocalesMapFromDir,
  setLanguageSwitchHook,
  setupI18n,
  switchLocale,
} from '@vben/locales';

/** 构造最小假 app，仅需要 use() 供 i18n 插件安装 */
function createFakeApp(): App {
  return { use: () => {} } as unknown as App;
}

describe('loadLocalesMapFromDir 语言包分组（纯函数）', () => {
  it('应按目录段分组语言并生成异步装载函数', async () => {
    const modules = {
      './langs/zh-CN/common.json': async () => ({ default: { ok: '确定' } }),
      './langs/zh-CN/ui.json': async () => ({ default: { title: '标题' } }),
      './langs/en-US/common.json': async () => ({ default: { ok: 'OK' } }),
    };
    const map = loadLocalesMapFromDir(/\.\/langs\/([^/]+)\/(.*)\.json$/, modules);

    expect(Object.keys(map).sort()).toEqual(['en-US', 'zh-CN']);

    const zhMessages = await map['zh-CN']!();
    expect(zhMessages.default).toEqual({ common: { ok: '确定' }, ui: { title: '标题' } });
  });

  it('不匹配正则的模块路径应被忽略', () => {
    const map = loadLocalesMapFromDir(/\.\/langs\/([^/]+)\/(.*)\.json$/, {
      './other/a.json': async () => ({}),
    });
    expect(Object.keys(map)).toHaveLength(0);
  });
});

describe('i18n 实例与消息装载', () => {
  it('legacy:false 下 global.locale 应为可写的 ref（组合式 API）', () => {
    expect(typeof i18n.global.locale.value).toBe('string');
  });

  it('loadLocaleMessages("zh-CN") 后应切换语言并能翻译语言包 key', async () => {
    // loadLocaleMessages 依赖 setupI18n 初始化 loadMessages，须先装配
    await setupI18n(createFakeApp(), { defaultLocale: 'zh-CN' });
    await loadLocaleMessages('zh-CN');
    expect(i18n.global.locale.value).toBe('zh-CN');
    // 语言包固定 key：packages/locales/src/langs/zh-CN/authentication.json
    expect(i18n.global.t('authentication.loginSuccess')).toBe('登录成功');
    expect(i18n.global.t('common.logout')).toBe('退出登录');
  });

  it('setupI18n 应完成插件安装并落默认语言', async () => {
    const app = createFakeApp();
    await setupI18n(app, { defaultLocale: 'zh-CN' });
    expect(i18n.global.locale.value).toBe('zh-CN');
  });

  it('缺失 key 应回退返回 key 本身', async () => {
    await loadLocaleMessages('zh-CN');
    expect(i18n.global.t('definitely.not.exist.key')).toBe('definitely.not.exist.key');
  });

  it('英文缺键应回退中文', async () => {
    await setupI18n(createFakeApp(), { defaultLocale: 'en-US' });
    expect(i18n.global.t('authentication.loginSuccess')).not.toBe('authentication.loginSuccess');
    await loadLocaleMessages('zh-CN');
  });

  it('泰语语言包应能加载通用界面文案', async () => {
    await setupI18n(createFakeApp(), { defaultLocale: 'zh-CN' });
    await loadLocaleMessages('th-TH');
    expect(i18n.global.locale.value).toBe('th-TH');
    expect(i18n.global.t('authentication.loginSuccess')).not.toBe('登录成功');
    await loadLocaleMessages('zh-CN');
  });

  it('装载失败与过时的慢请求不能覆盖当前语言', async () => {
    await setupI18n(createFakeApp(), {
      defaultLocale: 'zh-CN',
      loadMessages: async (lang) => {
        if (lang === 'en-US') throw new Error('load failed');
        return {};
      },
    });
    await expect(loadLocaleMessages('en-US')).rejects.toThrow('load failed');
    expect(i18n.global.locale.value).toBe('zh-CN');

    let release: (() => void) | undefined;
    await setupI18n(createFakeApp(), {
      defaultLocale: 'zh-CN',
      loadMessages: async (lang) => {
        if (lang === 'en-US') await new Promise<void>((resolve) => { release = resolve; });
        return {};
      },
    });
    const stale = loadLocaleMessages('en-US');
    expect(await loadLocaleMessages('zh-CN')).toBe(true);
    release?.();
    expect(await stale).toBe(false);
    expect(i18n.global.locale.value).toBe('zh-CN');
  });

  it('语言提交后应同步 html 书写方向：阿语和乌尔都语为 rtl，其余语言为 ltr', async () => {
    await setupI18n(createFakeApp(), { defaultLocale: 'zh-CN' });
    await loadLocaleMessages('zh-CN');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    await loadLocaleMessages('ar');
    expect(i18n.global.locale.value).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    await loadLocaleMessages('ur-PK');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    await loadLocaleMessages('en-US');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('个人偏好保存失败时回滚，快速切换最终保持最后选择', async () => {
    await setupI18n(createFakeApp(), { defaultLocale: 'zh-CN' });
    setLanguageSwitchHook(async () => { throw new Error('save failed'); });
    await expect(switchLocale('en-US')).rejects.toThrow('save failed');
    expect(i18n.global.locale.value).toBe('zh-CN');

    let release: (() => void) | undefined;
    const saved: string[] = [];
    setLanguageSwitchHook(async (lang) => {
      if (lang === 'en-US') await new Promise<void>((resolve) => { release = resolve; });
      saved.push(lang);
    });
    const first = switchLocale('en-US');
    const second = switchLocale('zh-CN');
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    release?.();
    await Promise.all([first, second]);
    expect(i18n.global.locale.value).toBe('zh-CN');
    expect(saved).toEqual(['en-US', 'zh-CN']);
    setLanguageSwitchHook(null);
  });
});
