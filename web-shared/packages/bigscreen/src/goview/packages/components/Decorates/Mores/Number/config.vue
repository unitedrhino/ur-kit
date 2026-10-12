<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('iotApp.deviceDetail.content')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.value')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTargetValue')">
        <n-input-number
          v-model:value="optionData.dataset"
          size="small"
          :min="1"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number
          v-model:value="optionData.numberSize"
          size="small"
          :min="1"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPrecision')">
        <n-input-number
          v-model:value="optionData.precision"
          size="small"
          :min="0"
        ></n-input-number>
      </SettingItem>
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.showSeparator" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowSeparators') }}</n-text>
        </n-space>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.value')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPrefix')">
        <n-input v-model:value="optionData.prefixText" size="small"></n-input>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSuffix')">
        <n-input v-model:value="optionData.suffixText" size="small"></n-input>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('orgManage.flow.fwColor')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPrefix')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="optionData.prefixColor"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSuffix')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="optionData.suffixColor"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.value')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="optionData.numberColor"
        ></n-color-picker>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem :name="editorT('bigscreenEditor.ui.animation')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentSpeedS')">
      <SettingItem>
        <n-input-number
          v-model:value="optionData.dur"
          size="small"
          :step="0.5"
          :min="0.5"
        ></n-input-number>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import {
  CollapseItem,
  SettingItemBox,
  SettingItem,
} from '@/components/Pages/ChartItemSetting'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
})
</script>
