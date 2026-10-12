<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('iotApp.devicePage.logInfo')" :expanded="true">
    <setting-item-box :name="editorT('orgManage.session.chText')" :alone="true">
      <setting-item>
        <n-input v-model:value="optionData.dataset" type="textarea" size="small"></n-input>
      </setting-item>
    </setting-item-box>
  </collapse-item>
  <collapse-item :name="editorT('bigscreenEditor.ui.componentStyle')" :expanded="true">
    <setting-item-box :name="editorT('orgManage.session.chText')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number v-model:value="optionData.size" size="small" :placeholder="editorT('bigscreenEditor.ui.componentFontSize')"></n-input-number>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentGradientColorParameters')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentStartValue')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.gradient.from"></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentEndValue')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.gradient.to"></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentOffsetAngle')">
        <n-input-number v-model:value="optionData.gradient.deg" size="small" :placeholder="editorT('bigscreenEditor.ui.componentColorRotation')"></n-input-number>
      </setting-item>
    </setting-item-box>

  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { option } from './config'
import {
  CollapseItem,
  SettingItemBox,
  SettingItem
} from '@/components/Pages/ChartItemSetting'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})
</script>
