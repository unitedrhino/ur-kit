/**
 * 文件说明：应用启动期动态页面标题装配，收敛各应用"页面标题 - 应用名"的统一拼接口径。
 *
 * 应用名取值顺序：系统配置 oem.title（与登录页左上角品牌名同源）→ 构建注入的 VITE_APP_TITLE；
 * 任一段为空时不输出" - "分隔符，避免出现"登录 -"这类孤立横线。
 */
import { watchEffect } from 'vue';
import type { Router } from 'vue-router';

import { useTitle } from '@vueuse/core';

import { preferences } from '@vben/preferences';
import { useSystemConfigStore } from '@vben/stores';

import { $t } from '../locales';

/**
 * buildPageTitle 拼接页面标题与应用名，任一段为空或纯空白时不输出" - "分隔符。
 * @param pageName 已翻译的当前路由标题，可为空
 * @param appName  应用品牌名，可为空
 * @returns 浏览器标签页标题
 */
export function buildPageTitle(pageName: string, appName: string): string {
  return [pageName.trim(), appName.trim()].filter(Boolean).join(' - ');
}

/**
 * setupDynamicPageTitle 装配浏览器标签页标题的响应式更新，需在 Pinia 初始化完成后调用。
 *
 * 跟踪当前路由 meta.title 与系统配置变化：已配置 OEM 的部署显示"页面名 - 品牌名"，
 * 未配置时回退 preferences.app.name（VITE_APP_TITLE），两者皆空时只显示页面名。
 * @param router 应用路由实例
 */
export function setupDynamicPageTitle(router: Router): void {
  const systemConfigStore = useSystemConfigStore();
  watchEffect(() => {
    if (!preferences.app.dynamicTitle) return;

    const routeTitle = router.currentRoute.value.meta?.title;
    const appName = systemConfigStore.systemConfig?.oem?.title?.trim() || preferences.app.name || '';
    useTitle(buildPageTitle(routeTitle ? $t(routeTitle) : '', appName));
  });
}
