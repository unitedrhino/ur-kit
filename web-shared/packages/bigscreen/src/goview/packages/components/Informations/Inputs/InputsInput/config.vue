<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('bigscreenEditor.ui.componentInputSettings')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenManagement.ui.defaultValue')" :alone="true">
      <n-input  v-model:value="optionData.dataset"  :placeholder="editorT('bigscreenEditor.ui.componentTheDefaultIs0IfLeftEmpty')"/>
    </setting-item-box>
  </collapse-item>
</template>
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { CollapseItem, SettingItemBox } from '@/components/Pages/ChartItemSetting'
import { option } from './config'
defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})
</script>