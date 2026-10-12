<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- 边框配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentBorder')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBorderStyle')">
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select
          v-model:value="optionData.borderKey"
          size="small"
          :options="borderTypeOptions"
          @update:value="onBorderTypeChange"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox
      v-for="(color, idx) in optionData.borderOption?.colors"
      :key="idx"
      :name="editorT('bigscreenEditor.dynamic.colorNumber', { index: String(idx + 1) })"
    >
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="optionData.borderOption.colors[idx]"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox v-if="optionData.borderOption?.dur !== undefined" :name="editorT('bigscreenEditor.ui.componentAnimationSpeedS')">
      <SettingItem>
        <n-input-number
          v-model:value="optionData.borderOption.dur"
          size="small"
          :step="0.5"
          :min="0.5"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
      <SettingItem>
        <n-color-picker
          v-model:value="optionData.borderOption.backgroundColor"
          size="small"
          :modes="['hex']"
        />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 标题配置 -->
  <CollapseItem :name="editorT('orgManage.approve.colTitle')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBasic')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="titleOption.show" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowTitle') }}</n-text>
        </n-space>
      </SettingItem>
      <n-text depth="3" style="font-size: 12px; margin-top: 8px">
        {{ editorT('bigscreenEditor.ui.componentTheTitleIsPlacedAboveTheBorderIncrease') }}
      </n-text>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleText')">
        <n-input v-model:value="titleOption.text" size="small" :placeholder="editorT('orgPark.ui.enterTitle')" />
      </SettingItem>
      <SettingItem :name="editorT('iotApp.devicePage.location')">
        <n-select
          v-model:value="titleOption.position"
          size="small"
          :options="titlePositionOptions"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTextStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number
          v-model:value="titleOption.fontSize"
          size="small"
          :min="12"
          :max="36"
          :step="1"
        />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          v-model:value="titleOption.fontColor"
          size="small"
          :modes="['hex']"
        />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select
          v-model:value="titleOption.fontWeight"
          size="small"
          :options="fontWeightOptions"
        />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number
          v-model:value="titleOption.letterSpacing"
          size="small"
          :min="0"
          :max="10"
          :step="0.5"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPositionAdjustment')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDistanceFromTopPx')">
        <n-input-number
          v-model:value="titleOption.top"
          size="small"
          :min="0"
          :max="100"
          :step="1"
        />
      </SettingItem>
      <SettingItem v-if="titleOption.position !== 'center'" :name="editorT('bigscreenEditor.ui.componentMarginPx')">
        <n-input-number
          v-model:value="titleOption.sideOffset"
          size="small"
          :min="0"
          :max="100"
          :step="1"
        />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 图表配置 -->
  <CollapseItem :name="editorT('bigscreenManagement.ui.definitionCharts')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentChartType')">
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select
          :value="optionData.chartKey"
          size="small"
          :options="chartTypeOptions"
          @update:value="onChartTypeChange"
        />
      </SettingItem>
    </SettingItemBox>
    <!-- 动态渲染对应图表的属性面板（含 GlobalSetting：X/Y轴、图例、系列样式等） -->
    <component
      v-if="currentChartConfig"
      :key="optionData.chartKey"
      :is="currentChartConfig"
      :optionData="optionData.chartOption"
    />

    <!-- 胶囊柱图属性面板（内联：避免引入 CapsuleChart/config.vue 的 global-setting） -->
    <template v-if="optionData.chartKey === 'CapsuleCommon'">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBar')">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBarHeightPx')">
          <n-input-number
            v-model:value="optionData.chartOption.itemHeight"
            size="small" :min="4" :max="50" :step="1"
          />
        </SettingItem>
      </SettingItemBox>
      <SettingItemBox :name="editorT('bigscreenManagement.ui.text')">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentTextSize')">
          <n-input-number
            v-model:value="optionData.chartOption.valueFontSize"
            size="small" :min="10" :step="1"
          />
        </SettingItem>
        <SettingItem :name="editorT('iotApp.schemaForm.unitLabel')">
          <n-input v-model:value="optionData.chartOption.unit" size="small" />
        </SettingItem>
        <SettingItem>
          <n-space>
            <n-switch v-model:value="optionData.chartOption.showValue" size="small" />
            <n-text>{{ editorT('bigscreenEditor.ui.componentShowValue') }}</n-text>
          </n-space>
        </SettingItem>
      </SettingItemBox>
      <SettingItemBox :name="editorT('orgManage.flow.fwColor')">
        <SettingItem
          v-for="(_, idx) in optionData.chartOption.colors"
          :key="idx"
          :name="editorT('bigscreenEditor.dynamic.colorNumber', { index: String(idx + 1) })"
        >
          <n-color-picker
            v-model:value="optionData.chartOption.colors[idx]"
            size="small" :modes="['hex']"
          />
        </SettingItem>
      </SettingItemBox>
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentAutoScroll')">
        <SettingItem>
          <n-space>
            <n-switch v-model:value="optionData.chartOption.autoScroll" size="small" />
            <n-text>{{ editorT('bigscreenEditor.ui.componentEnableScrollingPreviewPublishedModeOnly') }}</n-text>
          </n-space>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentIntervalMs')">
          <n-input-number
            v-model:value="optionData.chartOption.scrollInterval"
            size="small" :min="500" :max="10000" :step="100"
          />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentStepsRows')">
          <n-input-number
            v-model:value="optionData.chartOption.scrollStep"
            size="small" :min="1" :max="5" :step="1"
          />
        </SettingItem>
        <n-text depth="3" style="font-size: 12px">
          {{ editorT('bigscreenEditor.ui.componentTheContainerHeightDeterminesTheNumberOfVisible') }}
        </n-text>
      </SettingItemBox>
    </template>
  </CollapseItem>

  <!-- 布局配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLayout')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentChartPaddingPx')">
      <SettingItem>
        <n-slider
          v-model:value="optionData.padding"
          :min="0"
          :max="60"
          :step="2"
        />
      </SettingItem>
      <SettingItem>
        <n-input-number
          v-model:value="optionData.padding"
          size="small"
          :min="0"
          :max="60"
        />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { computed } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { ChartFrameEnum } from '@/packages/index.type'
