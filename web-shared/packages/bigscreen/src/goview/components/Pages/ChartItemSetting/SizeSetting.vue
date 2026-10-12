<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PickCreateComponentType } from '@/packages/index.type';

import type { PropType } from 'vue';

import { SettingItemBox } from '@/components/Pages/ChartItemSetting';

const props = defineProps({
  chartAttr: {
    type: Object as PropType<Omit<PickCreateComponentType<'attr'>, 'conNode' | 'node'>>,
    required: true,
  },
  isGroup: {
    type: Boolean,
    required: false,
  },
});
</script>

<template>
  <SettingItemBox :name="editorT('bigscreenEditor.ui.dimensions')">
    <n-input-number v-model:value="chartAttr.w" :min="50" :disabled="isGroup" size="small" placeholder="px">
      <template #prefix>
        <n-text depth="3">{{ editorT('bigscreenEditor.ui.width2') }}</n-text>
      </template>
    </n-input-number>
    <n-input-number v-model:value="chartAttr.h" :min="50" :disabled="isGroup" size="small" placeholder="px">
      <template #prefix>
        <n-text depth="3">{{ editorT('bigscreenEditor.ui.height2') }}</n-text>
      </template>
    </n-input-number>
  </SettingItemBox>
</template>
