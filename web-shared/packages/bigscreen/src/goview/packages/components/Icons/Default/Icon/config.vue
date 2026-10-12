<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('orgManage.flow.propertyTitle')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentStyle')">
      <setting-item :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.color"></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.dimensions')">
        <n-input-number v-model:value="optionData.size" size="small" :min="0" :placeholder="editorT('bigscreenEditor.ui.dimensions')"></n-input-number>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentQuickRotation')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentRotationCanAlsoBeConfiguredUnderTransforms')">
        <n-select v-model:value="optionData.rotate" size="small" :options="rotateMode"></n-select>
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { option } from './config'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

// 旋转方式
const rotateMode = [
  {
    value: 0,
    label: '0°'
  },
  {
    value: 90,
    label: '90°'
  },
  {
    value: 180,
    label: '180°'
  },
  {
    value: 270,
    label: '270°'
  }
]
</script>
