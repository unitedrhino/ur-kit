import { computed } from 'vue';

import { usePreferences } from '@vben/preferences';
import '@vben/styles';

import { createDiscreteApi, darkTheme, lightTheme } from 'naive-ui';

const { isDark } = usePreferences();

const themeOverridesProviderProps = computed(() => ({
  themeOverrides: isDark.value ? darkTheme : lightTheme,
}));

const themeProviderProps = computed(() => ({
  theme: isDark.value ? darkTheme : lightTheme,
}));

export const { dialog, loadingBar, message, modal, notification } = createDiscreteApi(['message', 'dialog', 'notification', 'loadingBar', 'modal'], {
  configProviderProps: themeProviderProps,
  loadingBarProviderProps: themeOverridesProviderProps,
  messageProviderProps: themeOverridesProviderProps,
  notificationProviderProps: themeOverridesProviderProps,
});
