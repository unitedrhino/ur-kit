<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData"></global-setting>
  <CollapseItem v-for="(item, index) in seriesList" :key="index" :name="editorT('bigscreenEditor.ui.componentSingleAreaChart')" :expanded="true">
    <template v-if="item.lineStyle">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLine')">
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number
          v-model:value="item.lineStyle.width"
          :min="1"
          :max="100"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentCalculateAutomatically')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select v-model:value="item.lineStyle.type" size="small" :options="lineConf.lineStyle.type"></n-select>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentSolidPoint')">
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number
          v-model:value="item.symbolSize"
          :min="1"
          :max="100"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentCalculateAutomatically')"
        ></n-input-number>
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
import { lineConf } from '@/packages/chartConfiguration/echarts/index'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'
import { GlobalSetting, CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'

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
