<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData"></global-setting>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentPieChartSettings')" :expanded="true">
    <template v-if="optionData.series?.[0]?.itemStyle">
    <SettingItemBox :name="editorT('orgManage.role.type')">
      <SettingItem>
        <n-select v-model:value="optionData.type" size="small" :options="fontWeightOptions" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.animation')" :alone="true">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.isCarousel" size="small"></n-switch>
          <n-text>{{ editorT('iotApp.schemaForm.shadowOn') }}<n-text :depth="3">{{ editorT('bigscreenEditor.ui.componentTheLegendWillBeHiddenAutomatically') }}</n-text></n-text>
        </n-space>
      </SettingItem>
      <SettingItem>
        <n-text :depth="3">{{ editorT('bigscreenEditor.ui.componentTheLegendCanBeForcedOnWhenNo') }}</n-text>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentShape')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentInnerRingRange')">
        <n-input v-model:value="optionData.series[0].radius[0]" size="small"></n-input>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentOuterRingRange')">
        <n-input v-model:value="optionData.series[0].radius[1]" size="small"></n-input>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentXAxisCenter')">
        <n-input v-model:value="optionData.series[0].center[0]" size="small"></n-input>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentYAxisCenter')">
        <n-input v-model:value="optionData.series[0].center[1]" size="small"></n-input>
      </setting-item>
    </SettingItemBox>
    <SettingItemBox :name="editorT('iotApp.productPage.tags')">
      <SettingItem>
        <n-space>
          <n-switch :value="optionData.series?.[0]?.label.show" size="small" @update:value="(value) => updateSeriesLabel('show', value)"></n-switch>
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowLabels') }}</n-text>
        </n-space>
      </SettingItem>
      <setting-item>
        <n-space>
          <n-switch :value="optionData.series?.[0]?.labelLine.show" size="small" @update:value="(value) => updateSeriesLabelLine('show', value)"></n-switch>
          <n-text>{{ editorT('bigscreenEditor.ui.componentGuideLine') }}</n-text>
        </n-space>
      </setting-item>
      <SettingItem :name="editorT('iotApp.devicePage.location')">
        <n-select :value="optionData.series?.[0]?.label.position" size="small" :options="labelConfig.position" @update:value="(value) => updateSeriesLabel('position', value)" />
      </SettingItem>
      <setting-item :name="editorT('bigscreenEditor.ui.componentDisplayType')">
        <n-select :value="optionData.series?.[0]?.label.formatter" size="small" :options="labelFormatterOptions" @update:value="(value) => updateSeriesLabel('formatter', value)" />
      </setting-item>
    </SettingItemBox>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentFont')">
      <setting-item :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number :value="optionData.series?.[0]?.label.fontSize" size="small" :min="0" @update:value="(value) => updateSeriesLabel('fontSize', value)"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('orgManage.flow.fwColor')" v-if="optionData.series?.[0]?.label.color">
        <n-color-picker size="small" :modes="['hex']" :value="optionData.series?.[0]?.label.color" @update:value="(value) => updateSeriesLabel('color', value)"></n-color-picker>
      </setting-item>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBoldText')" v-if="optionData.series?.[0]?.label.fontWeight">
        <n-select
          :value="optionData.series?.[0]?.label.fontWeight"
          size="small"
          :options="labelConfig.fontWeight"
          @update:value="(value) => updateSeriesLabel('fontWeight', value)"
        />
      </SettingItem>
      <setting-item :name="editorT('bigscreenEditor.ui.componentTextBorderSize')" v-if="optionData.series?.[0]?.label.textBorderWidth > -1">
        <n-input-number
          :value="optionData.series?.[0]?.label.textBorderWidth"
          size="small"
          :min="0"
          @update:value="(value) => updateSeriesLabel('textBorderWidth', value)"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentTextBorderColor')" v-if="optionData.series?.[0]?.label.textBorderColor">
        <n-color-picker
          size="small"
          :modes="['hex']"
          :value="optionData.series?.[0]?.label.textBorderColor"
          @update:value="(value) => updateSeriesLabel('textBorderColor', value)"
        ></n-color-picker>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentSegmentStyles')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentCornerSize')">
        <n-input-number
          :value="optionData.series?.[0]?.itemStyle.borderRadius"
          size="small"
          :min="0"
          @update:value="(value) => updateSeriesItemStyle('borderRadius', value)"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentLineWidth2')">
        <n-input-number
          :value="optionData.series?.[0]?.itemStyle.borderWidth"
          size="small"
          :min="0"
          @update:value="(value) => updateSeriesItemStyle('borderWidth', value)"
        ></n-input-number>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentMouseFocus')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentTextSize')">
        <n-input-number
          :value="optionData.series?.[0]?.emphasis.label.fontSize"
          size="small"
          :min="0"
          @update:value="(value) => updateSeriesEmphasisLabel('fontSize', value)"
        ></n-input-number>
      </setting-item>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBoldText')" v-if="optionData.series?.[0]?.emphasis.label.fontWeight">
        <n-select
          :value="optionData.series?.[0]?.emphasis.label.fontWeight"
          size="small"
          :options="labelConfig.fontWeight"
          @update:value="(value) => updateSeriesEmphasisLabel('fontWeight', value)"
        />
      </SettingItem>
    </setting-item-box>
    </template>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType, watch } from 'vue'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'
import { GlobalSetting, CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { PieTypeObject, PieTypeEnum } from './config'
import { labelConfig } from '@/packages/chartConfiguration/echarts'

const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType>,
    required: true
  }
})
const fontWeightOptions = [
  {
    label: PieTypeEnum.NORMAL,
    value: PieTypeObject[PieTypeEnum.NORMAL]
  },
  {
    label: PieTypeEnum.RING,
    value: PieTypeObject[PieTypeEnum.RING]
  },
  {
    label: PieTypeEnum.ROSE,
    value: PieTypeObject[PieTypeEnum.ROSE]
  }
]

const labelFormatterOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDataName'); }, value: '{b}' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentPercentage'); }, value: '{d}' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentColumnNamePercentage'); }, value: '{b}:{d}%' }
]

const updateSeriesLabel = (key: string, value: any) => {
  if (!props.optionData.series?.[0]?.label) return
  props.optionData.series[0].label[key] = value
}

const updateSeriesLabelLine = (key: string, value: any) => {
  if (!props.optionData.series?.[0]?.labelLine) return
  props.optionData.series[0].labelLine[key] = value
}

const updateSeriesItemStyle = (key: string, value: any) => {
  if (!props.optionData.series?.[0]?.itemStyle) return
  props.optionData.series[0].itemStyle[key] = value
}

const updateSeriesEmphasisLabel = (key: string, value: any) => {
  if (!props.optionData.series?.[0]?.emphasis?.label) return
  props.optionData.series[0].emphasis.label[key] = value
}
</script>