import { echartOptionProfixHandle } from '@/packages/public'
import { borderTypeOptions, borderDefaultOptions, titlePositionOptions, fontWeightOptions } from '../borderConstants'

// 静态 import 图表属性面板
import BarCommonConfig  from '../../../Charts/Bars/BarCommon/config.vue'
import LineCommonConfig from '../../../Charts/Lines/LineCommon/config.vue'
import PieCommonConfig  from '../../../Charts/Pies/PieCommon/config.vue'

const chartConfigMap: Record<string, any> = {
  BarCommon:  BarCommonConfig,
  LineCommon: LineCommonConfig,
  PieCommon:  PieCommonConfig,
}

const props = defineProps({
  optionData: {
    type: Object as PropType<any>,
    required: true,
  },
})

// 当前图表类型对应的属性面板组件
const currentChartConfig = computed(() => chartConfigMap[props.optionData.chartKey])

// 标题配置
const titleOption = computed({
  get: () => {
    const borderOpt = props.optionData.borderOption || {}
    // 兼容 Border04 的旧配置格式
    if (typeof borderOpt.borderTitle === 'string') {
      return {
        show: !!borderOpt.borderTitle,
        text: borderOpt.borderTitle || '',
        position: 'center',
        fontSize: borderOpt.borderTitleSize || 18,
        fontColor: borderOpt.borderTitleColor || '#fff',
        fontWeight: 'normal',
        letterSpacing: 0,
        top: (borderOpt.borderTitleHeight || 32) - 5,
        sideOffset: 20,
      }
    }
    // ✅ 核心修复：直接返回默认结构，坚决不能在这里通过 = 赋值修改原对象！
    return borderOpt.borderTitle || {
      show: false,
      text: '',
      position: 'center',
      fontSize: 18,
      fontColor: '#fff',
      fontWeight: 'normal',
      letterSpacing: 0,
      top: 20,
      sideOffset: 20,
    }
  },
  set: (val) => {
    // 只有在用户主动修改配置时，才写入数据
    props.optionData.borderOption.borderTitle = val
  }
})

// 标题位置选项（已移至 borderConstants.ts）
// 字重选项（已移至 borderConstants.ts）

// 可选边框类型（已移至 borderConstants.ts）

// 可选图表类型
const chartTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('aiChat.ui.barChart'); }, value: 'BarCommon' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('aiChat.ui.lineChart'); }, value: 'LineCommon' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('aiChat.ui.pieChart'); }, value: 'PieCommon' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentCapsuleBarChart2'); }, value: 'CapsuleCommon' },
]

// 各边框类型默认 option
// 各图表类型默认 chartOption
const defaultDataset = {
  dimensions: ['product', 'data1', 'data2'],
  source: [
    { product: 'Mon', data1: 120, data2: 130 },
    { product: 'Tue', data1: 200, data2: 210 },
    { product: 'Wed', data1: 150, data2: 160 },
    { product: 'Thu', data1: 80, data2: 90 },
    { product: 'Fri', data1: 70, data2: 75 },
    { product: 'Sat', data1: 110, data2: 120 },
    { product: 'Sun', data1: 130, data2: 135 },
  ],
}

