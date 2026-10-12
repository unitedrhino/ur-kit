<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLine')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLineCount')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentIncreaseDownward')">
        <n-input-number size="small" :min="0" v-model:value="optionData.lineNum"></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentIncreaseUpward')">
        <n-input-number size="small" :min="0" v-model:value="optionData.lineNumUp"></n-input-number>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLineStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLineThickness')">
        <n-input-number size="small" :min="1" v-model:value="optionData.lineWidth"></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBackgroundBarColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.backgroundCol"></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFlowColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.animateCol"></n-color-picker>
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
