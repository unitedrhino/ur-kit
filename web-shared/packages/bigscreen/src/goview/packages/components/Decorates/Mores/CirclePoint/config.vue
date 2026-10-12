<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLine')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentSpecific')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentOuterRingRadius')">
        <n-input-number
            size="small"
            v-model:value="optionData.outCircle"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentInnerCircleRadius')">
        <n-input-number
            size="small"
            v-model:value="optionData.inCircle"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentOuterRingThickness')">
        <n-input-number
            size="small"
            v-model:value="optionData.outCircleWidth"
        ></n-input-number>
      </SettingItem>

      <SettingItem :name="editorT('bigscreenEditor.ui.componentOuterRingColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.outCircleColor"></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentInnerCircleColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.inCircleColor"></n-color-picker>
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
  SettingItem
} from '@/components/Pages/ChartItemSetting'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

</script>
