<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData"> </global-setting>
  <!-- 漏斗图 -->
  <collapse-item v-for="(item, index) in seriesList" :key="index" :name="editorT('bigscreenEditor.ui.componentFunnelChart')" expanded>
    <setting-item-box :name="editorT('orgManage.menuManage.sort')" alone>
      <setting-item>
        <n-select v-model:value="item.sort" :options="FunnelOrderEnumList" size="small" />
      </setting-item>
    </setting-item-box>

    <SettingItemBox :name="editorT('iotApp.schemaForm.rangeLabel')" :alone="true">
      <setting-item :name="editorT('bigscreenEditor.dynamic.topDistanceValue', { value: String(item.top) })">
        <n-slider v-model:value="item.top" :min="0" :max="300" :format-tooltip="sliderFormatTooltip"></n-slider>
      </setting-item>
    </SettingItemBox>

    <setting-item-box :name="editorT('bigscreenEditor.ui.componentBlock')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentBorderSize')">
        <n-input-number v-model:value="item.itemStyle.borderWidth" :min="0" :max="10" size="small" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentBorderColor2')">
        <n-color-picker v-model:value="item.itemStyle.borderColor" :modes="['hex']" size="small" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentInterval2')">
        <n-input-number v-model:value="item.gap" :min="0" :max="20" size="small" />
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('iotApp.productPage.tags')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentVisible')">
        <n-checkbox v-model:checked="item.label.show" size="small">{{ editorT('iotApp.productPage.tags') }}</n-checkbox>
      </setting-item>
      <setting-item :name="editorT('iotApp.devicePage.location')">
        <n-select v-model:value="item.label.position" :options="FunnelLabelPositionEnumList" size="small" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="item.label.fontSize" :min="0" size="small" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentHoverSize')">
        <n-input-number v-model:value="item.emphasis.label.fontSize" :min="0" size="small" />
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed } from 'vue'
import { GlobalSetting, CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'
import { option, FunnelOrderEnumList, FunnelLabelPositionEnumList } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option & GlobalThemeJsonType>,
    required: true
  }
})

const seriesList = computed(() => {
  return props.optionData.series
})

const sliderFormatTooltip = (v: number) => {
  return `${v}px`
}
</script>
