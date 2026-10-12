<script lang="ts" setup>
import type { GlobalThemeOverrides } from 'naive-ui';

import { computed, watch } from 'vue';

import { getRequestClient } from '@vben/api';
import { useNaiveDesignTokens } from '@vben/hooks';
import { preferences, usePreferences } from '@vben/preferences';
import { getAvatarUrl } from '@vben/saas/utils';
import { useProjectStore, useSystemConfigStore } from '@vben/stores';

import { darkTheme, lightTheme, NConfigProvider, NDialogProvider, NMessageProvider, NNotificationProvider } from 'naive-ui';
import { naiveLocaleFor } from '@vben/saas/utils';
import { ProConfigProvider, enUS as proEnUS, zhCN as proZhCN } from 'pro-naive-ui';

defineOptions({ name: 'App' });

const systemConfigStore = useSystemConfigStore();

const projectStore = useProjectStore();

// --- 全局项目维度过滤：通过 header + body 双通道注入 project-id ---
const client = getRequestClient();
client.addRequestInterceptor({
  fulfilled: async (config) => {
    const pid = projectStore.currentProjectID;
    if (pid) {
      // 1. header 注入：供后端 ctxs.GetHandle 提取到 UserCtx.ProjectID
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)['project-id'] = pid;
      // 2. body 注入：部分 things API 的 logic 直接读取 body.projectID
      const url = config.url || '';
      if (
        (url.includes('/api/v1/things/') || url.includes('/api/v1/data/')) &&
        config.data &&
        typeof config.data === 'object' &&
        !config.data.projectID // 不覆盖已有的 projectID（如删除/更新特定项目）
      ) {
        config.data = { ...config.data, projectID: pid };
      }
    }
    return config;
  },
});

// --- 启用侧边栏项目选择器 ---
projectStore.enableSidebarSelector();

// 项目列表拉取 + 进入流程（0/1/多项目弹窗）已迁移到 router guard 的 setupProjectGuard

const { commonTokens } = useNaiveDesignTokens();
const { isDark } = usePreferences();

const tokenLocale = computed(() => naiveLocaleFor(preferences.app.locale).locale);
const tokenDateLocale = computed(() => naiveLocaleFor(preferences.app.locale).dateLocale);
const tokenTheme = computed(() => (isDark.value ? darkTheme : lightTheme));

const themeOverrides = computed((): GlobalThemeOverrides => {
  return {
    common: commonTokens,
    // Card 组件的 hover 效果主要通过全局 CSS 样式增强
    // 详见 /saas/styles/card-hover
  };
});

const proTokenLocale = computed(() => (preferences.app.locale === 'zh-CN' ? proZhCN : proEnUS));

const linkHref = computed(() => {
  if (!systemConfigStore?.systemConfig?.oem?.avatar) {
    return '';
  }

  return getAvatarUrl(systemConfigStore.systemConfig.oem.avatar);
});

function setLinkIcon(link: string) {
  if (!link) return;

  const existingFavicon = document.querySelector('link[rel="icon"]');
  if (existingFavicon) {
    existingFavicon.remove();
  }

  // 创建新的 favicon 链接
  const newLink = document.createElement('link');
  newLink.rel = 'icon';
  newLink.href = link;
  document.head.append(newLink);
}

// 监听 linkHref 的变化，自动更新 favicon
watch(
  linkHref,
  (newLink) => {
    setLinkIcon(newLink);
  },
  { immediate: true }, // immediate: true 确保初始加载时也会执行
);
</script>

<template>
  <NConfigProvider :date-locale="tokenDateLocale" :locale="tokenLocale" :theme="tokenTheme" :theme-overrides="themeOverrides" class="h-full">
    <ProConfigProvider :locale="proTokenLocale" class="h-full">
      <NNotificationProvider>
        <NMessageProvider>
          <NDialogProvider>
            <RouterView />
          </NDialogProvider>
        </NMessageProvider>
      </NNotificationProvider>
    </ProConfigProvider>
  </NConfigProvider>
</template>
