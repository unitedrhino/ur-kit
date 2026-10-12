<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<!-- eslint-disable vue/no-mutating-props, vue/block-order -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue';

import { computed } from 'vue';

import { CollapseItem, SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting';

import { option } from './config';

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
});

const optionData = computed(() => props.optionData as typeof option);
const canAdjustBendRatio = computed(() => optionData.value.pathType === 'roundedElbow');

const playCountOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('console.dashboard.validityUnlimited'); }, value: 'infinite' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentOnce'); }, value: '1' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentTwice'); }, value: '2' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.component3Times'); }, value: '3' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.component5Times'); }, value: '5' },
];

const arrowOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.card.overageNone'); }, value: 'none' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentTarget'); }, value: 'end' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentSource2'); }, value: 'start' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBothEnds'); }, value: 'both' },
];

const arrowStyleOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentSolidTriangle'); }, value: 'triangle' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHollowArrow'); }, value: 'open' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDiamond'); }, value: 'diamond' },
];

const directionOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentForwardDirection'); }, value: 'forward' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.reverseDirection'); }, value: 'reverse' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentStationary'); }, value: 'static' },
];
</script>

<template>
  <CollapseItem :name="editorT('orgManage.memory.pathCol')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBasePath')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBendRatio')">
        <n-slider v-model:value="optionData.bendRatio" :min="0" :max="1" :step="0.05" :disabled="!canAdjustBendRatio" />
      </SettingItem>
      <SettingItem v-if="optionData.pathType === 'roundedElbow'" :name="editorT('bigscreenEditor.ui.componentCornerRadius')">
        <n-input-number v-model:value="optionData.cornerRadius" size="small" :min="0" :max="200" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLine')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLineStyle2')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLineWidth')">
        <n-input-number v-model:value="optionData.lineWidth" size="small" :min="1" :max="24" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBaseColor')">
        <n-color-picker v-model:value="optionData.baseColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentAnimationColor')">
        <n-color-picker v-model:value="optionData.effectColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentHoverHighlight')">
        <n-color-picker v-model:value="optionData.selectedColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDashLength')">
        <n-input-number v-model:value="optionData.dashLength" size="small" :min="1" :max="200" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentIntervalLength')">
        <n-input-number v-model:value="optionData.gapLength" size="small" :min="1" :max="300" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentEndpointRadius')">
        <n-input-number v-model:value="optionData.pointRadius" size="small" :min="0" :max="24" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentEndpointColor')">
        <n-color-picker v-model:value="optionData.pointColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem :name="editorT('bigscreenEditor.ui.componentArrow')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentArrowStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentArrowPosition')">
        <n-select v-model:value="optionData.arrow" size="small" :options="arrowOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentArrowStyle')">
        <n-select v-model:value="optionData.arrowStyle" size="small" :options="arrowStyleOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentArrowSize')">
        <n-input-number v-model:value="optionData.arrowSize" size="small" :min="4" :max="30" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSourceArrowColor')">
        <n-color-picker v-model:value="optionData.startArrowColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTargetArrowColor')">
        <n-color-picker v-model:value="optionData.endArrowColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem :name="editorT('bigscreenEditor.ui.animation')" :expanded="true">
    <SettingItemBox>
      <SettingItem>
        <div class="connect-line-toggle-item">
          <n-switch v-model:value="optionData.animate" size="small" />
          <n-text depth="3">{{ editorT('bigscreenEditor.ui.componentEnableAnimation') }}</n-text>
        </div>
      </SettingItem>
      <SettingItem>
        <div class="connect-line-toggle-item">
          <n-switch v-model:value="optionData.autoPlay" size="small" />
          <n-text depth="3">{{ editorT('bigscreenEditor.ui.componentAutoplay') }}</n-text>
        </div>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentAnimationDirection')">
        <n-select v-model:value="optionData.direction" size="small" :options="directionOptions" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPlaybackDuration')">
        <n-input-number v-model:value="optionData.duration" size="small" :min="0.2" :max="30" :step="0.2" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPlaybackCount')">
        <n-select v-model:value="optionData.playCount" size="small" :options="playCountOptions" :disabled="!optionData.animate" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem :name="editorT('bigscreenEditor.ui.componentEffect')" :expanded="false">
    <SettingItemBox>
      <SettingItem>
        <div class="connect-line-toggle-item">
          <n-switch v-model:value="optionData.glow" size="small" />
          <n-text depth="3">{{ editorT('bigscreenEditor.ui.componentEnableGlow') }}</n-text>
        </div>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentGlowColor')">
        <n-color-picker v-model:value="optionData.glowColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentGlowBlur')">
        <n-input-number v-model:value="optionData.glowBlur" size="small" :min="0" :max="40" />
      </SettingItem>
      <SettingItem>
        <div class="connect-line-toggle-item">
          <n-switch v-model:value="optionData.shadow" size="small" />
          <n-text depth="3">{{ editorT('bigscreenEditor.ui.componentEnableShadow') }}</n-text>
        </div>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowColor2')">
        <n-color-picker v-model:value="optionData.shadowColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowBlur')">
        <n-input-number v-model:value="optionData.shadowBlur" size="small" :min="0" :max="40" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem :name="editorT('bigscreenEditor.ui.componentHintsAndStatus')" :expanded="false">
    <SettingItemBox>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLabelText')">
        <n-input v-model:value="optionData.labelText" size="small" :placeholder="editorT('bigscreenEditor.ui.componentLineCenterText')" />
      </SettingItem>
      <SettingItem>
        <div class="connect-line-toggle-item">
          <n-switch v-model:value="optionData.showLabel" size="small" />
          <n-text depth="3">{{ editorT('bigscreenEditor.ui.componentShowLabels2') }}</n-text>
        </div>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLabelTextColor')">
        <n-color-picker v-model:value="optionData.labelColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLabelBackground')">
        <n-color-picker v-model:value="optionData.labelBgColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem>
        <div class="connect-line-toggle-item">
          <n-switch v-model:value="optionData.disabled" size="small" />
          <n-text depth="3">{{ editorT('bigscreenEditor.ui.componentDisabledState') }}</n-text>
        </div>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDisableLineColor')">
        <n-color-picker v-model:value="optionData.disabledColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDisableLabelBackground')">
        <n-color-picker v-model:value="optionData.disabledBgColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDisableLabelColor')">
        <n-color-picker v-model:value="optionData.disabledTextColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<style scoped>
.connect-line-toggle-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}
</style>