// 使用 echartOptionProfixHandle 合并 globalThemeJson
const chartDefaultOptions: Record<string, () => any> = {
  BarCommon: () => echartOptionProfixHandle({
    tooltip: { show: true, trigger: 'axis', axisPointer: { show: true, type: 'shadow' } },
    legend: { show: true },
    grid: { left: '5%', right: '5%', top: '10%', bottom: '5%', containLabel: true },
    xAxis: {
      show: true, type: 'category',
      axisLine: { show: true, lineStyle: { color: '#B9B8CE', width: 1 }, onZero: false },
      axisTick: { show: true, length: 5 },
      splitLine: { show: false },
    },
    yAxis: {
      show: true, type: 'value',
      axisLine: { show: true, lineStyle: { color: '#B9B8CE', width: 1 } },
      axisTick: { show: true, length: 5 },
      splitLine: { show: true, lineStyle: { color: '#484753', width: 1, type: 'solid' } },
    },
    dataset: defaultDataset,
    series: [
      { type: 'bar', barWidth: 15, label: { show: true, position: 'top', color: '#fff', fontSize: 12 }, itemStyle: { color: null, borderRadius: 2 } },
      { type: 'bar', barWidth: 15, label: { show: true, position: 'top', color: '#fff', fontSize: 12 }, itemStyle: { color: null, borderRadius: 2 } },
    ],
  }, ['legend', 'grid']),
  LineCommon: () => echartOptionProfixHandle({
    tooltip: { show: true, trigger: 'axis' },
    legend: { show: true },
    grid: { left: '5%', right: '5%', top: '10%', bottom: '5%', containLabel: true },
    xAxis: {
      show: true, type: 'category',
      axisLine: { show: true, lineStyle: { color: '#B9B8CE', width: 1 }, onZero: false },
      axisTick: { show: true, length: 5 },
      splitLine: { show: false },
    },
    yAxis: {
      show: true, type: 'value',
      axisLine: { show: true, lineStyle: { color: '#B9B8CE', width: 1 } },
      axisTick: { show: true, length: 5 },
      splitLine: { show: true, lineStyle: { color: '#484753', width: 1, type: 'solid' } },
    },
    dataset: defaultDataset,
    series: [
      { type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, label: { show: false }, lineStyle: { width: 2 } },
      { type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, label: { show: false }, lineStyle: { width: 2 } },
    ],
  }, ['legend', 'grid']),
  PieCommon: () => echartOptionProfixHandle({
    isCarousel: false,
    type: 'ring',
    tooltip: { show: true, trigger: 'item' },
    legend: { show: true, bottom: '5%' },
    dataset: {
      dimensions: ['name', 'value'],
      source: [
        { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.componentCategoryA'); }, value: 335 },
        { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.componentCategoryB'); }, value: 310 },
        { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.componentCategoryC'); }, value: 274 },
        { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.componentCategoryD'); }, value: 235 },
        { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.componentCategoryE'); }, value: 400 },
      ],
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '60%'],
      roseType: false,
      avoidLabelOverlap: false,
      itemStyle: { show: true, borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center', formatter: '{b}', fontWeight: 'normal', fontSize: 14, color: '#454E54', textBorderColor: '#ffffff', textBorderWidth: 1 },
      emphasis: { label: { show: true, fontSize: 40, fontWeight: 'bold' } },
      labelLine: { show: false },
    }],
  }, ['legend']),
  // 胶囊条形图：非 ECharts 图表，不使用 echartOptionProfixHandle
  CapsuleCommon: () => ({
    dataset: {
      dimensions: ['name', 'value'],
      source: [
        { name: 'A', value: 100 },
        { name: 'B', value: 80 },
        { name: 'C', value: 60 },
        { name: 'D', value: 50 },
        { name: 'E', value: 40 },
        { name: 'F', value: 30 },
      ],
    },
    colors: ['#c4ebad', '#6be6c1', '#a0a7e6', '#96dee8', '#3fb1e3'],
    unit: '',
    itemHeight: 10,
    valueFontSize: 16,
    paddingRight: 50,
    paddingLeft: 50,
    showValue: true,
    autoScroll: true,
    scrollInterval: 3000,
    scrollStep: 1,
  }),
}

// 切换边框类型：重置 borderOption 为新类型默认值
const onBorderTypeChange = (newKey: string) => {
  const defaults = borderDefaultOptions[newKey]
  if (defaults) {
    props.optionData.borderOption = defaults()
  }
}

// 切换图表类型：完全重置为新类型默认 option（含 dataset）
const onChartTypeChange = (newKey: string) => {
  const factory = chartDefaultOptions[newKey]
  if (!factory) return
  props.optionData.chartOption = factory()
  // 胶囊条形图非 ECharts，使用 COMMON 框架
  props.optionData.chartFrame = newKey === 'CapsuleCommon'
    ? ChartFrameEnum.COMMON
    : ChartFrameEnum.ECHARTS
  props.optionData.chartKey = newKey
}
</script>
