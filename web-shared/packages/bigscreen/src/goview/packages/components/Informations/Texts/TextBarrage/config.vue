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
      <setting-item :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.fontColor"></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number v-model:value="optionData.fontSize" size="small" :placeholder="editorT('bigscreenEditor.ui.componentFontSize')"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFontWeight')">
        <n-select v-model:value="optionData.fontWeight" size="small" :options="fontWeightOptions" />
      </setting-item>

      <setting-item :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number v-model:value="optionData.letterSpacing" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterLetterSpacing')"></n-input-number>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentShadow')">
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowShadow') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.colorShadow"></n-color-picker
      ></setting-item>
      <setting-item name="x">
        <n-input-number v-model:value="optionData.hShadow" size="small"></n-input-number
      ></setting-item>
      <setting-item name="y">
        <n-input-number v-model:value="optionData.vShadow" size="small"></n-input-number
      ></setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentBlur')">
        <n-input-number v-model:value="optionData.blurShadow" size="small"></n-input-number
      ></setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('bigscreenEditor.ui.animation')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentAnimationSpeed')">
        <n-input-number
          v-model:value="optionData.animationSpeed"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentAnimationSpeed')"
          :min="0"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentAnimationInterval')">
        <n-input-number
          v-model:value="optionData.animationTime"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentAnimationInterval')"
          :min="0"
        ></n-input-number>
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { option, FontWeightEnum, FontWeightObject } from './config'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

const fontWeightOptions = [
  {
    label: FontWeightEnum.NORMAL,
    value: FontWeightObject[FontWeightEnum.NORMAL]
  },
  {
    label: FontWeightEnum.BOLD,
    value: FontWeightObject[FontWeightEnum.BOLD]
  }
]
</script>
