<!-- 文件说明：编辑器主题及组件库语言跟随后台偏好设置。 -->
<script lang="ts" setup>
import { computed } from 'vue';

import { GoAppProvider } from '@/components/GoAppProvider';
import { I18n } from '@/components/I18n';
import { useCode, useThemeOverridesHook } from '@/hooks';
import { preferences, usePreferences } from '@vben/preferences';
import { naiveLocaleFor } from '@vben/saas/utils';
import { darkTheme } from 'naive-ui';

const overridesTheme = useThemeOverridesHook();
const hljsTheme = useCode();
const { isDark } = usePreferences();

/** 组件库本身未提供的语言使用共享映射的既定回退策略。 */
const locale = computed(() => naiveLocaleFor(preferences.app.locale).locale);
/** 日期控件与界面语言同步。 */
const dateLocale = computed(() => naiveLocaleFor(preferences.app.locale).dateLocale);
const currentTheme = computed(() => (isDark.value ? darkTheme : undefined));
</script>

<template>
  <n-config-provider :theme="currentTheme" :hljs="hljsTheme" :locale="locale" :date-locale="dateLocale" :theme-overrides="overridesTheme">
    <GoAppProvider>
      <I18n />
      <router-view />
    </GoAppProvider>
  </n-config-provider>
</template>
