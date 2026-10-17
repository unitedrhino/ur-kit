/** 本文件验证内嵌客户端清单与实际菜单翻译链路，覆盖组织前缀、语言切换和企业自定义名称。 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { $t, i18n } from '../../../../../web-shared/packages/locales/src';
import { presetMenuI18n } from '../../../../../web-shared/packages/saas/src/utils/preset-menu-i18n';
import { applyTenantMenuOverrides } from '../../../../../web-shared/packages/saas/src/utils/tenant-menu';
import { translatePresetAppName, translatePresetAppDesc } from '../../../../../web-shared/packages/saas/src/utils/app-catalog-i18n';
import { materializeTenantMenuMap } from './org-scope';

// 菜单转换不请求 API；语言渲染保留真实 vue-i18n，仅隔离与本测试无关的页面副作用。
vi.mock('@vben/api', () => ({ CoreApi: {} }));
vi.mock('@vben-core/composables', () => ({ useSimpleLocale: () => ({ setSimpleLocale: () => {} }) }));
vi.mock('../../../../../web-shared/packages/saas/src/locales', async () => import('../../../../../web-shared/packages/locales/src'));
vi.mock('@vben/saas/locales', async () => import('../../../../../web-shared/packages/locales/src'));

/** root 是独立 ur-kit 根目录，所有测试材料均从当前仓读取。 */
const root = resolve(import.meta.dirname, '../../../../..');
/** definitions 是运行后端内嵌的实际四端模板，避免测试复制另一套菜单。 */
const definitions = JSON.parse(readFileSync(resolve(root, 'apps/iot-basic/backend/bootstrap/client.json'), 'utf8'));
/** locales 是当前公开共享包实际提供的语言集合。 */
const locales = readdirSync(resolve(root, 'web-shared/packages/saas/src/locales/langs'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);

/** loadMessages 合并基础和业务语言，与应用装载的命名空间一致。 */
function loadMessages(locale: string) {
  const messages: Record<string, unknown> = {};
  for (const directory of ['web-shared/packages/locales/src/langs', 'web-shared/packages/saas/src/locales/langs']) {
    for (const file of readdirSync(resolve(root, directory, locale))) {
      if (file.endsWith('.json')) messages[file.slice(0, -5)] = JSON.parse(readFileSync(resolve(root, directory, locale, file), 'utf8'));
    }
  }
  i18n.global.setLocaleMessage(locale, messages);
  i18n.global.locale.value = locale;
}

describe('客户端注册清单的多语言显示', () => {
  it('四端名称、描述与 23 个菜单在 14 种语言下均可用真实翻译渲染', () => {
    expect(locales).toHaveLength(14);
    expect(definitions[0].menus).toHaveLength(23);
    // 菜单模板已归本仓维护，保留仪表盘路由、组件和原可见性契约。
    expect(definitions[0].menus.find((menu: { path: string }) => menu.path === '/dashboard')).toMatchObject({
      defaultName: '概要', component: 'dashboard/index', defaultIsHideInMenu: 2,
    });
    for (const locale of locales) {
      loadMessages(locale);
      for (const menu of definitions[0].menus) {
        const key = presetMenuI18n[menu.path]?.find((item) => item.source === menu.defaultName)?.key;
        expect(key, `${locale}:${menu.path}`).toBeTruthy();
        expect(i18n.global.te(key!, locale)).toBe(true);
        expect($t(key!)).not.toBe(key);
        expect($t(key!)).not.toContain('\uFFFD');
      }
      for (const { app } of definitions) {
        expect(i18n.global.te(`ui.appCatalog.${app.id}.name`, locale)).toBe(true);
        expect(i18n.global.te(`ui.appCatalog.${app.id}.desc`, locale)).toBe(true);
        expect(translatePresetAppName(app.id, app.name)).toBe($t(`ui.appCatalog.${app.id}.name`));
        expect(translatePresetAppDesc(app.id, app.desc)).toBe($t(`ui.appCatalog.${app.id}.desc`));
      }
    }
  });

  it('组织路径覆盖后保持翻译键，语言切换立即改变显示，企业改名保留原文', () => {
    const definition = definitions[0].menus.find((menu: { path: string }) => menu.path === '/dashboard');
    const map = materializeTenantMenuMap(new Map([['/dashboard', { name: definition.defaultName, menu: definition }]]), 'demo');
    const menu = applyTenantMenuOverrides([{ name: 'overview', path: '/demo/dashboard' }], map as any)[0]!;
    expect(menu.name).toBe('orgIotClient.routes.overview');
    loadMessages('zh-CN');
    expect($t(menu.name)).toBe('概要');
    loadMessages('en-US');
    expect($t(menu.name)).toBe('Overview');
    loadMessages('th-TH');
    expect($t(menu.name)).not.toBe('概要');
    expect($t(menu.name)).not.toBe('Overview');
    const customMap = materializeTenantMenuMap(new Map([['/dashboard', { name: '我的工厂', menu: definition }]]), 'demo');
    expect(applyTenantMenuOverrides([{ name: 'overview', path: '/demo/dashboard' }], customMap as any)[0]?.name).toBe('我的工厂');
  });
});
