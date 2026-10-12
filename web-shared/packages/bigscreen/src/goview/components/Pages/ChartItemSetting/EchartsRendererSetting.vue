<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { EchartsRenderer } from '@/settings/chartThemes';

const props = defineProps<{ includeInherit?: boolean; modelValue?: EchartsRenderer }>();
const emits = defineEmits(['update:modelValue']);

const INHERIT_VALUE = 'inherit';

const handleChange = (val: EchartsRenderer & typeof INHERIT_VALUE) => {
  emits('update:modelValue', val === INHERIT_VALUE ? undefined : val);
};

const rendererList = [
  {
    value: 'svg',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.performsBetterWhenScaling'); },
  },
  {
    value: 'canvas',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.largeDatasetsTypicallyOver1000RecordsOr'); },
  },
  ...(props.includeInherit
    ? [
        {
          value: INHERIT_VALUE,
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.inheritGlobalConfigurationByDefault'); },
        },
      ]
    : []),
];
</script>
<template>
  <n-radio-group :value="props.modelValue || INHERIT_VALUE" @update:value="handleChange">
    <n-space>
      <n-tooltip :show-arrow="false" trigger="hover" v-for="item in rendererList" :key="item.value">
        <template #trigger>
          <n-radio :value="item.value">
            {{ item.value }}
          </n-radio>
        </template>
        {{ item.desc }}
      </n-tooltip>
    </n-space>
  </n-radio-group>
</template>
