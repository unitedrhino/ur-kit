<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('bigscreenEditor.ui.componentDropdownSettings')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenManagement.ui.defaultValue')" :alone="true">
      <n-select size="small" v-model:value="optionData.selectValue" :options="optionData.dataset" />
    </setting-item-box>
  </collapse-item>
</template>

<script lang="ts" setup>
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
