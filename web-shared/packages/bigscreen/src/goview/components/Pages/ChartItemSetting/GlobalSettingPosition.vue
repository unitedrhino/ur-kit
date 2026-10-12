<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue';

import { SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting';

type positionType = {
  bottom?: null | number | string;
  left?: null | number | string;
  right?: null | number | string;
  top?: null | number | string;
};

const props = defineProps({
  targetData: {
    type: Object as PropType<positionType>,
    required: true,
  },
});
</script>

<template>
  <SettingItemBox v-if="targetData" :name="editorT('iotApp.devicePage.location')">
    <SettingItem :name="editorT('bigscreenEditor.dynamic.message1', { value: String(targetData.left || 0) })">
      <n-input-number v-model:value="targetData.left" size="small" step="10" />
    </SettingItem>
    <SettingItem :name="editorT('bigscreenEditor.dynamic.message2', { value: String(targetData.top || 0) })">
      <n-input-number v-model:value="targetData.top" size="small" step="10" />
    </SettingItem>
  </SettingItemBox>
</template>
