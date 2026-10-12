<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- 边框配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentBorder')" :expanded="false">
    <SettingItemBox :name="editorT('orgManage.approve.colTitle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleText2')">
        <n-input v-model:value="optionData.borderOption.borderTitle" size="small" :placeholder="editorT('orgPark.ui.enterTitle')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleFontSize')">
        <n-input-number v-model:value="optionData.borderOption.borderTitleSize" size="small" :min="12" :max="36" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleColor')">
        <n-color-picker v-model:value="optionData.borderOption.borderTitleColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBorderColor2')">
      <SettingItem v-for="(_, idx) in optionData.borderOption.colors" :key="idx" :name="editorT('bigscreenEditor.dynamic.colorNumber', { index: String(idx + 1) })">
        <n-color-picker v-model:value="optionData.borderOption.colors[idx]" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.background')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <n-color-picker v-model:value="optionData.borderOption.backgroundColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 布局配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLayoutConfiguration')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentHeightAllocation')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTopChartProportion')">
        <n-slider v-model:value="optionData.layoutOption.topHeightPercent" :min="20" :max="80" :step="5" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentChartSpacing')">
        <n-input-number v-model:value="optionData.layoutOption.verticalGap" size="small" :min="5" :max="50" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('orgManage.approve.colTitle')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.layoutOption.showChartTitles" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowTitle') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="optionData.layoutOption.showChartTitles">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
          <n-input-number v-model:value="optionData.layoutOption.titleOption.fontSize" size="small" :min="12" :max="48" />
        </SettingItem>
        <SettingItem :name="editorT('orgManage.flow.fwColor')">
          <n-color-picker v-model:value="optionData.layoutOption.titleOption.fontColor" size="small" :modes="['hex']" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
          <n-select v-model:value="optionData.layoutOption.titleOption.fontWeight" size="small" :options="fontWeightOptions" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
          <n-input-number v-model:value="optionData.layoutOption.titleOption.letterSpacing" size="small" :min="-5" :max="20" />
        </SettingItem>
      </template>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTitleShadow')" v-if="optionData.layoutOption.showChartTitles">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.layoutOption.titleOption.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentEnableShadow') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="optionData.layoutOption.titleOption.showShadow">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentXOffset')">
          <n-input-number v-model:value="optionData.layoutOption.titleOption.hShadow" size="small" :min="-50" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentYOffset')">
          <n-input-number v-model:value="optionData.layoutOption.titleOption.vShadow" size="small" :min="-50" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBlur')">
          <n-input-number v-model:value="optionData.layoutOption.titleOption.blurShadow" size="small" :min="0" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowColor')">
          <n-color-picker v-model:value="optionData.layoutOption.titleOption.colorShadow" size="small" :modes="['hex']" />
        </SettingItem>
      </template>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPadding')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPadding')">
        <n-input-number v-model:value="optionData.padding" size="small" :min="0" :max="50" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 顶部图表配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.topCharts')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentChartType')">
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select v-model:value="optionData.topChartOption.chartType" size="small" :options="chartTypeOptions" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.approve.colTitle')">
        <n-input v-model:value="optionData.topChartOption.title" size="small" :placeholder="editorT('orgPark.ui.enterTitle')" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.topChartOption.color" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.xAxis')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentAxisColor')">
        <n-color-picker v-model:value="optionData.topChartOption.xAxis.axisLine.lineStyle.color" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLabelColor')">
        <n-color-picker v-model:value="optionData.topChartOption.xAxis.axisLabel.color" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.yAxis')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentAxisColor')">
        <n-color-picker v-model:value="optionData.topChartOption.yAxis.axisLine.lineStyle.color" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLabelColor')">
        <n-color-picker v-model:value="optionData.topChartOption.yAxis.axisLabel.color" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentGridLineColor')">
        <n-color-picker v-model:value="optionData.topChartOption.yAxis.splitLine.lineStyle.color" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 底部图表配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.bottomCharts')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentChartType')">
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select v-model:value="optionData.bottomChartOption.chartType" size="small" :options="chartTypeOptions" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.approve.colTitle')">
        <n-input v-model:value="optionData.bottomChartOption.title" size="small" :placeholder="editorT('orgPark.ui.enterTitle')" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.bottomChartOption.color" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.xAxis')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentAxisColor')">
        <n-color-picker v-model:value="optionData.bottomChartOption.xAxis.axisLine.lineStyle.color" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLabelColor')">
        <n-color-picker v-model:value="optionData.bottomChartOption.xAxis.axisLabel.color" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.yAxis')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentAxisColor')">
        <n-color-picker v-model:value="optionData.bottomChartOption.yAxis.axisLine.lineStyle.color" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLabelColor')">
        <n-color-picker v-model:value="optionData.bottomChartOption.yAxis.axisLabel.color" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentGridLineColor')">
        <n-color-picker v-model:value="optionData.bottomChartOption.yAxis.splitLine.lineStyle.color" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { watch, type PropType } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'

const props = defineProps({
  optionData: {
    type: Object as PropType<any>,
    required: true,
  },
})

const fontWeightOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.renewal.statusNormal'); }, value: 'normal' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBold2'); }, value: 'bold' }
]

const chartTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('aiChat.ui.barChart'); }, value: 'bar' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('aiChat.ui.lineChart'); }, value: 'line' }
]

// 监听图表类型变化，自动更新 series.type
watch(
  () => props.optionData.topChartOption.chartType,
  (newType) => {
    if (props.optionData.topChartOption.series[0]) {
      props.optionData.topChartOption.series[0].type = newType
    }
  }
)

watch(
  () => props.optionData.bottomChartOption.chartType,
  (newType) => {
    if (props.optionData.bottomChartOption.series[0]) {
      props.optionData.bottomChartOption.series[0].type = newType
    }
  }
)

// 监听颜色变化，自动更新 series.itemStyle.color
watch(
  () => props.optionData.topChartOption.color,
  (newColor) => {
    if (props.optionData.topChartOption.series[0]) {
      props.optionData.topChartOption.series[0].itemStyle = {
        ...props.optionData.topChartOption.series[0].itemStyle,
        color: newColor
      }
    }
  }
)

watch(
  () => props.optionData.bottomChartOption.color,
  (newColor) => {
    if (props.optionData.bottomChartOption.series[0]) {
      props.optionData.bottomChartOption.series[0].itemStyle = {
        ...props.optionData.bottomChartOption.series[0].itemStyle,
        color: newColor
      }
    }
  }
)

// 监听高度百分比变化，自动调整底部图表高度
watch(
  () => props.optionData.layoutOption.topHeightPercent,
  (newPercent) => {
    props.optionData.layoutOption.bottomHeightPercent = 100 - newPercent
  }
)
</script>
