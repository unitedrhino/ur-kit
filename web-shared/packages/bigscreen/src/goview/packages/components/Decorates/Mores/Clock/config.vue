<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentClock')" expanded>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentDial')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.bgColor"></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBorderColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.borderColor"></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBorderSize')">
        <n-input-number v-model:value="optionData.border" size="small" :step="0.5" :min="0"></n-input-number>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPointer')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.color"></n-color-picker>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})
</script>
