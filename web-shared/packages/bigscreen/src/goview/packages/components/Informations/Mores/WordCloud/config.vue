<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <global-setting :optionData="optionData"></global-setting>
  <collapse-item :name="editorT('bigscreenEditor.ui.componentWordCloud')" expanded>
    <setting-item-box :name="editorT('bigscreenEditor.ui.shape')">
      <setting-item>
        <n-select v-model:value="firstSeries.shape" size="small" :options="ShapeEnumList" />
      </setting-item>
      <setting-item>
        <n-checkbox v-model:checked="firstSeries.drawOutOfBound" size="small">{{ editorT('bigscreenEditor.ui.componentAllowOutgoingEdges') }}</n-checkbox>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('bigscreenEditor.ui.componentLayout')">
      <setting-item :name="editorT('bigscreenEditor.ui.width2')">
        <n-slider
          v-model:value="series.width"
          :min="0"
          :max="100"
          :format-tooltip="sliderFormatTooltip"
          @update:value="updateWidth"
        ></n-slider>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.height2')">
        <n-slider
          v-model:value="series.height"
          :min="0"
          :max="100"
          :format-tooltip="sliderFormatTooltip"
          @update:value="updateHeight"
        ></n-slider>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('bigscreenEditor.ui.componentStyle')" alone>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFontRangeMinimumMaximum')">
        <n-slider v-model:value="firstSeries.sizeRange" range :step="1" :min="6" :max="100" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentRotationAngle')">
        <n-slider v-model:value="series.rotationStep" :step="15" :min="0" :max="45" @update:value="updateRotation" />
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed } from 'vue'
import cloneDeep from 'lodash/cloneDeep'
import { defaultSeries, option, ShapeEnumList } from './config'
// eslint-disable-next-line no-unused-vars
import { GlobalSetting, CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

// series[0] 在异常数据下可能缺失，读取时回退默认 series 配置，保证设置面板可渲染（正常数据不会命中）
const firstSeries = computed(() => props.optionData.series[0] ?? cloneDeep(defaultSeries))

const series = computed(() => {
  const first = props.optionData.series[0]
  // 缺失时返回与默认配置一致的形状，避免面板崩溃
  if (!first) return { width: 0, height: 0, rotationStep: 0 }
  const { width, height, rotationStep } = first
  return {
    width: +width.replace('%', ''),
    height: +height.replace('%', ''),
    rotationStep
  }
})

const sliderFormatTooltip = (v: number) => {
  return `${v}%`
}

const updateWidth = (value: number) => {
  const first = props.optionData.series[0]
  if (first) first.width = `${value}%`
}

const updateHeight = (value: number) => {
  const first = props.optionData.series[0]
  if (first) first.height = `${value}%`
}

const updateRotation = (value: number) => {
  const first = props.optionData.series[0]
  if (!first) return
  first.rotationStep = value
  first.rotationRange = value === 0 ? [0, 0] : [-90, 90]
}
</script>
