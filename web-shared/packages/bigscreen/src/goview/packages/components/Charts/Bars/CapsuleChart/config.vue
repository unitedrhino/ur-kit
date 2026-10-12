<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData"> </global-setting>
  <!-- 胶囊柱图 -->
  <collapse-item :name="editorT('bigscreenEditor.ui.componentCapsuleBarChart')" expanded>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLayout')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentLeftMargin')">
        <n-input-number v-model:value="optionData.paddingLeft" :min="10" :step="1" size="small"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentRightMargin')">
        <n-input-number v-model:value="optionData.paddingRight" :min="10" :step="1" size="small"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentBlockHeightPx')">
        <n-input-number v-model:value="optionData.itemHeight" :min="0" :step="1" size="small"></n-input-number>
      </setting-item>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenManagement.ui.text')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentAllTextSizes')">
        <n-input-number v-model:value="optionData.valueFontSize" :min="0" :step="1" size="small"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('iotApp.schemaForm.unitLabel')">
        <n-input v-model:value="optionData.unit" size="small"></n-input>
      </setting-item>

      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.showValue" size="small"></n-switch>
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowValue') }}</n-text>
        </n-space>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('orgManage.flow.fwColor')">
      <setting-item v-for="(item, index) in optionData.colors" :key="index" :name="editorT('bigscreenEditor.dynamic.colorNumber', { index: String(index) })">
        <n-color-picker v-model:value="optionData.colors[index]" size="small" :modes="['hex']"></n-color-picker>
      </setting-item>
    </SettingItemBox>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType, computed } from 'vue'
import { GlobalSetting, CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option & GlobalThemeJsonType>,
    required: true
  }
})
</script>
