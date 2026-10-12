<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <DecoratedTableContainerConfig :option-data="optionData as any" />

  <CollapseItem :name="editorT('platformManage.devops.structList')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBasic')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTableRowCount')">
        <n-input-number v-model:value="optionData.rowNum" :min="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterTheAutomaticCalculationSetting')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentCarouselDurationS')">
        <n-input-number v-model:value="optionData.waitTime" :min="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterTheCarouselDuration')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentValueUnit')">
        <n-input v-model:value="optionData.unit" size="small" :placeholder="editorT('bigscreenEditor.ui.componentValueUnit')" />
        <n-text v-if="optionData.autoUnit" depth="3" style="font-size: 12px">
          {{ editorT('bigscreenEditor.ui.componentDetectedUnit') }}{{ optionData.autoUnit }}
        </n-text>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDecimalPlaces')">
        <n-input-number v-model:value="optionData.displayDecimals" :min="0" size="small" :placeholder="editorT('bigscreenEditor.ui.componentDecimalPlaces')" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentMainColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDataColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.textColor" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBottomLine')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.borderColor" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFontStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRowNumberFont')">
        <n-input-number size="small" v-model:value="optionData.indexFontSize" :min="12" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLeftSideDataFont')">
        <n-input-number size="small" v-model:value="optionData.leftFontSize" :min="12" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRightSideDataFont')">
        <n-input-number size="small" v-model:value="optionData.rightFontSize" :min="12" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'

import { CollapseItem, SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting'

import DecoratedTableContainerConfig from '../../shared/DecoratedTableContainerConfig.vue'
import { option } from './config'

defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
})
</script>
