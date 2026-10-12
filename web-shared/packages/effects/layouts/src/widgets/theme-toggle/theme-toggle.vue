<script lang="ts" setup>
import type { ThemeModeType } from '@vben/types';

import type { Component } from 'vue';
import type { VbenDropdownMenuItem } from '@vben-core/shadcn-ui';

import { computed } from 'vue';

import { MoonStar, Sun, SunMoon } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences, updatePreferences } from '@vben/preferences';

import { VbenDropdownRadioMenu, VbenIconButton } from '@vben-core/shadcn-ui';

defineOptions({
  name: 'ThemeToggle',
});

withDefaults(defineProps<{ shouldOnHover?: boolean }>(), {
  shouldOnHover: false,
});

const THEME_ICONS: Record<ThemeModeType, Component> = {
  auto: SunMoon,
  dark: MoonStar,
  light: Sun,
};

const menus = computed((): VbenDropdownMenuItem[] => [
  {
    icon: Sun,
    label: $t('preferences.theme.light'),
    value: 'light',
  },
  {
    icon: MoonStar,
    label: $t('preferences.theme.dark'),
    value: 'dark',
  },
  {
    icon: SunMoon,
    label: $t('preferences.followSystem'),
    value: 'auto',
  },
]);

const currentThemeIcon = computed(() => THEME_ICONS[preferences.theme.mode]);
const currentThemeLabel = computed(() => {
  switch (preferences.theme.mode) {
    case 'auto': {
      return $t('preferences.followSystem');
    }
    case 'dark': {
      return $t('preferences.theme.dark');
    }
    case 'light': {
      return $t('preferences.theme.light');
    }
  }
});

function handleChange(value: string | undefined) {
  if (!value) return;
  updatePreferences({
    theme: { mode: value as ThemeModeType },
  });
}
</script>
<template>
  <div>
    <VbenDropdownRadioMenu :menus="menus" :model-value="preferences.theme.mode" @update:model-value="handleChange">
      <VbenIconButton :aria-label="currentThemeLabel" :title="currentThemeLabel" class="hover:animate-[shrink_0.3s_ease-in-out]">
        <component :is="currentThemeIcon" class="text-foreground size-4" />
      </VbenIconButton>
    </VbenDropdownRadioMenu>
  </div>
</template>
