<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- 聚合数据源配置 -->
  <DataSourcePanel :optionData="optionData" />

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

  <!-- 主数字配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentMainNumber')" :expanded="true">
    <!-- 翻牌器样式 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFlipCard')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDigits')">
        <n-input-number v-model:value="optionData.mainValueOption.flipperLength" size="small" :min="1" :max="12" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number v-model:value="optionData.mainValueOption.flipperWidth" size="small" :min="10" :max="100" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.height2')">
        <n-input-number v-model:value="optionData.mainValueOption.flipperHeight" size="small" :min="20" :max="100" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSpacing')">
        <n-input-number v-model:value="optionData.mainValueOption.flipperGap" size="small" :min="0" :max="30" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number v-model:value="optionData.mainValueOption.flipperRadius" size="small" :min="0" :max="20" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <n-color-picker v-model:value="optionData.mainValueOption.flipperBgColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTextColor')">
        <n-color-picker v-model:value="optionData.mainValueOption.flipperTextColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <!-- 单位样式 -->
    <SettingItemBox :name="editorT('iotApp.schemaForm.unitLabel')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentUnitText')">
        <n-input v-model:value="optionData.unitOption.text" size="small" :placeholder="editorT('iotApp.schemaForm.unitPlaceholder')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number v-model:value="optionData.unitOption.fontSize" size="small" :min="12" :max="48" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.unitOption.fontColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select v-model:value="optionData.unitOption.fontWeight" size="small" :options="fontWeightOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number v-model:value="optionData.unitOption.letterSpacing" size="small" :min="-5" :max="20" />
      </SettingItem>
    </SettingItemBox>
    <!-- 单位阴影 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentUnitShadow')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.unitOption.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentEnableShadow') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="optionData.unitOption.showShadow">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentXOffset')">
          <n-input-number v-model:value="optionData.unitOption.hShadow" size="small" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentYOffset')">
          <n-input-number v-model:value="optionData.unitOption.vShadow" size="small" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBlur')">
          <n-input-number v-model:value="optionData.unitOption.blurShadow" size="small" :min="0" />
        </SettingItem>
        <SettingItem :name="editorT('orgManage.flow.fwColor')">
          <n-color-picker v-model:value="optionData.unitOption.colorShadow" size="small" :modes="['hex']" />
        </SettingItem>
      </template>
    </SettingItemBox>
  </CollapseItem>

  <!-- 子指标配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentSubmetric')" :expanded="false">
    <!-- 标签样式 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLabelStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number v-model:value="optionData.subMetricLabelOption.fontSize" size="small" :min="12" :max="36" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.subMetricLabelOption.fontColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select v-model:value="optionData.subMetricLabelOption.fontWeight" size="small" :options="fontWeightOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number v-model:value="optionData.subMetricLabelOption.letterSpacing" size="small" :min="-5" :max="20" />
      </SettingItem>
    </SettingItemBox>
    <!-- 标签阴影 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLabelShadow')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.subMetricLabelOption.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentEnableShadow') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="optionData.subMetricLabelOption.showShadow">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentXOffset')">
          <n-input-number v-model:value="optionData.subMetricLabelOption.hShadow" size="small" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentYOffset')">
          <n-input-number v-model:value="optionData.subMetricLabelOption.vShadow" size="small" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBlur')">
          <n-input-number v-model:value="optionData.subMetricLabelOption.blurShadow" size="small" :min="0" />
        </SettingItem>
        <SettingItem :name="editorT('orgManage.flow.fwColor')">
          <n-color-picker v-model:value="optionData.subMetricLabelOption.colorShadow" size="small" :modes="['hex']" />
        </SettingItem>
      </template>
    </SettingItemBox>
    <!-- 数值样式 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentValueStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number v-model:value="optionData.subMetricValueOption.fontSize" size="small" :min="12" :max="48" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.subMetricValueOption.fontColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select v-model:value="optionData.subMetricValueOption.fontWeight" size="small" :options="fontWeightOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number v-model:value="optionData.subMetricValueOption.letterSpacing" size="small" :min="-5" :max="20" />
      </SettingItem>
    </SettingItemBox>
    <!-- 数值阴影 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentValueShadow')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.subMetricValueOption.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentEnableShadow') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="optionData.subMetricValueOption.showShadow">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentXOffset')">
          <n-input-number v-model:value="optionData.subMetricValueOption.hShadow" size="small" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentYOffset')">
          <n-input-number v-model:value="optionData.subMetricValueOption.vShadow" size="small" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBlur')">
          <n-input-number v-model:value="optionData.subMetricValueOption.blurShadow" size="small" :min="0" />
        </SettingItem>
        <SettingItem :name="editorT('orgManage.flow.fwColor')">
          <n-color-picker v-model:value="optionData.subMetricValueOption.colorShadow" size="small" :modes="['hex']" />
        </SettingItem>
      </template>
    </SettingItemBox>
  </CollapseItem>

  <!-- 布局配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLayout')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPaddingPx')">
      <SettingItem>
        <n-slider v-model:value="optionData.padding" :min="0" :max="60" :step="2" />
      </SettingItem>
      <SettingItem>
        <n-input-number v-model:value="optionData.padding" size="small" :min="0" :max="60" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import DataSourcePanel from './dataSource.vue'

const props = defineProps({
  optionData: {
    type: Object as PropType<any>,
    required: true,
  },
})

// 字重选项
const fontWeightOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentRegular'); }, value: 'normal' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBold'); }, value: 'bold' },
]
</script>
