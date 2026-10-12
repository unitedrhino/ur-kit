<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('bigscreenEditor.ui.componentFlip')" :expanded="true">
    <setting-item-box :name="editorT('iotApp.deviceDetail.content')">
      <setting-item :name="editorT('iotApp.schemaForm.startValue')">
        <n-input-number v-model:value="optionData.dataset" size="small" :min="0"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentDecimalPlaces')">
        <n-input-number v-model:value="optionData.displayDecimals" size="small" :min="0" :step="1"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFlipCardCount')">
        <n-input-number v-model:value="optionData.flipperLength" size="small" :min="1"></n-input-number>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('bigscreenEditor.ui.componentStyle')">
      <setting-item :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number v-model:value="optionData.flipperWidth" size="small" :min="1"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.height2')">
        <n-input-number v-model:value="optionData.flipperHeight" size="small" :min="1"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentBorder')">
        <n-input-number v-model:value="optionData.flipperBorderWidth" size="small" :min="0" :max="10"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number v-model:value="optionData.flipperRadius" size="small" :min="0"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFlipInterval')">
        <n-input-number v-model:value="optionData.flipperGap" size="small" :min="0"></n-input-number>
      </setting-item>
      <setting-item />
      <setting-item :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <n-color-picker
          size="small"
          :show-alpha="false"
          :modes="['hex']"
          v-model:value="optionData.flipperBgColor"
        ></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFontColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.flipperTextColor"></n-color-picker>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('iotApp.productPage.schemaTypeAction')">
      <setting-item :name="editorT('bigscreenEditor.ui.animation')">
        <n-select
          v-model:value="optionData.flipperType"
          size="small"
          :options="[
            { label: editorT('bigscreenEditor.ui.componentFlipDown'), value: 'down' },
            { label: editorT('bigscreenEditor.ui.componentFlipUp'), value: 'up' }
          ]"
        ></n-select>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFlipSpeedMilliseconds')">
        <n-input-number
          v-model:value="optionData.flipperSpeed"
          size="small"
          :min="100"
          :max="900"
          :step="100"
        ></n-input-number>
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import type { OptionType } from './config'

defineProps({
  optionData: {
    type: Object as PropType<OptionType>,
    required: true
  }
})
</script>
