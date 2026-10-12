<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div>
    <!-- Echarts 全局设置 -->
    <global-setting :optionData="optionData"></global-setting>
    <CollapseItem :name="editorT('bigscreenEditor.ui.componentRadar')" :expanded="true">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentStyle')">
        <SettingItem>
          <n-checkbox v-model:checked="radarConfig.splitArea.show">{{ editorT('bigscreenEditor.ui.background') }}</n-checkbox>
        </SettingItem>
        <SettingItem>
          <n-checkbox v-model:checked="radarConfig.splitLine.show">{{ editorT('bigscreenEditor.ui.divider') }}</n-checkbox>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentRadarShape')">
          <n-select
            v-model:value="radarConfig.shape"
            size="small"
            :options="RadarShapeEnumList"
            :placeholder="editorT('bigscreenEditor.ui.componentSelectShape')"
          />
        </SettingItem>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentAxes')">
        <SettingItem>
          <n-checkbox v-model:checked="radarConfig.axisLine.show">{{ editorT('bigscreenEditor.ui.axisLine') }}</n-checkbox>
        </SettingItem>
        <SettingItem>
          <n-checkbox v-model:checked="radarConfig.axisTick.show">{{ editorT('bigscreenEditor.ui.scale') }}</n-checkbox>
        </SettingItem>
      </SettingItemBox>

      <SettingItemBox :name="editorT('iotApp.schemaForm.rangeLabel')">
        <setting-item :name="editorT('bigscreenEditor.dynamic.minimumValue', { value: String(radarProp.radius[0]) })">
          <n-slider
            v-model:value="radarProp.radius[0]"
            :min="0"
            :max="100"
            :format-tooltip="sliderFormatTooltip"
            @update:value="updateRadius0"
          ></n-slider>
        </setting-item>
        <setting-item :name="editorT('bigscreenEditor.dynamic.maximumValue', { value: String(radarProp.radius[1]) })">
          <n-slider
            v-model:value="radarProp.radius[1]"
            :min="0"
            :max="100"
            :format-tooltip="sliderFormatTooltip"
            @update:value="updateRadius1"
          ></n-slider>
        </setting-item>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentOffset')">
        <setting-item :name="editorT('bigscreenEditor.dynamic.xAxisValue', { value: String(radarProp.center[0]) })">
          <n-slider
            v-model:value="radarProp.center[0]"
            :min="0"
            :max="100"
            :format-tooltip="sliderFormatTooltip"
            @update:value="updateCenter0"
          ></n-slider>
        </setting-item>
        <setting-item :name="editorT('bigscreenEditor.dynamic.yAxisValue', { value: String(radarProp.center[1]) })">
          <n-slider
            v-model:value="radarProp.center[1]"
            :min="0"
            :max="100"
            :format-tooltip="sliderFormatTooltip"
            @update:value="updateCenter1"
          ></n-slider>
        </setting-item>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentIndicator')">
        <SettingItem :name="editorT('orgManage.flow.fwColor')">
          <n-color-picker size="small" :modes="['hex']" v-model:value="radarConfig.axisName.color"></n-color-picker>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.size')">
          <n-input-number v-model:value="radarConfig.axisName.fontSize" size="small" :min="9"></n-input-number>
        </SettingItem>
        <SettingItem>
          <n-checkbox v-model:checked="radarConfig.axisName.show">{{ editorT('bigscreenEditor.ui.componentTextLabel') }}</n-checkbox>
        </SettingItem>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentSeries')" :alone="true">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBackgroundOpacity')">
          <n-input-number
            v-model:value="firstSeriesAreaOpacity"
            size="small"
            :min="0"
            :max="1"
            :step="0.1"
          ></n-input-number>
        </SettingItem>
      </SettingItemBox>
    </CollapseItem>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed, reactive } from 'vue'
import { GlobalSetting, CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { option, RadarShapeEnumList } from './config'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option & GlobalThemeJsonType>,
    required: true
  }
})

const radarConfig = computed<typeof option.radar>(() => {
  return props.optionData.radar
})

// series[0] 在异常数据下可能缺失，经 computed 中转读写，缺失时不读写（避免面板崩溃）
const firstSeriesAreaOpacity = computed({
  // 缺失时按 0 回显，避免 undefined 传给滑块
  get: () => props.optionData.series[0]?.areaStyle.opacity ?? 0,
  set: value => {
    const first = props.optionData.series[0]
    if (first) first.areaStyle.opacity = value
  },
})

const radarProp = reactive({
  radius: [0, 60],
  center: [50, 50]
})

// 更新处理
const updateRadius0 = (value: number) => {
  props.optionData.radar.radius[0] = `${value}%`
}

const updateRadius1 = (value: number) => {
  props.optionData.radar.radius[1] = `${value}%`
}

// 更新处理
const updateCenter0 = (value: number) => {
  props.optionData.radar.center[0] = `${value}%`
}

const updateCenter1 = (value: number) => {
  props.optionData.radar.center[1] = `${value}%`
}

// 百分比格式化 percent
const sliderFormatTooltip = (v: number) => {
  return `${v}%`
}
</script>
