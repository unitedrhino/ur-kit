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

  <!-- 环形尺寸配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentRingSize')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.dimensions')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDiameter')">
        <n-input-number v-model:value="optionData.ringMetricsOption.ringSize" size="small" :min="60" :max="200" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentThickness')">
        <n-input-number v-model:value="optionData.ringMetricsOption.ringThickness" size="small" :min="4" :max="30" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSpacing')">
        <n-input-number v-model:value="optionData.ringMetricsOption.layoutGap" size="small" :min="10" :max="50" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 标签样式 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLabelStyle')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFont')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number v-model:value="optionData.ringMetricsOption.labelOption.fontSize" size="small" :min="12" :max="48" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.ringMetricsOption.labelOption.fontColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select v-model:value="optionData.ringMetricsOption.labelOption.fontWeight" size="small" :options="fontWeightOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number v-model:value="optionData.ringMetricsOption.labelOption.letterSpacing" size="small" :min="-5" :max="20" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentShadow')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.ringMetricsOption.labelOption.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentEnableShadow') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="optionData.ringMetricsOption.labelOption.showShadow">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentXOffset')">
          <n-input-number v-model:value="optionData.ringMetricsOption.labelOption.hShadow" size="small" :min="-50" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentYOffset')">
          <n-input-number v-model:value="optionData.ringMetricsOption.labelOption.vShadow" size="small" :min="-50" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBlur')">
          <n-input-number v-model:value="optionData.ringMetricsOption.labelOption.blurShadow" size="small" :min="0" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowColor')">
          <n-color-picker v-model:value="optionData.ringMetricsOption.labelOption.colorShadow" size="small" :modes="['hex']" />
        </SettingItem>
      </template>
    </SettingItemBox>
  </CollapseItem>

  <!-- 百分比样式 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentPercentageStyle')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFont')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number v-model:value="optionData.ringMetricsOption.percentOption.fontSize" size="small" :min="12" :max="48" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.ringMetricsOption.percentOption.fontColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select v-model:value="optionData.ringMetricsOption.percentOption.fontWeight" size="small" :options="fontWeightOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number v-model:value="optionData.ringMetricsOption.percentOption.letterSpacing" size="small" :min="-5" :max="20" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentShadow')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.ringMetricsOption.percentOption.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentEnableShadow') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="optionData.ringMetricsOption.percentOption.showShadow">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentXOffset')">
          <n-input-number v-model:value="optionData.ringMetricsOption.percentOption.hShadow" size="small" :min="-50" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentYOffset')">
          <n-input-number v-model:value="optionData.ringMetricsOption.percentOption.vShadow" size="small" :min="-50" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBlur')">
          <n-input-number v-model:value="optionData.ringMetricsOption.percentOption.blurShadow" size="small" :min="0" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowColor')">
          <n-color-picker v-model:value="optionData.ringMetricsOption.percentOption.colorShadow" size="small" :modes="['hex']" />
        </SettingItem>
      </template>
    </SettingItemBox>
  </CollapseItem>

  <!-- 数量样式 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentCountStyle')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFont')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number v-model:value="optionData.ringMetricsOption.countOption.fontSize" size="small" :min="12" :max="48" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.ringMetricsOption.countOption.fontColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select v-model:value="optionData.ringMetricsOption.countOption.fontWeight" size="small" :options="fontWeightOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number v-model:value="optionData.ringMetricsOption.countOption.letterSpacing" size="small" :min="-5" :max="20" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentShadow')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.ringMetricsOption.countOption.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentEnableShadow') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="optionData.ringMetricsOption.countOption.showShadow">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentXOffset')">
          <n-input-number v-model:value="optionData.ringMetricsOption.countOption.hShadow" size="small" :min="-50" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentYOffset')">
          <n-input-number v-model:value="optionData.ringMetricsOption.countOption.vShadow" size="small" :min="-50" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentBlur')">
          <n-input-number v-model:value="optionData.ringMetricsOption.countOption.blurShadow" size="small" :min="0" :max="50" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowColor')">
          <n-color-picker v-model:value="optionData.ringMetricsOption.countOption.colorShadow" size="small" :modes="['hex']" />
        </SettingItem>
      </template>
    </SettingItemBox>
  </CollapseItem>

  <!-- 指标颜色 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentMetricColor')" :expanded="false">
    <template v-for="(metric, mIdx) in optionData.ringMetricsOption.metrics" :key="mIdx">
      <SettingItemBox :name="editorT('bigscreenEditor.dynamic.pieNumber', { index: String(Number(mIdx) + 1) })">
        <SettingItem>
          <n-input v-model:value="optionData.ringMetricsOption.metrics[mIdx].label" size="small" style="width: 100%" />
        </SettingItem>
        
        <SettingItem >
          <n-space>
            <n-switch v-model:value="optionData.ringMetricsOption.metrics[mIdx].useThreshold" size="small" />
            <n-text>{{ metric.useThreshold ? editorT('bigscreenEditor.ui.componentOffThreshold') : editorT('bigscreenEditor.ui.componentOnThreshold') }}</n-text>
          </n-space>
        </SettingItem>

        <div v-if="metric.useThreshold" style="width: 100%; margin-top: 8px; grid-column: span 2; min-width: 0; overflow: visible;">
          <div
            v-for="(_, tIdx) in metric.thresholds" :key="tIdx"
            style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; width: 100%;"
          >
            <n-select
              v-model:value="optionData.ringMetricsOption.metrics[mIdx].thresholds[tIdx].operator"
              :options="operatorOptions"
              size="small"
              style="flex: 2; min-width: 0;"
            />
            <n-input-number
              v-model:value="optionData.ringMetricsOption.metrics[mIdx].thresholds[tIdx].value"
              size="small"
              :min="0" :max="100"
              :show-button="false"
              style="flex: 2; min-width: 0;"
            >
              <template #suffix>%</template>
            </n-input-number>

            <n-color-picker
              v-model:value="optionData.ringMetricsOption.metrics[mIdx].thresholds[tIdx].color"
              size="small"
              :modes="['hex']"
              style="flex: 2; min-width: 0;"
            />

            <n-button
              size="small"
              quaternary
              type="error"
              style="padding: 0 4px; flex-shrink: 0;"
              @click="optionData.ringMetricsOption.metrics[mIdx].thresholds.splice(tIdx, 1)"
              :disabled="metric.thresholds.length <= 1"
            >
              <template #icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                  <path d="M7 4V2h10v2h3.007c.548 0 .993.445.993.993v.014c0 .548-.445.993-.993.993H3.993C3.445 6 3 5.555 3 5.007V4.993C3 4.445 3.445 4 3.993 4H7zm1 3h8l-.889 15.067a1 1 0 0 1-.998.933H9.887a1 1 0 0 1-.998-.933L8 7z"/>
                </svg>
              </template>
            </n-button>
          </div>

          <n-button
            size="small"
            dashed block
            style="margin-top: 4px;"
            @click="optionData.ringMetricsOption.metrics[mIdx].thresholds.push({ operator: '>=', value: 50, color: '#faad14' })"
          >
            {{ editorT('orgManage.cloneGroup.addRule') }}
          </n-button>
        </div>
      </SettingItemBox>
    </template>
  </CollapseItem>

  <!-- 布局配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLayout')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPadding')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPadding')">
        <n-input-number v-model:value="optionData.padding" size="small" :min="0" :max="50" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
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

const operatorOptions = [
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '=', value: '=' },
  { label: '≥', value: '>=' },
  { label: '≤', value: '<=' },
]
</script>
