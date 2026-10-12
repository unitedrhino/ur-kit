<script setup lang="ts">
import type { SupportedLanguagesType } from '@vben/locales';

import { SUPPORT_LANGUAGES } from '@vben/constants';
import { Languages } from '@vben/icons';
import { switchLocale } from '@vben/locales';
import { preferences } from '@vben/preferences';

import { VbenDropdownRadioMenu, VbenIconButton } from '@vben-core/shadcn-ui';

defineOptions({
  name: 'LanguageToggle',
});

/** handleUpdate 串行处理个人语言修改，避免快速切换造成服务端偏好与界面不一致。 */
async function handleUpdate(value: string | undefined) {
  if (!value) return;
  const locale = value as SupportedLanguagesType;
  try {
    await switchLocale(locale);
  } catch (error) {
    console.error('语言切换失败，已恢复原语言', error);
  }
}
</script>

<template>
  <div>
    <VbenDropdownRadioMenu :menus="SUPPORT_LANGUAGES" :model-value="preferences.app.locale" @update:model-value="handleUpdate">
      <VbenIconButton class="hover:animate-[shrink_0.3s_ease-in-out]">
        <Languages class="text-foreground size-4" />
      </VbenIconButton>
    </VbenDropdownRadioMenu>
  </div>
</template>
