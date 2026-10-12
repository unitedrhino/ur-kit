<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData"></global-setting>
  <CollapseItem v-for="(item, index) in seriesList" :key="index" :name="editorT('bigscreenEditor.dynamic.barNumber', { index: String(index + 1) })" :expanded="true">
    <template v-if="item.itemStyle">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentShape')">
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number
          v-model:value="item.barWidth"
          :min="1"
          :max="100"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentCalculateAutomatically')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number v-model:value="item.itemStyle.borderRadius" :min="0" size="small"></n-input-number>
      </SettingItem>
    </SettingItemBox>
    <setting-item-box :name="editorT('iotApp.productPage.tags')">
      <setting-item>
        <n-space>
          <n-switch v-model:value="item.label.show" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowLabels') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="item.label.fontSize" size="small" :min="1"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="item.label.color"></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('iotApp.devicePage.location')">
        <n-select
          v-model:value="item.label.position"
          :options="[
            { label: 'top', value: 'top' },
            { label: 'left', value: 'left' },
            { label: 'right', value: 'right' },
            { label: 'bottom', value: 'bottom' }
          ]"
        />
      </setting-item>
    </setting-item-box>
    </template>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed } from 'vue'
import { GlobalSetting, CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'

const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType>,
    required: true
  }
})

const seriesList = computed(() => {
  return props.optionData.series
})
</script>
